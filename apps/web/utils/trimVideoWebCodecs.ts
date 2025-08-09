// Utility to run a WebCodecs based trim worker
// Returns a Blob or null if WebCodecs are unsupported
import * as Comlink from 'comlink';

export interface TrimWorkerOptions {
  start: number;
  end?: number;
  width?: number;
  height?: number;
  bitrate?: number;
}

interface WorkerApi {
  trim(
    blob: Blob,
    options: TrimWorkerOptions,
    onProgress: (p: number) => void,
  ): Promise<{ buffer: ArrayBuffer; type: string }>;
}

export async function trimVideoWebCodecs(
  blob: Blob,
  options: TrimWorkerOptions,
  onProgress: (p: number) => void,
): Promise<Blob | null> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideoWebCodecs can only run in the browser');
  }
  if (!('VideoDecoder' in window) || !('VideoEncoder' in window)) {
    return null;
  }
  try {
    const worker = new Worker(new URL('./trimVideoWorker.ts', import.meta.url), {
      type: 'module',
    });
    const api = Comlink.wrap<WorkerApi>(worker);
    try {
      const result = await api.trim(blob, options, Comlink.proxy(onProgress));
      worker.terminate();
      return new Blob([result.buffer], { type: result.type });
    } catch (err) {
      worker.terminate();
      throw err instanceof Error ? err : new Error(String(err));
    }
  } catch (err) {
    // Bubble up worker bootstrap failures so caller can fall back to FFmpeg
    throw err instanceof Error ? err : new Error(String(err));
  }
}
