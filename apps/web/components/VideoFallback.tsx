import React from 'react';

export default function VideoFallback({
  posterUrl,
  message = 'Video unavailable',
}: {
  posterUrl?: string;
  message?: string;
}) {
  return (
    <>
      <img
        src={posterUrl || '/offline.jpg'}
        alt="Video unavailable"
        className="absolute inset-0 h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.src = '/offline.jpg';
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center">
        {message}
      </div>
    </>
  );
}
