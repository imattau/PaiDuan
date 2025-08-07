import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({
  log: false,
  corePath: '/ffmpeg/ffmpeg-core.js',
});

export async function trimVideo(
  blob: Blob,
  start: number,
  end: number,
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideo can only run in the browser');
  }
  if (!ffmpeg.isLoaded()) {
    await ffmpeg.load();
  }
  const data = await fetchFile(blob);
  ffmpeg.FS('writeFile', 'input.mp4', data);
  const duration = end - start;
  await ffmpeg.run(
    '-ss',
    `${start}`,
    '-i',
    'input.mp4',
    '-t',
    `${duration}`,
    '-c',
    'copy',
    'out.mp4',
  );
  const trimmed = ffmpeg.FS('readFile', 'out.mp4');
  return new Blob([trimmed], { type: 'video/mp4' });
}
