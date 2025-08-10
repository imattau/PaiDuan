import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './creator-stats/route';

describe('creator-stats API', () => {
  it('403 on wrong pubkey', async () => {
    const req = new NextRequest('http://localhost/api/creator-stats?pubkey=a', {
      headers: { 'x-pubkey': 'b' },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
