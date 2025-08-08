#!/usr/bin/env node
import { mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import Gst from 'gstreamer-superficial';
import path from 'path';

async function main() {
  const srcUrl = process.argv[2];
  if (!srcUrl) {
    console.error('Usage: pnpm --filter transcoder start <srcUrl>');
    process.exit(1);
  }

  const id = randomUUID();
  const outDir = path.join('variants', id);
  mkdirSync(outDir, { recursive: true });

  // download source
  const res = await fetch(srcUrl);
  if (!res.ok || !res.body) {
    console.error('Failed to download source');
    process.exit(1);
  }
  const inputPath = path.join(outDir, 'source');
  await pipeline(res.body, createWriteStream(inputPath));

  const variants = {
    '240': path.join(outDir, '240.webm'),
    '480': path.join(outDir, '480.webm'),
    '720': path.join(outDir, '720.webm'),
  };

  async function transcodeVariant(height, file) {
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

  for (const [h, file] of Object.entries(variants)) {
    await transcodeVariant(h, file);
    variants[h] = file;
  }

  const manifest = {
    '240': `/${variants['240'].replace(/\\/g, '/')}`,
    '480': `/${variants['480'].replace(/\\/g, '/')}`,
    '720': `/${variants['720'].replace(/\\/g, '/')}`,
  };
  writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest));

  console.log('Created variants in', outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
