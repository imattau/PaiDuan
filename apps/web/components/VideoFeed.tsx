'use client';
import { Virtuoso } from 'react-virtuoso';
import PlaceholderVideo from './PlaceholderVideo';

export default function VideoFeed({ onAuthorClick }: { onAuthorClick: (pubkey: string) => void }) {
  const videos: unknown[] = [];

  if (videos.length === 0) {
    return (
      <PlaceholderVideo
        className="mx-auto h-full w-full max-h-screen text-primary [max-height:calc(100dvh-var(--bottom-nav-height,0))]"
        message="No videos yet"
        busy={false}
      />
    );
  }

  return (
    <Virtuoso
      data={videos}
      className="relative h-screen w-full overflow-auto overscroll-contain [height:calc(100dvh-var(--bottom-nav-height,0))]"
      itemContent={() => (
        <PlaceholderVideo className="h-full w-full" message="Loading video…" />
      )}
    />
  );
}
