import { createFile } from 'mp4box';

export function detectCodec(blobType?: string, trackCodec?: string): string | null {
  const candidates = [trackCodec, blobType];
  for (const c of candidates) {
    if (!c) continue;
    const codec = c.toLowerCase();
    if (
      codec.startsWith('avc') ||
      codec.includes('h264') ||
      codec.includes('x264')
    )
      return 'avc1';
    if (
      codec.includes('hvc1') ||
      codec.includes('hev1') ||
      codec.includes('hevc') ||
      codec.includes('h265')
    )
      return 'hvc1';
    if (codec.includes('vp8')) return 'vp8';
    if (codec.includes('vp9') || codec.includes('vp09')) return 'vp9';
    if (codec.includes('av01') || codec.includes('av1')) return 'av01';
    if (codec.includes('mp4v') || codec.includes('mpeg4')) return 'mp4v';
  }
  return null;
}

export async function sniffCodec(blob: Blob): Promise<string | null> {
  try {
    const buffer = await blob.arrayBuffer();
    const mp4box = createFile();
    let track: any;
    mp4box.onReady = (info: any) => {
      track = info.videoTracks?.[0];
    };
    (buffer as any).fileStart = 0;
    mp4box.appendBuffer(buffer);
    mp4box.flush();
    if (!track) return null;
    return detectCodec(blob.type, track.codec);
  } catch {
    return null;
  }
}
