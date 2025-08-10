import PlaceholderVideo from '../PlaceholderVideo';
import { RefObject } from 'react';

interface Props {
  preview: string | null;
  err: string | null;
  progress: number;
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  noVideoMessage: string;
  dropMessage: string;
  dimensions: { width: number; height: number };
}

export default function VideoPreview({
  preview,
  err,
  progress,
  getRootProps,
  getInputProps,
  isDragActive,
  videoRef,
  noVideoMessage,
  dropMessage,
  dimensions,
}: Props) {
  const aspectRatio =
    dimensions.width && dimensions.height
      ? `${dimensions.width} / ${dimensions.height}`
      : '9 / 16';
  return (
    <div className="space-y-4">
      <div
        {...getRootProps({
          className: 'relative max-h-[70vh] w-full overflow-hidden rounded-xl',
          style: { aspectRatio },
        })}
      >
        <input {...getInputProps()} />
        {preview ? (
          <video
            ref={videoRef}
            controls
            src={preview}
            className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          />
        ) : (
          <PlaceholderVideo
            className="absolute inset-0 h-full w-full object-cover"
            message={noVideoMessage}
            busy={false}
          />
        )}
        {isDragActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            {dropMessage}
          </div>
        )}
        {progress > 0 && progress < 100 && (
          <div
            className="absolute left-0 bottom-0 h-1 bg-blue-500"
            style={{ width: `${progress}%` }}
          />
        )}
      </div>
      {err && <p className="text-sm text-red-500">{err}</p>}
    </div>
  );
}
