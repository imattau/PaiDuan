import type { FFmpeg } from '@ffmpeg/ffmpeg';

let createFFmpegFn: any | null = null;
let ffmpeg: FFmpeg | null = null;
let loading: Promise<void> | null = null;

export interface GetFFmpegOptions {
  onProgress?: (progress: number) => void;
}

export async function getFFmpeg(opts: GetFFmpegOptions = {}): Promise<FFmpeg> {
  if (!createFFmpegFn) {
    const ffmpegModule: any = await import('@ffmpeg/ffmpeg');
    createFFmpegFn =
      ffmpegModule.createFFmpeg ??
      ffmpegModule.default?.createFFmpeg ??
      ffmpegModule.default;
    if (typeof createFFmpegFn !== 'function') {
      throw new Error('@ffmpeg/ffmpeg does not provide a `createFFmpeg` export or default export');
    }
  }

  if (!ffmpeg) {
    ffmpeg = createFFmpegFn({
      corePath: '/ffmpeg/ffmpeg-core.js',
      log: false,
    });
    loading = ffmpeg.load();
  }
  ffmpeg.setLogger(({ type, message }) => console.debug('[ffmpeg]', type, message));
  ffmpeg.setProgress(({ ratio }) => opts.onProgress?.(ratio ?? 0));
  if (loading) await loading;
  return ffmpeg;
}
