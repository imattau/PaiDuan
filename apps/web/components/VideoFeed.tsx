'use client';
import { Virtuoso } from 'react-virtuoso';
import PlaceholderVideo from './PlaceholderVideo';
import AutoSizer from './AutoSizer';

export default function VideoFeed({ onAuthorClick }: { onAuthorClick: (pubkey: string) => void }) {
  const videos: unknown[] = [];

  if (videos.length === 0) {
    return (
      <div className="flex-1 min-h-0">
        <PlaceholderVideo
          className="mx-auto h-screen w-full text-primary h-safe-screen"
          message="No videos yet"
          busy={false}
        />
      </div>
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
