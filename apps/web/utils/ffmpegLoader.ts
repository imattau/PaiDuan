import type { FFmpeg } from '@ffmpeg/ffmpeg';
import * as ffmpegModule from '@ffmpeg/ffmpeg';

// Resolve `createFFmpeg` from both named and default exports
const createFFmpegFn: any =
  (ffmpegModule as any).createFFmpeg ??
  (ffmpegModule as any).default?.createFFmpeg ??
  (ffmpegModule as any).default;

if (typeof createFFmpegFn !== 'function') {
  throw new Error(
    '@ffmpeg/ffmpeg does not provide a `createFFmpeg` export or default export',
  );
}

let ffmpeg: FFmpeg | null = null;
let loading: Promise<void> | null = null;

export interface GetFFmpegOptions {
  logger?: Parameters<FFmpeg['setLogger']>[0];
  progress?: Parameters<FFmpeg['setProgress']>[0];
}

export async function getFFmpeg(opts: GetFFmpegOptions = {}): Promise<FFmpeg> {
  if (!ffmpeg) {
    ffmpeg = createFFmpegFn({
      corePath: '/ffmpeg/ffmpeg-core.js',
      log: false,
    });
    loading = ffmpeg.load();
  }
  if (opts.logger) ffmpeg.setLogger(opts.logger);
  if (opts.progress) ffmpeg.setProgress(opts.progress);
  if (loading) await loading;
  return ffmpeg;
}

