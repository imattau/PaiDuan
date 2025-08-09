import { createFile } from 'mp4box';
import { Decoder as EBMLDecoder } from 'ts-ebml';
import { WebMMuxer, ArrayBufferTarget as WebMTarget } from 'webm-muxer';
import * as MP4Muxer from 'mp4-muxer';
import * as Comlink from 'comlink';

// Exported for tests
export { detectCodec };

let encoder: any;
let decoder: any;

interface Sample {
  data: Uint8Array;
  timestamp: number; // in microseconds
  type: 'key' | 'delta';
}

interface DemuxResult {
  codec: string;
  width: number;
  height: number;
  samples: Sample[];
  container: 'mp4' | 'webm';
}

function fail(error: string, message: string): never {
  try {
    encoder?.close?.();
  } catch {}
  try {
    decoder?.close?.();
  } catch {}
  throw Object.assign(new Error(message), { code: error });
}

// Map various codec identifiers to WebCodecs codec strings
function detectCodec(blobType?: string, trackCodec?: string): string | null {
  const candidates = [trackCodec, blobType];
  for (const c of candidates) {
    if (!c) continue;
    const codec = c.toLowerCase();
    if (
      codec.startsWith('avc') ||
      codec.includes('h264') ||
      codec.includes('x264') ||
      codec.includes('v_mpeg4/iso/avc')
    )
      return 'avc1';
    if (
      codec.includes('hvc1') ||
      codec.includes('hev1') ||
      codec.includes('hevc') ||
      codec.includes('h265')
    )
      return 'hvc1';
    if (codec.includes('vp8') || codec.includes('v_vp8')) return 'vp8';
    if (codec.includes('vp9') || codec.includes('vp09') || codec.includes('v_vp9')) return 'vp9';
    if (codec.includes('av01') || codec.includes('av1') || codec.includes('v_av1')) return 'av01';
    if (codec.includes('mp4v') || codec.includes('mpeg4')) return 'mp4v';
  }
  return null;
}

function readVint(buf: Uint8Array): { length: number; value: number } {
  const first = buf[0];
  let mask = 0x80;
  let len = 1;
  while (len <= 8 && (first & mask) === 0) {
    mask >>= 1;
    len++;
  }
  let value = first & (mask - 1);
  for (let i = 1; i < len; i++) {
    value = (value << 8) | buf[i];
  }
  return { length: len, value };
}

function demuxWebM(buffer: ArrayBuffer): DemuxResult {
  const decoder = new EBMLDecoder();
  const elements = decoder.decode(buffer);
  const stack: string[] = [];
  let track: any = {};
  let videoTrack = -1;
  let codec = '';
  let width = 0;
  let height = 0;
  let timecodeScale = 1_000_000; // default nanoseconds -> us
  let clusterTimecode = 0;
  const samples: Sample[] = [];

  for (const el of elements) {
    if (el.type === 'm') {
      if (!el.isEnd) {
        stack.push(el.name);
        if (el.name === 'TrackEntry') track = {};
      } else {
        const name = stack.pop();
        if (name === 'TrackEntry') {
          if (track.TrackType === 1 && videoTrack === -1) {
            videoTrack = track.TrackNumber;
            codec = track.CodecID;
            width = track.PixelWidth || 0;
            height = track.PixelHeight || 0;
          }
          track = {};
        }
      }
      continue;
    }
    const ctx = stack.join('/');
    if (ctx.endsWith('Info') && el.name === 'TimecodeScale') {
      timecodeScale = el.value;
    } else if (ctx.endsWith('Tracks/TrackEntry')) {
      track[el.name] = el.value;
    } else if (ctx.endsWith('Cluster')) {
      if (el.name === 'Timecode') {
        clusterTimecode = el.value;
      } else if (el.name === 'SimpleBlock') {
        const data = el.value as Uint8Array;
        let offset = 0;
        const vint = readVint(data.subarray(offset));
        const trackNum = vint.value;
        offset += vint.length;
        const relTime = (data[offset] << 8) | data[offset + 1];
        offset += 2;
        const flags = data[offset];
        offset += 1;
        const key = (flags & 0x80) !== 0;
        if (trackNum === videoTrack) {
          const ts = (clusterTimecode + (relTime << 0)) * (timecodeScale / 1000);
          samples.push({
            data: data.subarray(offset),
            timestamp: ts,
            type: key ? 'key' : 'delta',
          });
        }
      }
    }
  }

  const webmCodec = detectCodec(undefined, codec);
  if (!webmCodec) fail('unsupported-codec', `Unsupported video codec: ${codec}`);
  return { codec: webmCodec, width, height, samples, container: 'webm' };
}

async function demuxMP4(buffer: ArrayBuffer): Promise<DemuxResult> {
  const mp4box = createFile();
  let track: any;
  let demuxError: any;
  const samples: Sample[] = [];
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
  const codec = detectCodec(undefined, track.codec);
  if (!codec) {
    fail('unsupported-codec', `Unsupported video codec: ${track.codec || 'unknown'}`);
  }
  const width = track.track_width || track.tkhd?.width || 0;
  const height = track.track_height || track.tkhd?.height || 0;
  return { codec, width, height, samples, container: 'mp4' };
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

  const container = blob.type.includes('webm') ? 'webm' : 'mp4';
  const demux = container === 'webm' ? demuxWebM(buffer) : await demuxMP4(buffer);
  let { codec, width: srcW, height: srcH, samples } = demux;

  let support;
  try {
    support = await (self as any).VideoDecoder.isConfigSupported({ codec });
  } catch (err: any) {
    fail('permission', err?.message ?? String(err));
  }
  if (!support?.supported) {
    fail('unsupported-codec', `Codec ${codec} not supported`);
  }

  const encWidth = width ?? srcW;
  const encHeight = height ?? srcH;

  const target = container === 'webm'
    ? new WebMTarget()
    : new (MP4Muxer as any).ArrayBufferTarget();

  const muxer = container === 'webm'
    ? new WebMMuxer({ target, video: { codec, width: encWidth, height: encHeight } })
    : new (MP4Muxer as any)({ target, video: { codec, width: encWidth, height: encHeight } });

  encoder = new (self as any).VideoEncoder({
    output: (chunk: any) => {
      try {
        (muxer as any).addVideoChunk(chunk);
      } catch (err: any) {
        fail('encode-error', err?.message ?? String(err));
      }
    },
    error: (err: any) => {
      fail('encode-error', String(err));
    },
  });

  encoder.configure({
    codec,
    width: encWidth,
    height: encHeight,
    bitrate: bitrate ?? 1_000_000,
    framerate: 30,
  });

  const limitEnd = end ?? start + 300; // default 5 minutes
  const total = limitEnd - start;

  decoder = new (self as any).VideoDecoder({
    output: (frame: VideoFrame) => {
      try {
        const ts = frame.timestamp / 1e6; // microseconds -> seconds
        if (ts >= start && ts <= limitEnd) {
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
  await encoder.flush();
  try {
    encoder.close?.();
  } catch {}
  try {
    decoder.close?.();
  } catch {}

  const outBuffer = (muxer as any).finalize
    ? (muxer as any).finalize().buffer || (muxer as any).finalize()
    : (target as any).buffer;

  return Comlink.transfer(
    { buffer: outBuffer, type: container === 'webm' ? 'video/webm' : 'video/mp4' },
    [outBuffer],
  );
}

Comlink.expose({ trim });

export {};

