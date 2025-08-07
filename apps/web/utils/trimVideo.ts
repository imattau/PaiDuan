import type { FFmpeg } from '@ffmpeg/ffmpeg';

let ffmpeg: FFmpeg | null = null;

async function ensureFFmpegLoaded() {
  if (!ffmpeg) {
    const { FFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpeg = new FFmpeg();
  }
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      workerURL: '/ffmpeg/ffmpeg-core.worker.js',
    });
  }
}

async function fetchFile(input: Blob | string): Promise<Uint8Array> {
  if (typeof input === 'string') {
    const response = await fetch(input);
    return new Uint8Array(await response.arrayBuffer());
  }
  return new Uint8Array(await input.arrayBuffer());
}

export async function trimVideo(blob: Blob, start: number, end: number): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideo can only run in the browser');
  }
  await ensureFFmpegLoaded();
  const data = await fetchFile(blob);
  await ffmpeg!.writeFile('input.mp4', data);
  const duration = end - start;
  await ffmpeg!.exec([
    '-ss',
    `${start}`,
    '-i',
    'input.mp4',
    '-t',
    `${duration}`,
    '-c',
    'copy',
    'out.mp4',
  ]);
  const trimmed = await ffmpeg!.readFile('out.mp4');
  return new Blob([trimmed], { type: 'video/mp4' });
}
