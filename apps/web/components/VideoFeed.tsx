'use client';
import { Virtuoso } from 'react-virtuoso';
import PlaceholderVideo from './PlaceholderVideo';
import AutoSizer from './AutoSizer';

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
    <AutoSizer className="flex-1 min-h-0 overflow-hidden">
      {({ width, height }) => (
        <Virtuoso
          data={videos}
          style={{ width, height }}
          className="relative h-full w-full overflow-auto overscroll-contain"
          itemContent={() => (
            <PlaceholderVideo className="h-full w-full" message="Loading video…" />
          )}
        />
      )}
    </AutoSizer>
  );
}
