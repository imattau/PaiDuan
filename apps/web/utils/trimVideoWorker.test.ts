import { beforeAll, describe, expect, it, vi } from 'vitest';

let includeDescription = true;
vi.mock('mp4box', () => ({
  createFile: () => {
    const track: any = {
      id: 1,
      timescale: 1000,
      codec: 'avc1.4d401e',
    };
    if (includeDescription) {
      track.avcDecoderConfigRecord = {
        SPS: [new Uint8Array([0x67, 0x64, 0x00, 0x1e])],
        PPS: [new Uint8Array([0x68, 0xee, 0x3c, 0x80])],
      };
    }
    const samps = [
      { data: new Uint8Array([0]), dts: 0, is_sync: true },
      { data: new Uint8Array([1]), dts: 1000, is_sync: false },
    ];
    return {
      onReady: undefined as any,
      onSamples: undefined as any,
      setExtractionOptions() {},
      start() {},
      appendBuffer() {
        this.onReady?.({ videoTracks: [track] });
        this.onSamples?.(track.id, null, samps);
      },
      flush() {},
    };
  },
}));

vi.mock('jswebm', () => ({}));

let detectCodec: (blobType?: string, trackCodec?: string) => string | null;
let trim: (
  blob: Blob,
  options: { start: number; end?: number; width?: number; height?: number; bitrate?: number },
  onProgress?: (p: number) => void,
) => Promise<{ buffer: ArrayBuffer; type: string }>;

beforeAll(async () => {
  (globalThis as any).self = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).addEventListener = () => {};
  (globalThis as any).removeEventListener = () => {};
  ({ detectCodec, trim } = await import('./trimVideoWorker'));
});

describe('detectCodec', () => {
  it('maps H.264 aliases to avc1', () => {
    expect(detectCodec(undefined, 'avc3')).toBe('avc1');
    expect(detectCodec(undefined, 'avc4')).toBe('avc1');
    expect(detectCodec(undefined, 'x264')).toBe('avc1');
  });

  it('returns full avc1 codec string when profile and level are present', () => {
    expect(detectCodec(undefined, 'avc1.640028')).toBe('avc1.640028');
  });

  it('extracts codec from blob type parameters', () => {
    expect(
      detectCodec('video/mp4; codecs="avc1.4d401e, mp4a.40.2"')
    ).toBe('avc1.4d401e');
    expect(
      detectCodec('video/mp4; codecs="mp4a.40.2,avc1"')
    ).toBe('avc1');
  });

  it('returns null for unknown codecs', () => {
    expect(detectCodec(undefined, 'unknown')).toBeNull();
  });
});

describe('trim', () => {
  it('trims H.264 clip without key frame error', async () => {
    class FakeVideoFrame {
      timestamp: number;
      codedWidth = 640;
      codedHeight = 480;
      constructor(ts: number) {
        this.timestamp = ts;
      }
      close() {}
    }
    class FakeEncodedVideoChunk {
      type: any;
      timestamp: number;
      byteLength: number;
      data: Uint8Array;
      constructor(init: any) {
        this.type = init.type;
        this.timestamp = init.timestamp;
        this.data = init.data;
        this.byteLength = init.data.length;
      }
      copyTo(arr: Uint8Array) {
        arr.set(this.data);
      }
    }
    let configured: any;
    class FakeVideoDecoder {
      static async isConfigSupported(config: any) {
        if (!(config.description instanceof Uint8Array)) {
          throw new Error('missing description');
        }
        return { supported: true, config };
      }
      private output: any;
      constructor(init: any) {
        this.output = init.output;
      }
      configure(config: any) {
        configured = config;
      }
      decode(chunk: any) {
        if (!configured.description?.length) {
          throw new Error('key frame required');
        }
        this.output(new FakeVideoFrame(chunk.timestamp));
      }
      async flush() {}
      close() {}
    }
    class FakeVideoEncoder {
      constructor(private init: any) {}
      configure() {}
      encode(frame: any) {
        this.init.output({
          byteLength: 1,
          copyTo: (arr: Uint8Array) => arr.set([1]),
        });
      }
      async flush() {}
      close() {}
    }
    (self as any).EncodedVideoChunk = FakeEncodedVideoChunk;
    (self as any).VideoDecoder = FakeVideoDecoder;
    (self as any).VideoEncoder = FakeVideoEncoder;

    const blob = new Blob([new Uint8Array([0])], { type: 'video/mp4' });
    const result = await trim(blob, { start: 0, end: 1 }, () => {});
    expect(result.type).toBe('video/mp4');
    expect(result.buffer.byteLength).toBeGreaterThan(0);
  });

  it('includes SPS/PPS description in decoder config', async () => {
    class FakeVideoFrame {
      timestamp: number;
      codedWidth = 640;
      codedHeight = 480;
      constructor(ts: number) {
        this.timestamp = ts;
      }
      close() {}
    }
    class FakeEncodedVideoChunk {
      type: any;
      timestamp: number;
      byteLength: number;
      data: Uint8Array;
      constructor(init: any) {
        this.type = init.type;
        this.timestamp = init.timestamp;
        this.data = init.data;
        this.byteLength = init.data.length;
      }
      copyTo(arr: Uint8Array) {
        arr.set(this.data);
      }
    }
    let configured: any;
    class FakeVideoDecoder {
      static async isConfigSupported(config: any) {
        return { supported: true, config };
      }
      private output: any;
      constructor(init: any) {
        this.output = init.output;
      }
      configure(config: any) {
        configured = config;
      }
      decode(chunk: any) {
        this.output(new FakeVideoFrame(chunk.timestamp));
      }
      async flush() {}
      close() {}
    }
    class FakeVideoEncoder {
      constructor(private init: any) {}
      configure() {}
      encode(frame: any) {
        this.init.output({
          byteLength: 1,
          copyTo: (arr: Uint8Array) => arr.set([1]),
        });
      }
      async flush() {}
      close() {}
    }
    (self as any).EncodedVideoChunk = FakeEncodedVideoChunk;
    (self as any).VideoDecoder = FakeVideoDecoder;
    (self as any).VideoEncoder = FakeVideoEncoder;

    const blob = new Blob([new Uint8Array([0])], { type: 'video/mp4' });
    await trim(blob, { start: 0, end: 1 }, () => {});
    expect(configured.description).toBeInstanceOf(Uint8Array);
    expect(configured.description.length).toBeGreaterThan(0);
  });

  it('fails when SPS/PPS data is missing for H.264', async () => {
    includeDescription = false;
    (self as any).VideoDecoder = class {};
    (self as any).VideoEncoder = class {};
    const blob = new Blob([new Uint8Array([0])], { type: 'video/mp4' });
    await expect(trim(blob, { start: 0, end: 1 }, () => {})).rejects.toMatchObject({
      code: 'missing-avc-description',
      message: 'H.264 stream lacks SPS/PPS data',
    });
    includeDescription = true;
  });
});
