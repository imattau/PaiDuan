'use client';
import { useEffect, useRef, useState } from 'react';

// NOTE: we will lazy-load @ffmpeg/ffmpeg in the browser only
type FF = {
  createFFmpeg: (opts?: any) => any;
  fetchFile: (f: File | string | Uint8Array) => Promise<Uint8Array>;
};

export default function CreatePage() {
  const ffmpegRef = useRef<any | null>(null);
  const fetchFileRef = useRef<FF['fetchFile'] | null>(null);

  const [ready, setReady] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === 'undefined') return; // guard SSR
      try {
        const { createFFmpeg, fetchFile }: FF = await import('@ffmpeg/ffmpeg');
        // optional: supply corePath if bundler can’t find it
        // const corePath = '/ffmpeg/ffmpeg-core.js';
        const ff = createFFmpeg({ log: true /*, corePath*/ });
        await ff.load();
        if (!mounted) return;
        ffmpegRef.current = ff;
        fetchFileRef.current = fetchFile;
        setReady(true);
      } catch (e) {
        console.error(e);
        setError('Failed to load video tools. Check network or try hard refresh.');
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setVideoFile(f);
    setProcessedBlob(null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
  }

  async function handleTrimAndConvert() {
    if (!videoFile) return;
    if (!ffmpegRef.current || !fetchFileRef.current) return;

    setProcessing(true);
    setError(null);
    try {
      const ff = ffmpegRef.current;
      const fetchFile = fetchFileRef.current;

      // in: keep original name extension, FFmpeg doesn’t care
      const inName = 'input';
      const outName = 'output.webm';

      ff.FS('writeFile', inName, await fetchFile(videoFile));

      // Basic convert + 9:16 crop. If input is landscape, crop center.
      // You can add start / duration if you have trim range state.
      await ff.run(
        '-i',
        inName,
        // center-crop to 9:16 using input height
        '-vf',
        'crop=in_h*9/16:in_h:(in_w-in_h*9/16)/2:0,scale=720:-2',
        '-c:v',
        'libvpx-vp9',
        '-b:v',
        '1M',
        '-an',
        outName,
      );

      const data = ff.FS('readFile', outName);
      const blob = new Blob([data.buffer], { type: 'video/webm' });
      setProcessedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      console.error(e);
      setError('Conversion failed. Try a different source video.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleUpload() {
    if (!processedBlob) {
      setError('Please Trim & Convert first.');
      return;
    }
    if (!processedBlob.type.includes('webm')) {
      setError('Output must be .webm');
      return;
    }
    // TODO: replace with your upload call
    // await uploadToYourAPI(new File([processedBlob], 'video.webm', { type: 'video/webm' }))
    alert('Ready to upload .webm (stub).');
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Create Video</h1>

      <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
        <label className="text-sm font-medium block">
          Select video
          <input
            type="file"
            accept="video/*"
            className="mt-1 block w-full text-sm border rounded px-3 py-2 bg-transparent"
            onChange={handleFileChange}
          />
        </label>

        {previewUrl && (
          <video
            controls
            src={previewUrl}
            className="rounded-xl w-full aspect-[9/16] object-cover bg-black"
          />
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTrimAndConvert}
            disabled={!videoFile || !ready || processing}
            className="px-4 py-2.5 rounded-xl bg-accent text-white font-medium disabled:opacity-60"
          >
            {processing ? 'Processing…' : 'Trim & Convert to .webm (9:16)'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!processedBlob || processing}
            className="px-4 py-2.5 rounded-xl border font-medium disabled:opacity-60"
          >
            Upload
          </button>
        </div>

        {!ready && <p className="text-sm text-muted-foreground">Loading video tools…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>
    </main>
  );
}
