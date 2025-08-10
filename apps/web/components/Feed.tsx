'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle, type ListRange } from 'react-virtuoso';
import { useLayout } from '@/context/LayoutContext';

export const estimateFeedItemSize = () => {
  const nav =
    typeof window === 'undefined'
      ? 0
      :
          parseInt(
            getComputedStyle(document.documentElement).getPropertyValue(
              '--bottom-nav-height',
            ) || '0',
            10,
          ) || 0;
  return typeof window === 'undefined' ? 0 : window.innerHeight - nav;
};

import { VideoCard, type VideoCardProps } from './VideoCard';
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
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);
  const hasRestoredRef = useRef(false);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const { state } = useAuth();
  const viewerProfile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const hasWallet = !!viewerProfile?.wallets?.length;
  useLayout();

  const didScrollToSelection = useRef(false);
  useEffect(() => {
    if (didScrollToSelection.current) return;
    if (!selectedVideoId) return;
    const index = items.findIndex((i) => i.eventId === selectedVideoId);
    if (index >= 0) {
      virtuosoRef.current?.scrollToIndex({ index });
      didScrollToSelection.current = true;
    }
  }, [selectedVideoId, items]);

  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (!useFeedSelection.persist.hasHydrated()) return;
    if (!items.length) return;
    if (selectedVideoId) {
      const index = items.findIndex((i) => i.eventId === selectedVideoId);
      if (index >= 0) {
        virtuosoRef.current?.scrollToIndex({ index, align: 'start' });
      }
    }
    hasRestoredRef.current = true;
  }, [items, selectedVideoId]);

  const handleRangeChanged = (range: ListRange) => {
    const middleIndex = Math.floor((range.startIndex + range.endIndex) / 2);
    if (middleIndex >= items.length - 2) {
      loadMore?.();
    }
    const current = items[middleIndex];
    if (current && current.eventId !== selectedVideoId) {
      setSelectedVideo(current.eventId, current.pubkey);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-var(--bottom-nav-height,0))] sm:min-h-[calc(100vh-var(--bottom-nav-height,0))] w-full">
        <SkeletonVideoCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-[calc(100dvh-var(--bottom-nav-height,0))] sm:min-h-[calc(100vh-var(--bottom-nav-height,0))] w-full flex-col items-center justify-center text-white">
        <EmptyState />
        <Link href="/create" className="btn btn-primary mt-4" prefetch>
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <>
      <Virtuoso
        ref={virtuosoRef}
        totalCount={items.length}
        className="min-h-[calc(100dvh-var(--bottom-nav-height,0))] sm:min-h-[calc(100vh-var(--bottom-nav-height,0))] w-full overflow-auto snap-y snap-mandatory scrollbar-none"
        endReached={loadMore}
        rangeChanged={handleRangeChanged}
        itemContent={(index) => {
          const item = items[index];
          return (
            <div className="flex h-[calc(100dvh-var(--bottom-nav-height,0))] sm:h-[calc(100vh-var(--bottom-nav-height,0))] w-full snap-start snap-always items-start justify-center lg:items-center">
              <VideoCard
                {...item}
                showMenu
                onComment={() => setCommentVideoId(item.eventId)}
                zap={
                  <ZapButton
                    lightningAddress={item.lightningAddress ?? ''}
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
        }}
      />
      <CommentDrawer
        videoId={commentVideoId || ''}
        open={!!commentVideoId}
        onOpenChange={(o) => !o && setCommentVideoId(null)}
      />
    </>
  );
};

export default Feed;

