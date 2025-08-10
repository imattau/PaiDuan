import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';

class TestTranscoder {
  constructor({ heights = [240, 480], outDir, completionOrder }) {
    this.heights = heights;
    this.outDir = outDir;
    this.completionOrder = completionOrder;
  }

  async downloadSource(_url, dir) {
    const input = path.join(dir, 'source');
    writeFileSync(input, '');
    return input;
  }

  async transcodeVariant(_input, height, file) {
    return new Promise((resolve) => {
      const delay = height === 240 ? 20 : 10;
      setTimeout(() => {
        writeFileSync(file, '');
        this.completionOrder.push(height);
        resolve();
      }, delay);
    });
  }

  writeManifest(variants, dir) {
    const manifest = {};
    for (const [h, file] of Object.entries(variants)) {
      manifest[h] = `/${file.replace(/\\/g, '/')}`;
    }
    writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  }

  async transcode(srcUrl) {
    const outDir = path.join(this.outDir, 'test');
    mkdirSync(outDir, { recursive: true });
    const inputPath = await this.downloadSource(srcUrl, outDir);

    const results = await Promise.all(
      this.heights.map((h) => {
        const file = path.join(outDir, `${h}.webm`);
        mkdirSync(path.dirname(file), { recursive: true });
        return this.transcodeVariant(inputPath, h, file).then(() => [h, file]);
      }),
    );

    const variants = {};
    for (const [h, file] of results) {
      variants[h] = file;
    }

    this.writeManifest(variants, outDir);
    return outDir;
  }
}

describe('transcode parallel', () => {
  it('writes correct manifest with parallel variant processing', async () => {
    const tmpRoot = mkdtempSync(path.join(os.tmpdir(), 'transcoder-'));
    const completionOrder = [];
    const transcoder = new TestTranscoder({ outDir: tmpRoot, completionOrder });
    const outDir = await transcoder.transcode('http://example.com/video');

    expect(completionOrder[0]).toBe(480);

    const manifest = JSON.parse(readFileSync(path.join(outDir, 'manifest.json'), 'utf8'));
    const expected = {
      240: `/${path.join(outDir, '240.webm').replace(/\\/g, '/')}`,
      480: `/${path.join(outDir, '480.webm').replace(/\\/g, '/')}`,
    };
    expect(manifest).toEqual(expected);

    rmSync(tmpRoot, { recursive: true, force: true });
  });
});
