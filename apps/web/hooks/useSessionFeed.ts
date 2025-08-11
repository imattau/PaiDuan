"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import type { VideoCardProps } from '@/components/VideoCard';
import useFeed, { type FeedMode } from './useFeed';
import { useFeedSelection } from '@/store/feedSelection';

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
  const [shouldFetch, setShouldFetch] = useState(false);

  const [hydrated, setHydrated] = useState(useFeedSelection.persist.hasHydrated());
  useEffect(() => {
    const unsub = useFeedSelection.persist.onFinishHydration(() => setHydrated(true));
    return () => unsub();
  }, []);
  const lastTimestamp = useFeedSelection((s) => s.lastTimestamp);

  const feed = useFeed(
    mode,
    authors,
    lastTimestamp ? { until: lastTimestamp } : {},
    hydrated && typeof window !== 'undefined',
  );

  const fetchMore = useCallback(() => {
    setShouldFetch(true);
  }, []);

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
    if ((queue.length < threshold || shouldFetch) && !feed.loading) {
      feed.loadMore();
      setShouldFetch(false);
    }
  }, [queue.length, threshold, shouldFetch, feed]);

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

