import { beforeAll, describe, expect, it } from 'vitest';

let detectCodec: (blobType?: string, trackCodec?: string) => string | null;

beforeAll(async () => {
  (globalThis as any).self = {
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).addEventListener = () => {};
  (globalThis as any).removeEventListener = () => {};
  ({ detectCodec } = await import('./trimVideoWorker'));
});

describe('detectCodec', () => {
  it('maps H.264 aliases to avc1', () => {
    expect(detectCodec(undefined, 'avc3')).toBe('avc1');
    expect(detectCodec(undefined, 'avc4')).toBe('avc1');
    expect(detectCodec(undefined, 'x264')).toBe('avc1');
  });

  it('detects WebM codecs', () => {
    expect(detectCodec(undefined, 'V_VP8')).toBe('vp8');
    expect(detectCodec(undefined, 'V_VP9')).toBe('vp9');
  });

  it('returns null for unknown codecs', () => {
    expect(detectCodec(undefined, 'unknown')).toBeNull();
  });
});
