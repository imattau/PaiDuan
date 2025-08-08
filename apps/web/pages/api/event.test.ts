import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from './event';
import { createRes } from './test-utils';

function createReq(body: any = {}, headers: any = {}) {
  return { method: 'POST', body, headers } as any;
}

describe('event API', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ANALYTICS;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ANALYTICS = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns 204 when analytics disabled', async () => {
    delete process.env.NEXT_PUBLIC_ANALYTICS;
    const req = createReq();
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(204);
    expect(res.endCalled).toBe(true);
  });

  it('still ends when fetch fails', async () => {
    process.env.NEXT_PUBLIC_ANALYTICS = 'enabled';
    const fetchMock = vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    const req = createReq({ event: 'test' }, { 'user-agent': 'ua', 'x-forwarded-for': 'ip' });
    const res = createRes();
    await handler(req, res);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(204);
  });
});
