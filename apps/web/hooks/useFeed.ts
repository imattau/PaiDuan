import { useEffect, useRef, useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { VideoCardProps } from '../components/VideoCard';
import { ADMIN_PUBKEYS } from '../utils/admin';
import { getRelays } from '@/lib/nostr';

export type FeedMode = 'all' | 'following' | { tag: string } | { author: string }; 

interface FeedResult {
  items: VideoCardProps[];
  tags: string[];
  prepend: (item: VideoCardProps) => void;
}

export function useFeed(mode: FeedMode, authors: string[] = []): FeedResult {
  const [items, setItems] = useState<VideoCardProps[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const poolRef = useRef<SimplePool>();
  const subRef = useRef<{ close: () => void } | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const hiddenRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    hiddenRef.current = hiddenIds;
  }, [hiddenIds]);

  const loadReports = () => {
    fetch('/api/modqueue')
      .then((r) => r.json())
      .then((data: any[]) => {
        const counts: Record<string, Set<string>> = {};
        const hidden = new Set<string>();
        data
          .filter((r) => r.targetKind === 'video')
          .forEach((r) => {
            counts[r.targetId] = counts[r.targetId] || new Set();
            counts[r.targetId].add(r.reporterPubKey);
            if (ADMIN_PUBKEYS.includes(r.reporterPubKey)) hidden.add(r.targetId);
          });
        Object.entries(counts).forEach(([id, set]) => {
          if (set.size >= 3) hidden.add(id);
        });
        setHiddenIds(hidden);
      })
      .catch(() => undefined);
  };

  // load reports & hide events
  useEffect(() => {
    loadReports();
    const listener = () => loadReports();
    window.addEventListener('modqueue', listener);

    const pool = (poolRef.current ||= new SimplePool());
    const relays = getRelays();
    const sub = pool.subscribeMany(relays, [{ kinds: [9001] }], {
      onevent: (ev: any) => {
        const tag = ev.tags.find((t: string[]) => t[0] === 'e');
        if (tag) setHiddenIds((prev) => new Set(prev).add(tag[1]));
      },
    });
    return () => {
      window.removeEventListener('modqueue', listener);
      sub.close();
    };
  }, []);

  useEffect(() => {
    const pool = (poolRef.current ||= new SimplePool());
    // clean previous subscription
    subRef.current?.close();

    const filter: Filter = { kinds: [30023], limit: 1000 };
    if (mode === 'following') {
      if (authors.length === 0) {
        setItems([]);
        return;
      }
      filter.authors = authors;
    } else if (typeof mode === 'object' && 'tag' in mode) {
      filter['#t'] = [mode.tag];
    } else if (typeof mode === 'object' && 'author' in mode) {
      filter.authors = [mode.author];
    }

    const relays = getRelays();
    const nextItems: VideoCardProps[] = [];
    const tagCounts: Record<string, number> = {};
    const sub = pool.subscribeMany(relays, [filter], {
      onevent: (event: NostrEvent) => {
        if (hiddenRef.current.has(event.id)) return;
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
        if (mode === 'all') {
          const sorted = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t);
          setTags(sorted);
        }
      },
      oneose: () => {},
    });

    subRef.current = sub;
    return () => sub.close();
  }, [JSON.stringify(mode), authors.join(',')]);

  const prepend = (item: VideoCardProps) => setItems((prev) => [item, ...prev]);

  return { items, tags, prepend };
}

export default useFeed;
