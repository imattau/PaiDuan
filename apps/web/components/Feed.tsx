'use client';
import React, { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VideoCard, VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';
import { SkeletonVideoCard } from './ui/SkeletonVideoCard';
import Link from 'next/link';
import { useFeedSelection } from '@/store/feedSelection';

interface FeedProps {
  items: VideoCardProps[];
  loading?: boolean;
  loadMore?: () => void;
}

export const Feed: React.FC<FeedProps> = ({ items, loading, loadMore }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (typeof window === 'undefined' ? 0 : window.innerHeight),
    overscan: 1,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  useEffect(() => {
    if (!virtualItems.length) return;
    const first = virtualItems[0];
    if (first.index >= items.length - 2) {
      loadMore?.();
    }
    const current = items[first.index];
    if (current && current.eventId !== selectedVideoId) {
      setSelectedVideo(current.eventId, current.pubkey);
    }
  }, [virtualItems, items, loadMore, setSelectedVideo, selectedVideoId]);

  if (loading) {
    return (
      <div className="h-full w-full">
        <SkeletonVideoCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center text-white">
        <EmptyState />
        <Link href="/create" className="btn btn-primary mt-4" prefetch>
          Upload your first video
        </Link>
      </div>
    );
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
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.eventId ?? virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                height: `${virtualRow.size}px`,
              }}
            >
              <VideoCard {...item} showMenu />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Feed;
