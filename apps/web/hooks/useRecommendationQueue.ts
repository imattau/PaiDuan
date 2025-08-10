import { useEffect, useRef, useState } from 'react';
import { feedService } from '@/lib/feed-service';
import type { VideoCardProps } from '@/components/VideoCard';

export function useRecommendationQueue(threshold = 5) {
  const [queue, setQueue] = useState<VideoCardProps[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const loading = useRef(false);

  const fetchMore = async () => {
    if (loading.current || !hasMore) return;
    loading.current = true;
    try {
      const { items, nextCursor } = await feedService.fetchRecommendations(cursor);
      setQueue((q) => [...q, ...items]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } finally {
      loading.current = false;
    }
  };

  useEffect(() => {
    fetchMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (queue.length < threshold && hasMore) {
      fetchMore();
    }
  }, [queue.length, threshold, hasMore]);

  const markSeen = (count = 1) => {
    setQueue((q) => q.slice(count));
  };

  return { queue, markSeen, fetchMore };
}

export default useRecommendationQueue;
