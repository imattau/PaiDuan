import { useInfiniteQuery } from '@tanstack/react-query';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { saveEvent } from '@/lib/db';
import { VideoCardProps } from '../components/VideoCard';
import { queryClient } from '@/lib/queryClient';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';

export const FEED_PAGE_LIMIT = Number(process.env.NEXT_PUBLIC_FEED_LIMIT ?? '20') || 20;
function parseImeta(tags: string[][]) {
  let videoUrl: string | undefined;
  let manifestUrl: string | undefined;
  let posterUrl: string | undefined;

  tags
    .filter((t) => t[0] === 'imeta')
    .forEach((t) => {
      const kv: Record<string, string[]> = {};
      t.slice(1).forEach((entry) => {
        const [key, ...rest] = entry.split(' ');
        const value = rest.join(' ');
        (kv[key] ||= []).push(value);
      });
      if (!posterUrl && kv.image?.[0]) posterUrl = kv.image[0];
      const url = kv.url?.[0];
      const m = kv.m?.[0];
      if (m === 'application/x-mpegURL') {
        if (!manifestUrl && url) manifestUrl = url;
      } else {
        if (!videoUrl && url) videoUrl = url;
      }
    });

  return { videoUrl, manifestUrl, posterUrl };
}

export type FeedMode = 'all' | 'following' | { tag: string } | { author: string };

interface FeedResult {
  items: VideoCardProps[];
  tags: string[];
  prepend: (item: VideoCardProps) => void;
  loadMore: () => void;
  loading: boolean;
  error?: Error;
}

async function fetchFeedPage({
  pageParam,
  mode,
  authors,
  limit,
}: {
  pageParam?: number;
  mode: FeedMode;
  authors: string[];
  limit: number;
}) {
  const filter: Filter = { kinds: [21, 22], limit };
  if (mode === 'all') {
    filter.since = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  }
  if (pageParam) filter.until = pageParam;
  if (mode === 'following') {
    if (authors.length > 0) filter.authors = authors;
  } else if (typeof mode === 'object' && 'tag' in mode) {
    filter['#t'] = [mode.tag];
  } else if (typeof mode === 'object' && 'author' in mode) {
    filter.authors = [mode.author];
  }
  return await new Promise<{ items: VideoCardProps[]; tags: string[]; nextCursor?: number; timedOut?: boolean }>((resolve) => {
    const items: VideoCardProps[] = [];
    const tagCounts: Record<string, number> = {};
    let sub: { close: () => void };
    let timer: ReturnType<typeof setTimeout>;
    let settled = false;

    const finalize = (timedOut: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      sub?.close();
      items.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      const nextCursor = items.length ? (items[items.length - 1].createdAt ?? 0) - 1 : undefined;
      resolve({
        items,
        tags: Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([t]) => t),
        nextCursor,
        timedOut,
      });
    };

    sub = pool.subscribeMany(getRelays(), [filter], {
      onevent: async (event: NostrEvent) => {
        const { videoUrl, manifestUrl, posterUrl } = parseImeta(event.tags);
        if (!videoUrl && !manifestUrl) return;
        const zapTags = event.tags.filter((t) => t[0] === 'zap');
        const tTags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);
        tTags.forEach((t) => {
          tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
        const titleTag = event.tags.find((t) => t[0] === 'title');
        const item: VideoCardProps = {
          videoUrl: videoUrl || manifestUrl || '',
          posterUrl,
          manifestUrl,
          author: event.pubkey.slice(0, 8),
          caption: titleTag ? titleTag[1] : event.content,
          eventId: event.id,
          lightningAddress: zapTags.length ? zapTags[0][1] : '',
          pubkey: event.pubkey,
          zapTotal: 0,
          createdAt: event.created_at || 0,
        };
        items.push(item);
        await saveEvent(event);
      },
      oneose: () => finalize(false),
    });

    timer = setTimeout(() => finalize(true), 10000);
  });
}

export function useFeed(
  mode: FeedMode,
  authors: string[] = [],
  cursor: { since?: number; until?: number; limit?: number } = {},
  enabled = true,
): FeedResult {
  const limit = cursor.limit ?? FEED_PAGE_LIMIT;
  const query = useInfiniteQuery({
    queryKey: ['feed', mode, authors.join(','), limit],
    queryFn: ({ pageParam }) => fetchFeedPage({ pageParam, mode, authors, limit }),
    initialPageParam: cursor.until,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5,
    enabled,
  });
  const items = enabled ? query.data?.pages.flatMap((p) => p.items) ?? [] : [];
  const tags = enabled ? query.data?.pages[0]?.tags ?? [] : [];
  const timedOut = enabled ? query.data?.pages.some((p) => p.timedOut) : false;
  const loading = enabled
    ? query.isPending || (query.isFetching && items.length === 0)
    : false;
  const prepend = (item: VideoCardProps) => {
    if (!enabled) return;
    queryClient.setQueryData(['feed', mode, authors.join(','), limit], (old: any) => {
      if (!old) return old;
      return {
        ...old,
        pages: [{ ...old.pages[0], items: [item, ...old.pages[0].items] }, ...old.pages.slice(1)],
      };
    });
  };
  return {
    items,
    tags,
    prepend,
    loadMore: enabled
      ? () => query.fetchNextPage({ cancelRefetch: false })
      : () => {},
    loading,
    error: timedOut ? new Error('Relay connection timed out') : undefined,
  };
}

export function prefetchFeed(
  mode: FeedMode,
  authors: string[] = [],
  limit = FEED_PAGE_LIMIT,
) {
  return queryClient.prefetchInfiniteQuery({
    queryKey: ['feed', mode, authors.join(','), limit],
    queryFn: ({ pageParam }) => fetchFeedPage({ pageParam, mode, authors, limit }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 5,
  });
}

export default useFeed;
