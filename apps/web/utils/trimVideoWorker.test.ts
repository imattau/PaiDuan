import { beforeAll, describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

let detectCodec: (blobType?: string, trackCodec?: string) => string | null;
let trim: any;

beforeAll(async () => {
  (globalThis as any).self = globalThis;
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
  it('decodes H.264 sample without throwing', async () => {
    class FakeEncodedVideoChunk {
      type: 'key' | 'delta';
      timestamp: number;
      data: Uint8Array;
      byteLength: number;
      constructor({ type, timestamp, data }: any) {
        this.type = type;
        this.timestamp = timestamp;
        this.data = data ?? new Uint8Array();
        this.byteLength = this.data.byteLength;
      }
      copyTo(dest: Uint8Array) {
        dest.set(this.data);
      }
    }

    class FakeVideoFrame {
      constructor(public timestamp: number) {
        this.codedWidth = 1920;
        this.codedHeight = 1080;
      }
      codedWidth: number;
      codedHeight: number;
      close() {}
    }

    class FakeVideoEncoder {
      constructor(private opts: any) {}
      configure(_cfg: any) {}
      encode(_frame: any) {
        this.opts.output(
          new FakeEncodedVideoChunk({
            type: 'key',
            timestamp: 0,
            data: new Uint8Array([1, 2, 3]),
          }),
        );
      }
      flush() {
        return Promise.resolve();
      }
      close() {}
    }

    class FakeVideoDecoder {
      constructor(private opts: any) {}
      static async isConfigSupported(cfg: any) {
        if (!cfg.description) throw new Error('missing description');
        return { supported: true };
      }
      configure(cfg: any) {
        if (!cfg.description) throw new Error('missing description');
      }
      decode(chunk: any) {
        this.opts.output(new FakeVideoFrame(chunk.timestamp));
      }
      flush() {
        return Promise.resolve();
      }
      close() {}
    }

    (globalThis as any).EncodedVideoChunk = FakeEncodedVideoChunk;
    (globalThis as any).VideoFrame = FakeVideoFrame;
    (globalThis as any).VideoEncoder = FakeVideoEncoder;
    (globalThis as any).VideoDecoder = FakeVideoDecoder;

    const base64 = await fs.promises.readFile(
      path.join(__dirname, '__fixtures__', 'h264.base64'),
      'utf8',
    );
    const file = Buffer.from(base64, 'base64');
    const blob = new Blob([file], { type: 'video/mp4' });
    await expect(trim(blob, { start: 0, end: 1 })).resolves.toHaveProperty('buffer');
  });
});
