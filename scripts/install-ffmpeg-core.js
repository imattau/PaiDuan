const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'apps', 'web', 'node_modules', '@ffmpeg', 'core-mt', 'dist', 'umd');
const destDir = path.resolve(__dirname, '..', 'apps', 'web', 'public', 'ffmpeg');

const files = ['ffmpeg-core.js', 'ffmpeg-core.wasm', 'ffmpeg-core.worker.js'];

function copyFiles() {
  if (!fs.existsSync(distDir)) {
    console.error('Source directory not found:', distDir);
    process.exit(1);
  }

  fs.mkdirSync(destDir, { recursive: true });
  for (const file of files) {
    const src = path.join(distDir, file);
    const dest = path.join(destDir, file);
    fs.copyFileSync(src, dest);
  }
}

copyFiles();
