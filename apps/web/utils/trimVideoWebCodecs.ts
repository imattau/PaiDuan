// Utility to start a WebCodecs based trim worker
// Returns the Worker instance or null if WebCodecs are unsupported

export interface TrimWorkerOptions {
  start: number;
  end?: number;
  width?: number;
  height?: number;
  bitrate?: number;
}

export function trimVideoWebCodecs(
  blob: Blob,
  options: TrimWorkerOptions,
): Worker | null {
  if (typeof window === 'undefined') {
    throw new Error('trimVideoWebCodecs can only run in the browser');
  }
  if (!('VideoDecoder' in window) || !('VideoEncoder' in window)) {
    return null;
  }
  const worker = new Worker(new URL('./trimVideoWorker.ts', import.meta.url), {
    type: 'module',
  });
  worker.postMessage({ blob, ...options });
  return worker;
}
