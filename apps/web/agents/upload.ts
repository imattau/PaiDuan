import { bus } from './bus';

export async function uploadVideo(formData: FormData): Promise<{
  video: string;
  poster: string;
  manifest?: string;
}> {
  bus.emit({ type: 'upload.progress', id: 'video', pct: 0 });
  const res = await fetch('https://nostr.media/api/upload', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    bus.emit({ type: 'nostr.error', error: 'Upload failed' });
    throw new Error('Upload failed');
  }
  const data = await res.json();
  bus.emit({ type: 'upload.progress', id: 'video', pct: 100 });
  bus.emit({ type: 'upload.complete', id: 'video' });
  return data;
}

const upload = { uploadVideo };
export default upload;
