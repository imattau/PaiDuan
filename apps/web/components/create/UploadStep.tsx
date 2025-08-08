'use client'
import { useState } from 'react'
import { trimVideoWebCodecs } from '@/utils/trimVideoWebCodecs'

export default function UploadStep({ onBack }: { onBack?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [outBlob, setOutBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setOutBlob(null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function convert() {
    if (!file) return
    setBusy(true)
    setErr(null)
    try {
      const blob = await trimVideoWebCodecs(file, 0)
      setOutBlob(blob)
      setPreview(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
      setErr('Conversion failed.')
    } finally {
      setBusy(false)
    }
  }

  async function upload() {
    if (!outBlob) return
    alert('Ready to upload .webm (stub).')
  }

  return (
    <section className="rounded-2xl border bg-white/5 dark:bg-neutral-900 p-6 space-y-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back
          </button>
        )}
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
          className="btn btn-primary disabled:opacity-60"
          disabled={!file || busy}
          onClick={convert}
        >
          {busy ? 'Processing…' : 'Convert to .webm'}
        </button>
        <button
          className="btn btn-secondary disabled:opacity-60"
          disabled={!outBlob || busy}
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
    </section>
  )
}
