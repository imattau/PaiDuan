import { useEffect, useRef, useState } from 'react';
import { SimplePool, Event as NostrEvent, Filter } from 'nostr-tools';
import { VideoCardProps } from '../components/VideoCard';

export type FeedMode = { type: 'all' } | { type: 'following'; authors: string[] } | { type: 'tag'; tag: string };

interface FeedResult {
  items: VideoCardProps[];
  tags: string[];
  prepend: (item: VideoCardProps) => void;
}

function relayList(): string[] {
  if (typeof window === 'undefined') return ['wss://relay.damus.io', 'wss://nos.lol'];
  const nostr = (window as any).nostr;
  if (nostr?.getRelays) {
    try {
      const relays = nostr.getRelays();
      if (Array.isArray(relays)) return relays;
      if (relays && typeof relays === 'object') return Object.keys(relays);
    } catch {
      /* ignore */
    }
  }
  return ['wss://relay.damus.io', 'wss://nos.lol'];
}

export function useFeed(mode: FeedMode): FeedResult {
  const [items, setItems] = useState<VideoCardProps[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const poolRef = useRef<SimplePool>();
  const subRef = useRef<{ unsub: () => void } | null>(null);

  useEffect(() => {
    const pool = (poolRef.current ||= new SimplePool());
    // clean previous subscription
    subRef.current?.unsub();

    const filter: Filter = { kinds: [30023], limit: 1000 };
    if (mode.type === 'following') {
      if (mode.authors.length === 0) {
        setItems([]);
        return;
      }
      filter.authors = mode.authors;
    }
    if (mode.type === 'tag') {
      filter['#t'] = [mode.tag];
    }

    const relays = relayList();
    const sub = pool.sub(relays, [filter]);
    const nextItems: VideoCardProps[] = [];
    const tagCounts: Record<string, number> = {};

    sub.on('event', (event: NostrEvent) => {
      const videoTag = event.tags.find((t) => t[0] === 'v');
      if (!videoTag) return;
      const posterTag = event.tags.find((t) => t[0] === 'image');
      const manifestTag = event.tags.find((t) => t[0] === 'vman');
      const zapTag = event.tags.find((t) => t[0] === 'zap');
      const tTags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      tTags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
      nextItems.push({
        videoUrl: videoTag[1],
        posterUrl: posterTag ? posterTag[1] : undefined,
        manifestUrl: manifestTag ? manifestTag[1] : undefined,
        author: event.pubkey.slice(0, 8),
        caption: tTags.join(' '),
        eventId: event.id,
        lightningAddress: zapTag ? zapTag[1] : '',
        pubkey: event.pubkey,
        zapTotal: 0,
        onLike: () => {},
      });
      setItems([...nextItems]);
      if (mode.type === 'all') {
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([t]) => t);
        setTags(sorted);
      }
    });
    sub.on('eose', () => {});

    subRef.current = sub;
    return () => sub.unsub();
  }, [JSON.stringify(mode)]);

  const prepend = (item: VideoCardProps) => setItems((prev) => [item, ...prev]);

  return { items, tags, prepend };
}

export default useFeed;
