import type { FFmpeg } from '@ffmpeg/ffmpeg'

let ffmpeg: FFmpeg | null = null
let fetchFile: typeof import('@ffmpeg/ffmpeg').fetchFile | null = null

export async function loadFFmpeg() {
  if (!ffmpeg || !fetchFile) {
    const { FFmpeg, fetchFile: ff } = await import('@ffmpeg/ffmpeg')
    ffmpeg = new FFmpeg()
    fetchFile = ff
  }
  if (!ffmpeg.loaded) {
    await ffmpeg.load({
      coreURL: '/ffmpeg/ffmpeg-core.js',
      wasmURL: '/ffmpeg/ffmpeg-core.wasm',
      workerURL: '/ffmpeg/ffmpeg-core.worker.js',
    })
  }
  return ffmpeg
}

export { ffmpeg, fetchFile }
