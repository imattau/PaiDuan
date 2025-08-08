'use client';
import { useEffect, useState } from 'react';
import { trimVideoWebCodecs } from '@/utils/trimVideoWebCodecs';
import { MetadataStep } from './MetadataStep';

interface UploadStepProps {
  onBack: () => void;
  onCancel: () => void;
  /**
   * Used by tests to simulate large screens without relying on matchMedia.
   */
  forceIsLarge?: boolean;
}

export function UploadStep({ onBack, onCancel, forceIsLarge }: UploadStepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [isLarge, setIsLarge] = useState(forceIsLarge ?? false);

  useEffect(() => {
    if (forceIsLarge !== undefined) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const listener = (e: MediaQueryListEvent) => setIsLarge(e.matches);
    setIsLarge(mq.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, [forceIsLarge]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setOutBlob(null);
    setPreview(f ? URL.createObjectURL(f) : null);
    setShowMetadata(false);
  }

  async function convert() {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      const blob = await trimVideoWebCodecs(file, 0);
      setOutBlob(blob);
      setPreview(URL.createObjectURL(blob));
      setShowMetadata(true);
    } catch (e) {
      console.error(e);
      setErr('Conversion failed.');
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    if ((file || outBlob || preview) && !confirm('Discard your progress?')) return;
    onCancel();
  }

  if (!isLarge && showMetadata && outBlob) {
    return (
      <MetadataStep
        blob={outBlob!}
        preview={preview ?? undefined}
        onBack={() => setShowMetadata(false)}
        onCancel={onCancel}
      />
    );
  }

  const showMetadataInline = isLarge && showMetadata && outBlob;
  const buttonLabel = busy
    ? 'Processing…'
    : isLarge
    ? outBlob
      ? 'Process Again'
      : 'Process Video'
    : file
    ? 'Next'
    : 'Select a file';

  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
      <div className={`space-y-4 ${isLarge && !showMetadataInline ? 'lg:col-span-2' : ''}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary" onClick={onBack}>
              ← Back
            </button>
            <h2 className="text-lg font-semibold">Upload a file</h2>
          </div>
          <button className="text-sm text-muted-foreground" onClick={handleCancel}>
            Cancel
          </button>
        </div>

        <input
          type="file"
          accept="video/*"
          onChange={onPick}
          className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
        />

        {preview && (
          <video
            controls
            src={preview}
            className="rounded-xl w-full aspect-[9/16] object-cover bg-black"
          />
        )}

        <div className="flex gap-3">
          <button
            className="btn btn-primary disabled:opacity-60"
            disabled={!file || busy}
            onClick={convert}
          >
            {buttonLabel}
          </button>
        </div>

        {err && (
          <div className="space-y-2">
            <p className="text-sm text-red-500">{err}</p>
          </div>
        )}
      </div>
      {showMetadataInline && (
        <MetadataStep blob={outBlob!} onBack={() => {}} onCancel={onCancel} inline />
      )}
    </section>
  );
}

export default UploadStep;
