import { Pool, spawn, Worker, ModuleThread } from 'threads';

export interface TrimFfmpegOptions {
  start: number;
  end?: number;
  width?: number;
  height?: number;
  crop?: { x: number; y: number; width: number; height: number };
  onProgress?: (progress: number) => void; // progress 0-1
}

type FfmpegWorker = typeof import('./ffmpegWorker');

let pool: any;

function getPool() {
  if (!pool) {
    pool = Pool<ModuleThread<FfmpegWorker>>(() =>
      spawn(new Worker(new URL('./ffmpegWorker.ts', import.meta.url))),
    ) as any;
    pool.run = (name: keyof FfmpegWorker, ...args: any[]) =>
      pool.queue((worker: any) => worker[name](...args));
  }
  return pool;
}

export async function trimVideoFfmpeg(
  blob: Blob,
  opts: TrimFfmpegOptions,
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideoFfmpeg can only run in the browser');
  }
  return getPool().run('trim', blob, opts);
}

export function terminateFfmpegPool() {
  if (pool) {
    const p = pool;
    pool = null;
    return p.terminate();
  }
}
