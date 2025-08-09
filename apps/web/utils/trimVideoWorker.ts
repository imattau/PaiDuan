import { createFile } from 'mp4box';

function detectCodec(blobType?: string, trackCodec?: string): string | null {
  const candidates = [trackCodec, blobType];
  for (const c of candidates) {
    if (!c) continue;
    const codec = c.toLowerCase();
    if (codec.includes('avc1') || codec.includes('h264')) return 'avc1';
    if (
      codec.includes('hvc1') ||
      codec.includes('hev1') ||
      codec.includes('hevc') ||
      codec.includes('h265')
    )
      return 'hvc1';
    if (codec.includes('vp8')) return 'vp8';
    if (codec.includes('vp9') || codec.includes('vp09')) return 'vp9';
    if (codec.includes('av01') || codec.includes('av1')) return 'av01';
    if (codec.includes('mp4v') || codec.includes('mpeg4')) return 'mp4v';
  }
  return null;
}

let encoder: any;
let decoder: any;

function postError(error: string, message: string) {
  self.postMessage({ type: 'error', error, message });
  try {
    encoder?.close?.();
  } catch {}
  try {
    decoder?.close?.();
  } catch {}
  self.close();
}

self.onmessage = async (e: MessageEvent) => {
  const { blob, start, end, width, height, bitrate } = e.data || {};
  try {
    if (typeof (self as any).VideoDecoder === 'undefined' || typeof (self as any).VideoEncoder === 'undefined') {
      postError('unsupported', 'WebCodecs not supported');
      return;
    }

    const buffer = await (blob as Blob).arrayBuffer();
    const mp4box = createFile();
    let track: any;
    let demuxError: any;
    const samples: { data: Uint8Array; timestamp: number; type: 'key' | 'delta' }[] = [];
    mp4box.onError = (err: any) => {
      demuxError = err;
    };
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
    try {
      (buffer as any).fileStart = 0;
      mp4box.appendBuffer(buffer);
      mp4box.flush();
    } catch (err) {
      demuxError = err;
    }

    if (demuxError || !track) {
      postError('demux-failed', 'Failed to demux video');
      return;
    }

    const codec = detectCodec((blob as Blob).type, track.codec);
    if (!codec) {
      postError('unsupported-codec', `Unsupported video codec: ${track.codec || (blob as Blob).type || 'unknown'}`);
      return;
    }
    const support = await (self as any).VideoDecoder.isConfigSupported({ codec });
    if (!support?.supported) {
      postError('unsupported-codec', `Codec ${codec} not supported`);
      return;
    }

    const outChunks: Uint8Array[] = [];
    encoder = new (self as any).VideoEncoder({
      output: (chunk: any) => {
        const arr = new Uint8Array(chunk.byteLength);
        chunk.copyTo(arr);
        outChunks.push(arr);
      },
      error: (err: any) => {
        postError('encode-error', String(err));
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
    decoder = new (self as any).VideoDecoder({
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
            try {
              encoder.encode(frame);
            } catch (err: any) {
              postError('encode-error', err?.message ?? String(err));
              return;
            }
            const progress = total > 0 ? (ts - start) / total : 1;
            self.postMessage({ type: 'progress', progress: Math.max(0, Math.min(1, progress)) });
          }
        } catch (err: any) {
          postError('decode-error', err?.message ?? String(err));
        } finally {
          frame.close();
        }
      },
      error: (err: any) => {
        postError('decode-error', String(err));
      },
    });

    decoder.configure({ codec });

    const firstKey = samples.findIndex((s) => s.type === 'key');
    if (firstKey < 0) {
      postError('no-keyframe', 'No key frame found');
      return;
    }
    const feed = samples.slice(firstKey);
    for (const s of feed) {
      const chunk = new (self as any).EncodedVideoChunk({
        type: s.type,
        timestamp: Math.round(s.timestamp),
        data: s.data,
      });
      try {
        decoder.decode(chunk);
      } catch (err: any) {
        postError('decode-error', err?.message ?? String(err));
        return;
      }
    }

    await decoder.flush();
    if (!encoderConfigured) {
      postError('encode-error', 'Failed to configure encoder due to missing dimensions');
      return;
    }
    await encoder.flush();

    const webmBlob = new Blob(outChunks, { type: 'video/webm' });
    self.postMessage({ type: 'done', blob: webmBlob });
    self.close();
  } catch (err: any) {
    postError('unknown', err?.message ?? String(err));
  }
};

export {};

