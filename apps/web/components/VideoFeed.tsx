'use client';
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import PlaceholderVideo from './PlaceholderVideo';

export default function VideoFeed({ onAuthorClick }: { onAuthorClick: (pubkey: string) => void }) {
  const videos: unknown[] = [];
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: videos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (typeof window === 'undefined' ? 0 : window.innerHeight),
    overscan: 1,
  });

  if (videos.length === 0) {
    return <PlaceholderVideo className="aspect-[9/16] w-full max-w-[420px] mx-auto text-primary" />;
  }

  return (
    <div ref={parentRef} className="relative h-full w-full overflow-auto">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            ref={rowVirtualizer.measureElement}
            className="absolute top-0 left-0 w-full"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
              height: `${virtualRow.size}px`,
            }}
          >
            <PlaceholderVideo className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
