'use client';
import { useState } from 'react';

export interface MetadataStepProps {
  blob: Blob;
  preview?: string;
  onBack: () => void;
  onCancel: () => void;
}

export function MetadataStep({ blob, preview, onBack, onCancel }: MetadataStepProps) {
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [copyright, setCopyright] = useState('');
  const [nsfw, setNsfw] = useState(false);
  const [busy, setBusy] = useState(false);

  async function upload() {
    setBusy(true);
    const form = new FormData();
    form.append('file', blob, 'video.webm');
    form.append('caption', caption);
    form.append('tags', tags);
    form.append('copyright', copyright);
    form.append('nsfw', nsfw ? 'true' : 'false');
    // This is a stub for the real upload request
    alert(
      'Ready to upload with metadata (stub): ' + JSON.stringify({ caption, tags, copyright, nsfw }),
    );
    setBusy(false);
  }

  function handleCancel() {
    if ((caption || tags || copyright || nsfw) && !confirm('Discard your progress?')) return;
    onCancel();
  }

  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <h2 className="text-lg font-semibold">Metadata</h2>
        </div>
        <button className="text-sm text-muted-foreground" onClick={handleCancel}>
          Cancel
        </button>
      </div>
      <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
        {preview && (
          <video
            controls
            src={preview}
            className="rounded-xl w-full aspect-[9/16] object-cover bg-black"
          />
        )}
        <div className="space-y-4">
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma separated)"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <input
            type="text"
            value={copyright}
            onChange={(e) => setCopyright(e.target.value)}
            placeholder="Copyright information"
            className="block w-full text-sm border rounded px-3 py-2 bg-transparent"
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={nsfw} onChange={(e) => setNsfw(e.target.checked)} />
            <span className="text-sm">NSFW</span>
          </label>
          <button className="btn btn-primary disabled:opacity-60" disabled={busy} onClick={upload}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>
    </section>
  );
}

export default MetadataStep;
