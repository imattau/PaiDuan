import { describe, it, expect } from 'vitest';
import handler from './creator-stats';

function createRes() {
  const res: any = {};
  res.statusCode = 200;
  res.headers = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.jsonData = null;
  res.json = (data: any) => {
    res.jsonData = data;
    return res;
  };
  return res;
}

describe('creator-stats API', () => {
  it('403 on wrong pubkey', async () => {
    const req: any = { method: 'GET', query: { pubkey: 'a' }, headers: { 'x-pubkey': 'b' } };
    const res = createRes();
    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });
});
