'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Virtuoso, type VirtuosoHandle, type ListRange } from 'react-virtuoso';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useLayout } from '@/hooks/useLayout';

export const estimateFeedItemSize = () => {
  return typeof window === 'undefined' ? 0 : window.innerHeight;
};

import { VideoCard, type VideoCardProps } from './VideoCard';
import EmptyState from './EmptyState';
import { SkeletonVideoCard } from './ui/SkeletonVideoCard';
import Link from 'next/link';
import { useFeedSelection } from '@/store/feedSelection';
import { useSettings } from '@/store/settings';
import telemetry from '@/agents/telemetry';
import CommentDrawer from './CommentDrawer';
import ZapButton from './ZapButton';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface FeedProps {
  items: VideoCardProps[];
  loading?: boolean;
  loadMore?: () => void;
  markSeen?: (count: number) => void;
}

export const Feed: React.FC<FeedProps> = ({ items, loading, loadMore, markSeen }) => {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const setSelectedVideo = useFeedSelection((s) => s.setSelectedVideo);
  const selectedVideoId = useFeedSelection((s) => s.selectedVideoId);
  const setLastPosition = useFeedSelection((s) => s.setLastPosition);
  const lastIndex = useFeedSelection((s) => s.lastIndex);
  const lastCursor = useFeedSelection((s) => s.lastCursor);
  const enableFeedResume = useSettings((s) => s.enableFeedResume);
  const hasRestoredRef = useRef(false);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const { state } = useAuth();
  const viewerProfile = useProfile(state.status === 'ready' ? state.pubkey : undefined);
  const hasWallet = !!viewerProfile?.wallets?.length;
  useLayout();

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

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
    if (enableFeedResume) {
      if (lastCursor && !items.find((i) => i.eventId === lastCursor)) {
        telemetry.track('feed.resume.failed', {
          reason: 'cursor_not_found',
          cursor: lastCursor,
        });
        return;
      }
      if (lastIndex !== undefined) {
        telemetry.track('feed.resume.loaded', {
          index: lastIndex,
          cursor: lastCursor,
        });
        virtuosoRef.current?.scrollToIndex({ index: lastIndex, align: 'start' });
        hasRestoredRef.current = true;
        return;
      }
    }
    if (selectedVideoId) {
      const index = items.findIndex((i) => i.eventId === selectedVideoId);
      if (index >= 0) {
        virtuosoRef.current?.scrollToIndex({ index, align: 'start' });
      }
    }
    hasRestoredRef.current = true;
  }, [items, selectedVideoId, lastIndex, lastCursor, enableFeedResume]);

  useEffect(() => {
    if (!lastCursor) return;
    if (items.find((i) => i.eventId === lastCursor)) return;
    loadMore?.();
  }, [items, lastCursor, loadMore]);

  const handleRangeChanged = (range: ListRange) => {
    const middleIndex = Math.floor((range.startIndex + range.endIndex) / 2);
    if (range.endIndex >= Math.floor(items.length * 0.8)) {
      loadMore?.();
    }
    const current = items[middleIndex];
    if (current && current.eventId !== selectedVideoId) {
      setSelectedVideo(current.eventId, current.pubkey);
    }
    const cursorItem = items[items.length - 1];
    if (cursorItem) {
      setLastPosition(middleIndex, cursorItem.eventId, cursorItem.created ?? 0);
    }
    if (range.startIndex > 0) {
      markSeen?.(range.startIndex);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full h-safe-screen">
        <SkeletonVideoCard />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center text-white h-safe-screen">
        <EmptyState />
        <Link href="/create" className="btn btn-primary mt-4" prefetch>
          Upload your first video
        </Link>
      </div>
    );
  }

  return (
    <>
      <AutoSizer className="flex-1 min-h-0 overflow-hidden">
        {({ width }) => {
          const height = estimateFeedItemSize();
          return (
            <Virtuoso
              ref={virtuosoRef}
              totalCount={items.length}
              style={{ width, height }}
              className="feed-container overflow-auto snap-y snap-proximity scrollbar-none"
              endReached={loadMore}
              rangeChanged={handleRangeChanged}
              fixedItemHeight={height}
              itemContent={(index) => {
                const item = items[index];
                return (
                  <div
                    style={{ height }}
                    className="flex w-full snap-start snap-always items-start justify-center lg:items-center"
                  >
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
          );
        }}
      </AutoSizer>
      <CommentDrawer
        videoId={commentVideoId || ''}
        open={!!commentVideoId}
        onOpenChange={(o) => !o && setCommentVideoId(null)}
      />
    </>
  );
};

export default Feed;
