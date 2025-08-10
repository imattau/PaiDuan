import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './transcode/route';

function createReq(body: any = {}, method = 'POST') {
  return new NextRequest('http://localhost/api/transcode', {
    method,
    body: JSON.stringify(body),
  });
}

describe('transcode API', () => {
  it('fails when src missing', async () => {
    const req = createReq({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'missing src' });
  });

  it('returns manifest url', async () => {
    const req = createReq({ src: 'https://example.com/video.mp4' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.manifest).toMatch(/manifest.json$/);
  });
});
