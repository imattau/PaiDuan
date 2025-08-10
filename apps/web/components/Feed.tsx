'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VideoCard, VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';
import { SkeletonVideoCard } from './ui/SkeletonVideoCard';
import Link from 'next/link';
import { useFeedSelection } from '@/store/feedSelection';
import CommentDrawer from './CommentDrawer';
import ZapButton from './ZapButton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface FeedProps {
  items: VideoCardProps[];
  loading?: boolean;
  loadMore?: () => void;
}

export const Feed: React.FC<FeedProps> = ({ items, loading, loadMore }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);
  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const { state } = useAuth();
  const viewerProfile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const hasWallet = !!viewerProfile?.wallets?.length;

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      if (typeof window === 'undefined') return 0;
      const nav =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-height') || '0',
          10,
        ) || 0;
      return window.innerHeight - nav;
    },
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
      <div className="h-[calc(100dvh-var(--bottom-nav-height,0))] w-full">
        <SkeletonVideoCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-[calc(100dvh-var(--bottom-nav-height,0))] w-full flex-col items-center justify-center text-white">
        <EmptyState />
        <Link href="/create" className="btn btn-primary mt-4" prefetch>
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <>
      <div
        ref={parentRef}
        className="h-[calc(100dvh-var(--bottom-nav-height,0))] w-full overflow-auto snap-y snap-mandatory scrollbar-none"
      >
        <div
          style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}
          className="w-full"
        >
          {virtualItems.map((virtualRow) => {
            const index = virtualRow.index;
            const item = items[index];
            return (
              <div
                key={item.eventId ?? index}
                data-index={index}
                className="flex h-[calc(100dvh-var(--bottom-nav-height,0))] w-full snap-start snap-always items-center justify-center"
                ref={(el) => {
                  rowRefs.current[index] = el;
                  if (el) rowVirtualizer.measureElement(el);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VideoCard
                  {...item}
                  showMenu
                  onComment={() => setCommentVideoId(item.eventId)}
                  onReady={() => {
                    const el = rowRefs.current[index];
                    if (el) rowVirtualizer.measureElement(el);
                  }}
                  zap={
                    <ZapButton
                      lightningAddress={item.lightningAddress}
                      pubkey={item.pubkey}
                      eventId={item.eventId}
                      total={item.zapTotal}
                      disabled={!hasWallet}
                      title={!hasWallet ? 'Add a wallet to zap' : undefined}
                    />
                  }
                />
              </div>
            );
          })}
        </div>
      </div>
      <CommentDrawer
        videoId={commentVideoId || ''}
        open={!!commentVideoId}
        onOpenChange={(o) => !o && setCommentVideoId(null)}
      />
    </>
  );
};

export default Feed;
