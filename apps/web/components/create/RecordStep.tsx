'use client';
import { useEffect, useRef, useState } from 'react';

export function RecordStep({ onBack }: { onBack: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rec, setRec] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Guard against unsupported environments (SSR or old browsers)
        if (!navigator?.mediaDevices?.getUserMedia) return;

        const s = await navigator.mediaDevices.getUserMedia({
          video: { aspectRatio: 9 / 16 },
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (err) {
        console.error('Failed to access media devices', err);
      }
    })();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  function start() {
    const stream = streamRef.current;
    if (!stream) return;
    chunks.current = [];
    const mr = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
    } as any);
    mediaRef.current = mr;
    mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    mr.onstop = () => {
      const b = new Blob(chunks.current, { type: 'video/webm' });
      setBlob(b);
      setPreview(URL.createObjectURL(b));
    };
    mr.start();
    setRec(true);
    setTimeout(
      () => {
        if (rec) stop();
      },
      3 * 60 * 1000,
    );
  }

  function stop() {
    mediaRef.current?.stop();
    setRec(false);
  }

  async function upload() {
    if (!blob) return;
    alert('Ready to upload recorded .webm (stub).');
  }

  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h2 className="text-lg font-semibold">Record</h2>
      </div>

      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="rounded-xl w-full aspect-[9/16] bg-black"
      />

      <div className="flex gap-3">
        {!rec ? (
          <button className="btn btn-primary" onClick={start}>
            ● Start
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stop}>
            ■ Stop
          </button>
        )}
        <button className="btn btn-secondary" onClick={upload} disabled={!blob}>
          Upload
        </button>
      </div>

      {preview && (
        <video
          controls
          src={preview}
          className="rounded-xl w-full aspect-[9/16] object-cover bg-black"
        />
      )}
    </section>
  );
}

export default RecordStep;
