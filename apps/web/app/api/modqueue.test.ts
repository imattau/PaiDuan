import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    const { POST, DELETE } = await import('./modqueue/route');
    const report = { targetId: '1', targetKind: 'video', reason: 'spam', reporterPubKey: 'a', ts: 1 };
    let res = await POST(
      new Request('http://localhost/api/modqueue', {
        method: 'POST',
        body: JSON.stringify(report),
      })
    );
    expect(res.status).toBe(200);

    let data = JSON.parse(fs.readFileSync(path.join(tempDir, 'apps/web/data/modqueue.json'), 'utf8'));
    expect(data.length).toBe(1);

    res = await DELETE(
      new Request('http://localhost/api/modqueue', {
        method: 'DELETE',
        body: JSON.stringify({ targetId: '1' }),
      })
    );
    expect(res.status).toBe(200);
    data = JSON.parse(fs.readFileSync(path.join(tempDir, 'apps/web/data/modqueue.json'), 'utf8'));
    expect(data.length).toBe(0);
  });
});
