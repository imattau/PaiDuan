import { bus } from './bus';

export async function uploadVideo(formData: FormData): Promise<{
  video: string;
  poster: string;
  manifest?: string;
}> {
  const url = process.env.NEXT_PUBLIC_UPLOAD_URL ?? 'https://nostr.media/api/upload';
  bus.emit({ type: 'upload.progress', id: 'video', pct: 0 });
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      bus.emit({ type: 'upload.error', id: 'video', error: 'Upload failed' });
      throw new Error('Upload failed');
    }
    const data = await res.json();
    bus.emit({ type: 'upload.progress', id: 'video', pct: 100 });
    bus.emit({ type: 'upload.complete', id: 'video' });
    return data;
  } catch (err: any) {
    bus.emit({ type: 'upload.error', id: 'video', error: err?.message || 'Upload failed' });
    throw err;
  }
}

const upload = { uploadVideo };
export default upload;
