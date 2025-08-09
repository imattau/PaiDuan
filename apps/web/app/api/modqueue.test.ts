import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { createRes } from './test-utils';

function createReq(method: string, body: any = {}) {
  return { method, body } as any;
}

describe('modqueue API', () => {
  let tempDir: string;
  let cwdSpy: any;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'modqueue-'));
    const dataDir = path.join(tempDir, 'apps', 'web', 'data');
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'modqueue.json'), '[]');
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(tempDir);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('adds and removes reports', async () => {
    const { default: handler } = await import('./modqueue');
    const report = { targetId: '1', targetKind: 'video', reason: 'spam', reporterPubKey: 'a', ts: 1 };
    let res = createRes();
    await handler(createReq('POST', report), res);
    expect(res.statusCode).toBe(200);

    let data = JSON.parse(fs.readFileSync(path.join(tempDir, 'apps/web/data/modqueue.json'), 'utf8'));
    expect(data.length).toBe(1);

    res = createRes();
    await handler(createReq('DELETE', { targetId: '1' }), res);
    expect(res.statusCode).toBe(200);
    data = JSON.parse(fs.readFileSync(path.join(tempDir, 'apps/web/data/modqueue.json'), 'utf8'));
    expect(data.length).toBe(0);
  });
});
