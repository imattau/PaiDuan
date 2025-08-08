// Utility for trimming videos using WebCodecs
// Falls back to a polyfill when VideoDecoder/VideoEncoder are unavailable

export async function trimVideoWebCodecs(
  blob: Blob,
  start: number,
  end?: number,
): Promise<Blob> {
  if (typeof window === 'undefined') {
    throw new Error('trimVideoWebCodecs can only run in the browser')
  }

  if (!('VideoDecoder' in window) || !('VideoEncoder' in window)) {
    await import('libavjs-webcodecs-polyfill')
  }

  const url = URL.createObjectURL(blob)
  const video = document.createElement('video')
  video.src = url
  await video.play().catch(() => void 0)
  video.pause()

  const duration = video.duration
  const endTime = end ?? duration
  const width = video.videoWidth
  const height = video.videoHeight

  const canvas: OffscreenCanvas | HTMLCanvasElement =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(width, height)
      : Object.assign(document.createElement('canvas'), {
          width,
          height,
        })

  const ctx = canvas.getContext('2d')!

  const fps = 30
  const frameInterval = 1 / fps
  const chunks: Uint8Array[] = []

  const encoder = new VideoEncoder({
    output: (chunk) => {
      const data = new Uint8Array(chunk.byteLength)
      chunk.copyTo(data)
      chunks.push(data)
    },
    error: (e) => console.error(e),
  })

  encoder.configure({
    codec: 'vp8',
    width,
    height,
    bitrate: 1_000_000,
    framerate: fps,
  })

  let current = start
  while (current < endTime) {
    video.currentTime = current
    await new Promise((r) => video.addEventListener('seeked', r, { once: true }))
    ctx.drawImage(video, 0, 0, width, height)
    const frame = new VideoFrame(canvas, {
      timestamp: Math.round((current - start) * 1e6),
    })
    encoder.encode(frame)
    frame.close()
    current += frameInterval
  }

  await encoder.flush()
  URL.revokeObjectURL(url)
  return new Blob(chunks, { type: 'video/webm' })
}

