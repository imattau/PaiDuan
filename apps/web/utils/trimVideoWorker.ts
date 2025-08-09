import { createFile } from 'mp4box';
import { detectCodec } from './codec';
import * as Comlink from 'comlink';

export { detectCodec } from './codec';

let encoder: any;
let decoder: any;

function fail(error: string, message: string): never {
  try {
    encoder?.close?.();
  } catch {}
  try {
    decoder?.close?.();
  } catch {}
  throw Object.assign(new Error(message), { code: error });
}

interface TrimOptions {
  start: number;
  end?: number;
  width?: number;
  height?: number;
  bitrate?: number;
}

async function trim(
  blob: Blob,
  { start, end, width, height, bitrate }: TrimOptions,
  onProgress: (progress: number) => void = () => {},
): Promise<Blob> {
  if (typeof (self as any).VideoDecoder === 'undefined' || typeof (self as any).VideoEncoder === 'undefined') {
    fail('unsupported', 'WebCodecs not supported');
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await blob.arrayBuffer();
  } catch (err: any) {
    fail('permission', err?.message ?? String(err));
  }

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
    fail('demux-failed', 'Failed to demux video');
  }

  const codec = detectCodec(blob.type, track.codec);
  if (!codec) {
    fail('unsupported-codec', `Unsupported video codec: ${track.codec || blob.type || 'unknown'}`);
  }
  let support;
  try {
    support = await (self as any).VideoDecoder.isConfigSupported({ codec });
  } catch (err: any) {
    fail('permission', err?.message ?? String(err));
  }
  if (!support?.supported) {
    fail('unsupported-codec', `Codec ${codec} not supported`);
  }

  const outChunks: Uint8Array[] = [];
  encoder = new (self as any).VideoEncoder({
    output: (chunk: any) => {
      const arr = new Uint8Array(chunk.byteLength);
      chunk.copyTo(arr);
      outChunks.push(arr);
    },
    error: (err: any) => {
      fail('encode-error', String(err));
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
            fail('encode-error', err?.message ?? String(err));
          }
          const progress = total > 0 ? (ts - start) / total : 1;
          try {
            onProgress(Math.max(0, Math.min(1, progress)));
          } catch {}
        }
      } catch (err: any) {
        fail('decode-error', err?.message ?? String(err));
      } finally {
        frame.close();
      }
    },
    error: (err: any) => {
      fail('decode-error', String(err));
    },
  });

  decoder.configure({ codec });

  const firstKey = samples.findIndex((s) => s.type === 'key');
  if (firstKey < 0) {
    fail('no-keyframe', 'No key frame found');
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
      fail('decode-error', err?.message ?? String(err));
    }
  }

  await decoder.flush();
  if (!encoderConfigured) {
    fail('encode-error', 'Failed to configure encoder due to missing dimensions');
  }
  await encoder.flush();
  try {
    encoder.close?.();
  } catch {}
  try {
    decoder.close?.();
  } catch {}

  return new Blob(outChunks, { type: 'video/webm' });
}

Comlink.expose({ trim });

export {};

