const { copyFileSync, mkdirSync, existsSync } = require('fs');
const { dirname, join } = require('path');

const coreDir = dirname(require.resolve('@ffmpeg/core'));
const destDir = join(__dirname, '..', 'apps', 'web', 'public', 'ffmpeg');

mkdirSync(destDir, { recursive: true });
['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'].forEach((file) => {
  const src = join(coreDir, file);
  if (existsSync(src)) copyFileSync(src, join(destDir, file));
});
