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
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() -
        virtualItems[virtualItems.length - 1].end
      : 0;

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
    <div
      ref={parentRef}
      className="h-full w-full overflow-auto snap-y snap-mandatory scrollbar-none"
    >
      <div
        style={{ paddingTop, paddingBottom }}
        className="flex flex-col"
      >
        {virtualItems.map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.eventId ?? virtualRow.index}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="snap-start min-h-screen"
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
