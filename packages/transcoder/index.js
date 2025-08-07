#!/usr/bin/env node
import { mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
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

  for (const [h, file] of Object.entries(variants)) {
    execSync(`ffmpeg -i ${inputPath} -vf scale=-2:${h} -c:v libvpx-vp9 -b:v 0 -crf 33 ${file}`);
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
