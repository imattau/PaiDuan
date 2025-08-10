import MP4Box from 'mp4box';
import JsWebm from 'jswebm';
import * as Comlink from 'comlink';

export function detectCodec(blobType?: string, trackCodec?: string): string | null {
  const candidates = [trackCodec, blobType];
  for (const c of candidates) {
    if (!c) continue;

    const match = /codecs?=["']?([^"';]+)/i.exec(c);
    const list = (match ? match[1] : c).split(',');
    for (const raw of list) {
      const codec = raw.trim().toLowerCase();
      if (!codec) continue;
      if (/^avc\d\.[0-9a-f]+$/i.test(codec)) return codec;
      if (codec.startsWith('avc') || codec.includes('h264') || codec.includes('x264')) return 'avc1';
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
  }
  return null;
}

function detectContainer(blobType?: string): 'mp4' | 'webm' | null {
  if (!blobType) return null;
  const type = blobType.toLowerCase();
  if (type.includes('webm')) return 'webm';
  if (type.includes('mp4') || type.includes('mpeg4') || type.includes('quicktime')) return 'mp4';
  return null;
}

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
): Promise<{ buffer: ArrayBuffer; type: string }> {
  if (typeof (self as any).VideoDecoder === 'undefined' || typeof (self as any).VideoEncoder === 'undefined') {
    fail('unsupported', 'WebCodecs not supported');
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await blob.arrayBuffer();
  } catch (err: any) {
    fail('permission', err?.message ?? String(err));
  }

  if (end === undefined || end - start > 300) {
    end = start + 300;
  }

  const container = detectContainer(blob.type) || 'mp4';
  let track: any;
  let demuxError: any;
  const samples: { data: Uint8Array; timestamp: number; type: 'key' | 'delta' }[] = [];

  if (container === 'webm') {
    try {
      const demuxer: any = new (JsWebm as any)();
      demuxer.dataInterface.recieveInput(buffer);
      demuxer.load();
      track = demuxer.videoTrack;
      for (const p of demuxer.videoPackets) {
        samples.push({
          data: new Uint8Array(p.data),
          timestamp: p.timestamp * 1_000_000,
          type: p.isKeyframe ? 'key' : 'delta',
        });
      }
    } catch (err) {
      demuxError = err;
    }
    } else {
      const mp4box = MP4Box.createFile();
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
  }

  if (demuxError || !track) {
    fail('demux-failed', 'Failed to demux video');
  }

  const codec = detectCodec(blob.type, track.codecID || track.codec);
  if (!codec) {
    fail(
      'unsupported-codec',
      `Unsupported video codec: ${track.codecID || track.codec || blob.type || 'unknown'}`,
    );
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
      codec,
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
            codec,
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

  const mime = container === 'webm' ? 'video/webm' : 'video/mp4';
  const size = outChunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of outChunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return { buffer: out.buffer, type: mime };
}

Comlink.expose({ trim });

export {};

