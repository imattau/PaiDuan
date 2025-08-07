'use client'
import { useEffect, useRef, useState } from 'react'

type FF = { createFFmpeg: (opts?: any) => any; fetchFile: (f: any) => Promise<Uint8Array> }

export default function CreatePage() {
  const ffmpegRef = useRef<any | null>(null)
  const fetchFileRef = useRef<FF['fetchFile'] | null>(null)

  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (typeof window === 'undefined') return
      try {
        const { createFFmpeg, fetchFile }: FF = await import('@ffmpeg/ffmpeg')
        const ff = createFFmpeg({
          log: true,
          corePath: '/ffmpeg/ffmpeg-core.js',
        })
        ff.setProgress(({ ratio }: any) => setProgress(Math.max(0, Math.min(1, ratio || 0))))
        await ff.load()
        if (cancelled) return
        ffmpegRef.current = ff
        fetchFileRef.current = fetchFile
        setReady(true)
      } catch (e) {
        console.error(e)
        setError('Failed to load video tools. Try a hard refresh or check network.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setVideoFile(f)
    setProcessedBlob(null)
    if (f) setPreviewUrl(URL.createObjectURL(f))
  }

  async function convertToWebm916() {
    if (!videoFile || !ffmpegRef.current || !fetchFileRef.current) return
    if (videoFile.size > 50 * 1024 * 1024) {
      setError('Max file size is 50MB')
      return
    }
    setProcessing(true)
    setError(null)
    try {
      const ff = ffmpegRef.current
      const fetchFile = fetchFileRef.current
      const IN = 'infile'
      const OUT = 'out.webm'

      ff.FS('writeFile', IN, await fetchFile(videoFile))

      await ff.run(
        '-i',
        IN,
        '-vf',
        'crop=in_h*9/16:in_h:(in_w-in_h*9/16)/2:0,scale=720:-2',
        '-c:v',
        'libvpx-vp9',
        '-b:v',
        '1M',
        '-an',
        OUT,
      )

      const data = ff.FS('readFile', OUT)
      const blob = new Blob([data.buffer], { type: 'video/webm' })
      setProcessedBlob(blob)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (e) {
      console.error(e)
      setError('Conversion failed. Try a different source video.')
    } finally {
      try {
        ffmpegRef.current?.FS('unlink', 'infile')
        ffmpegRef.current?.FS('unlink', 'out.webm')
      } catch {}
      setProcessing(false)
      setProgress(0)
    }
  }

  async function upload() {
    if (!processedBlob) {
      setError('Please Trim & Convert first.')
      return
    }
    if (!processedBlob.type.includes('webm')) {
      setError('Output must be .webm')
      return
    }
    alert('Ready to upload .webm (stub).')
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
            onChange={onFile}
          />
        </label>

        {previewUrl && (
          <video controls src={previewUrl} className="rounded-xl w-full aspect-[9/16] object-cover bg-black" />
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={convertToWebm916}
            disabled={!videoFile || !ready || processing}
            className="btn btn-primary disabled:opacity-60"
          >
            {processing ? `Processing… ${Math.round(progress * 100)}%` : 'Trim & Convert to .webm (9:16)'}
          </button>
          <button
            onClick={upload}
            disabled={!processedBlob || processing}
            className="btn btn-secondary disabled:opacity-60"
          >
            Upload
          </button>
        </div>

        {!ready && !error && <p className="text-sm text-muted-foreground">Loading video tools…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </section>
    </main>
  )
}

