const { copyFileSync, mkdirSync } = require('fs');
const { dirname, join } = require('path');

const coreDir = dirname(require.resolve('@ffmpeg/core/dist/ffmpeg-core.js'));
const destDir = join(__dirname, '..', 'apps', 'web', 'public', 'ffmpeg');

mkdirSync(destDir, { recursive: true });
['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'].forEach((file) => {
  copyFileSync(join(coreDir, file), join(destDir, file));
});
