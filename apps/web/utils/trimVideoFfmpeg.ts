import type { FFmpeg } from '@ffmpeg/ffmpeg';

export interface TrimFfmpegOptions {
  start: number;
  end?: number;
  width?: number;
  height?: number;
  crop?: { x: number; y: number; width: number; height: number };
  onProgress?: (progress: number) => void; // progress 0-1
}

let ffmpeg: FFmpeg | null = null;
let loading: Promise<void> | null = null;

async function loadFfmpeg() {
  if (!ffmpeg) {
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    if (!createFFmpeg) {
      throw new Error('`createFFmpeg` export not found in @ffmpeg/ffmpeg');
    }
    if (typeof createFFmpeg !== 'function') {
      throw new Error('`createFFmpeg` export from @ffmpeg/ffmpeg is not a function');
    }
    // load core from CDN to avoid bundling large assets
    ffmpeg = createFFmpeg({
      log: false,
      corePath: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
    });
    loading = ffmpeg.load();
  }
  if (loading) await loading;
  return ffmpeg!;
}

function uniqueId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export async function trimVideoFfmpeg(blob: Blob, opts: TrimFfmpegOptions): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideoFfmpeg can only run in the browser');
  }
  const ffmpeg = await loadFfmpeg();
  const { fetchFile } = await import('@ffmpeg/util');

  const inFile = `in-${uniqueId()}`;
  const outFile = `out-${uniqueId()}.webm`;

  let data: Uint8Array;

  try {
    ffmpeg.FS('writeFile', inFile, await fetchFile(blob));

    const args = ['-i', inFile, '-ss', `${opts.start}`];
    if (opts.end != null) args.push('-to', `${opts.end}`);

    const filters: string[] = [];
    if (opts.crop) {
      const { x, y, width, height } = opts.crop;
      filters.push(`crop=${width}:${height}:${x}:${y}`);
    }
    if (opts.width || opts.height) {
      const w = opts.width ?? -1;
      const h = opts.height ?? -1;
      filters.push(`scale=${w}:${h}`);
    }
    if (filters.length) {
      args.push('-vf', filters.join(','));
    }
    args.push(
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '0',
      '-crf',
      '30',
      '-c:a',
      'libopus',
      '-f',
      'webm',
      outFile,
    );

    ffmpeg.setProgress(({ ratio }) => {
      opts.onProgress?.(ratio);
    });

    await ffmpeg.run(...args);
    opts.onProgress?.(1);
    data = ffmpeg.FS('readFile', outFile);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`FFmpeg trim failed: ${message}`);
  } finally {
    try {
      ffmpeg.FS('unlink', inFile);
    } catch {}
    try {
      ffmpeg.FS('unlink', outFile);
    } catch {}
  }

  return new Blob([data.buffer], { type: 'video/webm' });
}
