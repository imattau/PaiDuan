import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { trimVideoWebCodecs } from '../utils/trimVideoWebCodecs';

export function useVideoProcessing(t: (key: string) => string) {
  const [file, setFile] = useState<File | null>(null);
  const [outBlob, setOutBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const updatePreview = (url: string | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  useEffect(() => {
    if (videoRef.current && preview) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function onPick(f: File | null) {
    setFile(f);
    setOutBlob(null);
    updatePreview(f ? URL.createObjectURL(f) : null);
    setProgress(0);
    if (f) {
      setErr(null);
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(f);
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error(t('failed_read_video')));
          video.src = url;
        });
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        setDimensions({ width, height });
        URL.revokeObjectURL(url);
        video.remove();

        let blob: Blob | null = null;
        try {
          blob = await trimVideoWebCodecs(
            f,
            { start: 0, end: Math.min(300, duration) },
            (p) => setProgress(Math.round(p * 100)),
          );
        } catch (err: any) {
          console.error(err);
          const code = (err as any)?.code;
          if (code === 'no-keyframe') {
            setErr(t('cannot_trim_no_keyframe'));
            setProgress(0);
            return;
          }
          if (code === 'demux-failed') {
            setErr(t('failed_read_video'));
            setProgress(0);
            return;
          }
          setErr(err?.message || t('video_processing_failed'));
          setProgress(0);
          return;
        }
        if (!blob) {
          setErr(t('webcodecs_unavailable'));
          return;
        }
        blob = new Blob([blob], { type: f.type });
        setOutBlob(blob);
        updatePreview(URL.createObjectURL(blob));
      } catch (e: any) {
        console.error(e);
        setErr(e?.message || t('conversion_failed'));
        setProgress(0);
      }
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'] },
    onDrop: (accepted) => onPick(accepted[0] ?? null),
  });

  return {
    file,
    outBlob,
    preview,
    err,
    setErr,
    progress,
    dimensions,
    videoRef,
    getRootProps,
    getInputProps,
    isDragActive,
  };
}
