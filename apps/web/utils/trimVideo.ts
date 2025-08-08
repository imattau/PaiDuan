import { getFFmpeg } from '@/lib/ffmpegClient'
import type { FFmpeg } from '@ffmpeg/ffmpeg'

export async function trimVideo(blob: Blob, start: number, end: number): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideo can only run in the browser');
  }
  const ffmpeg: FFmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/ffmpeg')

  ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(blob))
  const duration = end - start
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
  )
  const trimmed = ffmpeg.FS('readFile', 'out.mp4')
  return new Blob([trimmed.buffer], { type: 'video/mp4' })
}
