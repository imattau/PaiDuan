'use client';

import type { FFmpeg } from '@ffmpeg/ffmpeg';

const base =
  'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core';

let ffmpeg: FFmpeg | null = null;
let loading: Promise<void> | null = null;

export async function getFFmpeg(): Promise<FFmpeg> {
  if (!ffmpeg) {
    const { createFFmpeg } = await import('@ffmpeg/ffmpeg');
    ffmpeg = createFFmpeg({
      corePath: `${base}.js`,
      wasmPath: `${base}.wasm`,
      workerPath: `${base}.worker.js`,
    });
    loading = ffmpeg.load();
  }
  if (loading) await loading;
  return ffmpeg!;
}

export async function writeInputFile(
  instance: FFmpeg,
  file: File,
  name: string,
): Promise<void> {
  const { fetchFile } = await import('@ffmpeg/ffmpeg');
  instance.FS('writeFile', name, await fetchFile(file));
}

