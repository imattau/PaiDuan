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

  it('returns full avc1 codec string when profile and level are present', () => {
    expect(detectCodec(undefined, 'avc1.640028')).toBe('avc1.640028');
  });

  it('returns null for unknown codecs', () => {
    expect(detectCodec(undefined, 'unknown')).toBeNull();
  });
});
