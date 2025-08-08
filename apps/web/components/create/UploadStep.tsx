'use client'
import { useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import { getFFmpeg, writeInputFile } from '@/lib/ffmpegClient'

export function UploadStep({ onBack }: { onBack: () => void }) {
  const ffRef = useRef<any>(null)
  const trimRef = useRef<{ start: number; end: number } | null>(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const [outBlob, setOutBlob] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function loadFFmpeg(signal?: { cancelled: boolean }) {
    setErr(null)
    setReady(false)
    try {
      const ff = await getFFmpeg()
      if (signal?.cancelled) return
      ff.setProgress(({ ratio }: any) =>
        setProgress(Math.max(0, Math.min(1, ratio || 0))),
      )
      if (signal?.cancelled) return
      ffRef.current = ff
      setReady(true)
    } catch (e) {
      console.error('Failed to initialize FFmpeg', e)
      Sentry.captureException(e, {
        tags: { component: 'UploadStep', action: 'loadFFmpeg' },
      })
      if (signal?.cancelled) return
      const message = e instanceof Error ? e.message : String(e)
      setErr(`Failed to load video tools: ${message}`)
    }
  }

  useEffect(() => {
    const signal = { cancelled: false }
    loadFFmpeg(signal)
    return () => {
      signal.cancelled = true
    }
  }, [])

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setOutBlob(null)
    setPreview(f ? URL.createObjectURL(f) : null)
  }

  async function convert() {
    if (!file || !ffRef.current) return
    if (file.size > 50 * 1024 * 1024) {
      setErr('Max file size is 50MB')
      return
    }
    // If already webm, no conversion is needed
    if (file.type === 'video/webm') {
      setOutBlob(file)
      setPreview(URL.createObjectURL(file))
      return
    }

    setBusy(true)
    setErr(null)
    try {
      const ff = ffRef.current
      await writeInputFile(ff, file, 'input')

      const startSec = (trimRef.current?.start ?? 0) / 1000
      const durationSec =
        trimRef.current && trimRef.current.end > trimRef.current.start
          ? (trimRef.current.end - trimRef.current.start) / 1000
          : null

      const args = [
        ...(startSec > 0 ? ['-ss', `${startSec}`] : []),
        '-i',
        'input',
        ...(durationSec !== null ? ['-t', `${durationSec}`] : []),
        '-c:v',
        'libvpx-vp9',
        '-crf',
        '30',
        '-b:v',
        '0',
        'out.webm',
      ]

      await ff.run(...args)
      const data = ff.FS('readFile', 'out.webm')
      const blob = new Blob([data.buffer], { type: 'video/webm' })
      setOutBlob(blob)
      setPreview(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
      setErr('Conversion failed.')
    } finally {
      try {
        ffRef.current?.FS('unlink', 'input')
        ffRef.current?.FS('unlink', 'out.webm')
      } catch {}
      setBusy(false)
      setProgress(0)
    }
  }

  async function upload() {
    if (!outBlob) return
    alert('Ready to upload .webm (stub).')
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
          className="btn btn-primary disabled:opacity-60"
          disabled={!file || busy || !ready}
          onClick={convert}
        >
          {busy ? `Processing… ${Math.round(progress * 100)}%` : 'Convert to .webm'}
        </button>
        <button
          className="btn btn-secondary disabled:opacity-60"
          disabled={!outBlob || busy}
          onClick={upload}
        >
          Upload
        </button>
      </div>

      {!ready && !err && (
        <p className="text-sm text-muted-foreground">Loading video tools…</p>
      )}
      {err && (
        <div className="space-y-2">
          <p className="text-sm text-red-500">{err}</p>
          <button className="btn btn-secondary" onClick={() => loadFFmpeg()}>
            Retry
          </button>
        </div>
      )}
    </section>
  )
}

export default UploadStep

