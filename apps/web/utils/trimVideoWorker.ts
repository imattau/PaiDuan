self.onmessage = async (e: MessageEvent) => {
  const { blob, start, end, width, height, bitrate } = e.data || {};
  try {
    // Basic capability check
    if (typeof (self as any).VideoDecoder === 'undefined' || typeof (self as any).VideoEncoder === 'undefined') {
      self.postMessage({ type: 'error', message: 'WebCodecs not supported' });
      return;
    }

    // Read the blob as a stream so we can feed it to the decoder.
    const reader = (blob as Blob).stream().getReader();

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

    decoder.configure({ codec: 'vp8' });

    let timestamp = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = new (self as any).EncodedVideoChunk({
        type: 'key',
        timestamp,
        data: value,
      });
      timestamp += 1_000_000; // placeholder increment
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
