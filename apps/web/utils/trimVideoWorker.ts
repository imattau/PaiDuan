import MP4Box from 'mp4box';

function detectCodec(blobType?: string, trackCodec?: string): string | null {
  const candidates = [trackCodec, blobType];
  for (const c of candidates) {
    if (!c) continue;
    const codec = c.toLowerCase();
    if (codec.includes('avc1') || codec.includes('h264')) return 'avc1';
    if (codec.includes('vp8')) return 'vp8';
    if (codec.includes('vp9') || codec.includes('vp09')) return 'vp9';
    if (codec.includes('av01') || codec.includes('av1')) return 'av01';
  }
  return null;
}

self.onmessage = async (e: MessageEvent) => {
  const { blob, start, end, width, height, bitrate } = e.data || {};
  try {
    // Basic capability check
    if (typeof (self as any).VideoDecoder === 'undefined' || typeof (self as any).VideoEncoder === 'undefined') {
      self.postMessage({ type: 'error', message: 'WebCodecs not supported' });
      return;
    }

    // Demux the container using mp4box.js to extract encoded samples with real timestamps
    const buffer = await (blob as Blob).arrayBuffer();
    const mp4box = MP4Box.createFile();
    let track: any;
    const samples: { data: Uint8Array; timestamp: number; type: 'key' | 'delta' }[] = [];
    mp4box.onReady = (info: any) => {
      track = info.videoTracks?.[0];
      if (track) {
        mp4box.setExtractionOptions(track.id);
        mp4box.start();
      }
    };
    mp4box.onSamples = (_id: number, _user: any, samps: any[]) => {
      if (!track) return;
      for (const s of samps) {
        samples.push({
          data: s.data,
          timestamp: (s.dts / track.timescale) * 1_000_000,
          type: s.is_sync ? 'key' : 'delta',
        });
      }
    };
    (buffer as any).fileStart = 0;
    mp4box.appendBuffer(buffer);
    mp4box.flush();

    if (!track) {
      throw new Error('No video track found');
    }

    const codec = detectCodec((blob as Blob).type, track.codec);
    if (!codec) {
      throw new Error(`Unsupported video codec: ${track.codec || (blob as Blob).type || 'unknown'}`);
    }
    const support = await (self as any).VideoDecoder.isConfigSupported({ codec });
    if (!support?.supported) {
      throw new Error(`Codec ${codec} not supported`);
    }

    const outChunks: Uint8Array[] = [];
    const encoder = new (self as any).VideoEncoder({
      output: (chunk: any) => {
        const arr = new Uint8Array(chunk.byteLength);
        chunk.copyTo(arr);
        outChunks.push(arr);
      },
      error: (err: any) => {
        self.postMessage({ type: 'error', message: String(err) });
      },
    });

    let encoderConfigured = false;
    if (width && height) {
      encoder.configure({
        codec: 'vp8',
        width,
        height,
        bitrate: bitrate ?? 1_000_000,
        framerate: 30,
      });
      encoderConfigured = true;
    }

    const total = (end ?? 0) - start;

    const decoder = new (self as any).VideoDecoder({
      output: (frame: VideoFrame) => {
        try {
          if (!encoderConfigured) {
            const w = frame.codedWidth;
            const h = frame.codedHeight;
            if (!w || !h) {
              throw new Error('Unable to determine video dimensions');
            }
            encoder.configure({
              codec: 'vp8',
              width: w,
              height: h,
              bitrate: bitrate ?? 1_000_000,
              framerate: 30,
            });
            encoderConfigured = true;
          }

          const ts = frame.timestamp / 1e6; // microseconds -> seconds
          if (ts >= start && (end === undefined || ts <= end)) {
            encoder.encode(frame);
            const progress = total > 0 ? (ts - start) / total : 1;
            self.postMessage({ type: 'progress', progress: Math.max(0, Math.min(1, progress)) });
          }
        } catch (err: any) {
          self.postMessage({ type: 'error', message: err?.message ?? String(err) });
        } finally {
          frame.close();
        }
      },
      error: (err: any) => {
        self.postMessage({ type: 'error', message: String(err) });
      },
    });

    decoder.configure({ codec });

    // Ensure the first chunk fed to the decoder is a key frame
    const firstKey = samples.findIndex((s) => s.type === 'key');
    const feed = firstKey >= 0 ? samples.slice(firstKey) : samples;
    for (const s of feed) {
      const chunk = new (self as any).EncodedVideoChunk({
        type: s.type,
        timestamp: Math.round(s.timestamp),
        data: s.data,
      });
      decoder.decode(chunk);
    }

    await decoder.flush();
    if (!encoderConfigured) {
      throw new Error('Failed to configure encoder due to missing dimensions');
    }
    await encoder.flush();

    const result = new Blob(outChunks, { type: 'video/webm' });
    self.postMessage({ type: 'done', blob: result });
  } catch (err: any) {
    self.postMessage({ type: 'error', message: err?.message ?? String(err) });
  }
};

export {};
