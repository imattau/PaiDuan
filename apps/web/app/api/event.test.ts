import { describe, it, expect, vi, afterEach } from 'vitest';
import { AxiosError } from 'axios';
import { sanitizeAxiosError } from '@/utils/sanitizeAxiosError';
import { NextRequest } from 'next/server';
import { POST } from './event/route';

function createReq(body: any = {}, headers: any = {}) {
  return new NextRequest('http://localhost/api/event', {
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
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
    const res = await POST(req);
    expect(res.status).toBe(204);
  });

  it('still ends when fetch fails', async () => {
    process.env.NEXT_PUBLIC_ANALYTICS = 'enabled';
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockRejectedValue(sanitizeAxiosError(new AxiosError('network')));
    const req = createReq({ event: 'test' }, { 'user-agent': 'ua', 'x-forwarded-for': 'ip' });
    const res = await POST(req);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.status).toBe(204);
  });
});
