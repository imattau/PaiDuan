"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoCardProps } from '@/components/VideoCard';
import useFeed, { type FeedMode } from './useFeed';

interface Options {
  threshold?: number;
  maxSize?: number;
}

export default function useSessionFeed(
  mode: FeedMode,
  authors: string[] = [],
  { threshold = 5, maxSize = 50 }: Options = {},
) {
  const [sessionCursor, setSessionCursor] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage.getItem('sessionCursor') || undefined;
  });
  const [maxSizeState] = useState(maxSize);
  const [queue, setQueue] = useState<VideoCardProps[]>([]);

  const feed = useFeed(mode, authors, {}, typeof window !== 'undefined');

  const fetchMore = useCallback(() => {
    feed.loadMore();
  }, [feed]);

  const processedRef = useRef(0);
  useEffect(() => {
    const newItems = feed.items.slice(processedRef.current);
    if (newItems.length) {
      processedRef.current = feed.items.length;
      setQueue((q) => {
        const appended = [...q, ...newItems];
        return appended.length > maxSizeState
          ? appended.slice(appended.length - maxSizeState)
          : appended;
      });
    }
  }, [feed.items, maxSizeState]);

  useEffect(() => {
    if (queue.length < threshold && !feed.loading) {
      fetchMore();
    }
  }, [queue.length, threshold, fetchMore, feed.loading]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionCursor) {
      window.localStorage.setItem('sessionCursor', sessionCursor);
    } else {
      window.localStorage.removeItem('sessionCursor');
    }
  }, [sessionCursor]);

  const markSeen = useCallback((count = 1) => {
    setQueue((q) => {
      const seen = q.slice(0, count);
      if (seen.length) {
        setSessionCursor(seen[seen.length - 1].eventId);
      }
      return q.slice(count);
    });
  }, []);

  return { queue, fetchMore, markSeen };
}

