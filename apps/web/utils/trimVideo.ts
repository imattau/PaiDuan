import { loadFFmpeg, ffmpeg, fetchFile } from './ffmpeg'

export async function trimVideo(blob: Blob, start: number, end: number): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideo can only run in the browser');
  }
  await loadFFmpeg();
  const data = await fetchFile!(blob);
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
