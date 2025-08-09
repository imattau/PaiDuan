#!/usr/bin/env node
import { mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import Gst from 'gstreamer-superficial';
import path from 'path';
import { fileURLToPath } from 'url';

export class Transcoder {
  constructor({ heights = [240, 480, 720], outDir = 'variants' } = {}) {
    this.heights = heights;
    this.outDir = outDir;
  }

  async downloadSource(srcUrl, dir) {
    const res = await fetch(srcUrl);
    if (!res.ok || !res.body) {
      throw new Error('Failed to download source');
    }
    const inputPath = path.join(dir, 'source');
    await pipeline(res.body, createWriteStream(inputPath));
    return inputPath;
  }

  async transcodeVariant(inputPath, height, file) {
    return new Promise((resolve, reject) => {
      const pipelineStr =
        `filesrc location="${inputPath}" ! decodebin ! videoconvert ! videoscale ! ` +
        `video/x-raw,height=${height} ! vp9enc ! webmmux ! filesink location="${file}"`;

      const p = new Gst.Pipeline(pipelineStr);
      p.pollBus((msg) => {
        switch (msg.type) {
          case 'eos':
            p.stop();
            resolve();
            break;
          case 'error':
            p.stop();
            reject(new Error(msg.error || 'GStreamer error'));
            break;
        }
      });
      p.play();
    });
  }

  writeManifest(variants, dir) {
    const manifest = {};
    for (const [h, file] of Object.entries(variants)) {
      manifest[h] = `/${file.replace(/\/g, '/')}`;
    }
    writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  }

  async transcode(srcUrl) {
    const id = randomUUID();
    const outDir = path.join(this.outDir, id);
    mkdirSync(outDir, { recursive: true });

    const inputPath = await this.downloadSource(srcUrl, outDir);
    const variants = {};
    for (const h of this.heights) {
      const file = path.join(outDir, `${h}.webm`);
      await this.transcodeVariant(inputPath, h, file);
      variants[h] = file;
    }
    this.writeManifest(variants, outDir);
    return outDir;
  }
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  const srcUrl = process.argv[2];
  if (!srcUrl) {
    console.error('Usage: pnpm --filter transcoder start <srcUrl>');
    process.exit(1);
  }

  const transcoder = new Transcoder();
  transcoder
    .transcode(srcUrl)
    .then((outDir) => console.log('Created variants in', outDir))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
