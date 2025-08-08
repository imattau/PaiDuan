import { describe, it, expect } from 'vitest';
import handler from './transcode';
import { createRes } from './test-utils';

function createReq(body: any = {}, method = 'POST') {
  return { method, body } as any;
}

describe('transcode API', () => {
  it('fails when src missing', async () => {
    const req = createReq({});
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toEqual({ error: 'missing src' });
  });

  it('returns manifest url', async () => {
    const req = createReq({ src: 'https://example.com/video.mp4' });
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.jsonData.manifest).toMatch(/manifest.json$/);
  });
});
