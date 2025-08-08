"use client";
import { useState } from 'react';
import UploadModal from './UploadModal';

export function UploadStep({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setErr(null);
    if (f) {
      setPreview(URL.createObjectURL(f));
      if (f.type === 'video/webm') {
        setOutBlob(f);
      } else {
        setOutBlob(null);
      }
    } else {
      setPreview(null);
      setOutBlob(null);
    }
  }

  function upload() {
    if (!file) return;
    setShowModal(true);
  }

  function handleDone(blob: Blob) {
    setOutBlob(blob);
    setPreview(URL.createObjectURL(blob));
    setShowModal(false);
    alert('Ready to upload .webm (stub).');
  }

  function handleCancel() {
    setShowModal(false);
  }

  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <button className="btn btn-secondary" onClick={onBack}>
          ← Back
        </button>
        <h2 className="text-lg font-semibold">Upload a file</h2>
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
          className="btn btn-secondary disabled:opacity-60"
          disabled={!file || showModal}
          onClick={upload}
        >
          Upload
        </button>
      </div>

      {err && (
        <div className="space-y-2">
          <p className="text-sm text-red-500">{err}</p>
        </div>
      )}

      {showModal && file && (
        <UploadModal file={file} onCancel={handleCancel} onDone={handleDone} />
      )}
    </section>
  );
}

export default UploadStep;
