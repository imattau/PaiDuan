import { useEffect, useRef, useState, useMemo } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { VideoCardProps } from '../components/VideoCard';
import { ADMIN_PUBKEYS } from '../utils/admin';
import { getRelays } from '@/lib/nostr';
import { useModqueue } from '@/context/modqueueContext';
import { getAllEvents, saveEvent } from '@/lib/db';

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
}

export function useFeed(mode: FeedMode, authors: string[] = []): FeedResult {
  const [items, setItems] = useState<VideoCardProps[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const poolRef = useRef<SimplePool>();
  const subRef = useRef<{ close: () => void } | null>(null);
  const modqueue = useModqueue();
  const [extraHiddenIds, setExtraHiddenIds] = useState<Set<string>>(new Set());

  const hiddenIds = useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    const hidden = new Set<string>();
    modqueue
      .filter((r) => r.targetKind === 'video')
      .forEach((r) => {
        counts[r.targetId] = counts[r.targetId] || new Set();
        counts[r.targetId].add(r.reporterPubKey);
        if (ADMIN_PUBKEYS.includes(r.reporterPubKey)) hidden.add(r.targetId);
      });
    Object.entries(counts).forEach(([id, set]) => {
      if (set.size >= 3) hidden.add(id);
    });
    extraHiddenIds.forEach((id) => hidden.add(id));
    return hidden;
  }, [modqueue, extraHiddenIds]);

  const hiddenRef = useRef(hiddenIds);
  useEffect(() => {
    hiddenRef.current = hiddenIds;
  }, [hiddenIds]);

  useEffect(() => {
    const pool = (poolRef.current ||= new SimplePool());
    const relays = getRelays();
    const sub = pool.subscribeMany(relays, [{ kinds: [9001] }], {
      onevent: (ev: any) => {
        const tag = ev.tags.find((t: string[]) => t[0] === 'e');
        if (tag) setExtraHiddenIds((prev) => new Set(prev).add(tag[1]));
      },
    });
    return () => {
      sub.close();
    };
  }, []);

  useEffect(() => {
    const pool = (poolRef.current ||= new SimplePool());
    // clean previous subscription
    subRef.current?.close();

    const filter: Filter = { kinds: [21, 22], limit: 1000 };
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

    const nextItems: VideoCardProps[] = [];
    const tagCounts: Record<string, number> = {};

    const addEvent = (event: NostrEvent, emit = true) => {
      if (hiddenRef.current.has(event.id)) return;
      const { videoUrl, manifestUrl, posterUrl } = parseImeta(event.tags);
      if (!videoUrl && !manifestUrl) return;
      const zapTags = event.tags.filter((t) => t[0] === 'zap');
      const tTags = event.tags.filter((t) => t[0] === 't').map((t) => t[1]);
      tTags.forEach((t) => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });
      const titleTag = event.tags.find((t) => t[0] === 'title');
      nextItems.push({
        videoUrl: videoUrl || manifestUrl || '',
        posterUrl,
        manifestUrl,
        author: event.pubkey.slice(0, 8),
        caption: titleTag ? titleTag[1] : event.content,
        eventId: event.id,
        lightningAddress: zapTags.length ? zapTags[0][1] : '',
        pubkey: event.pubkey,
        zapTotal: 0,
        onLike: () => {},
      });
      if (emit) {
        setItems([...nextItems]);
        if (mode === 'all') {
          const sorted = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([t]) => t);
          setTags(sorted);
        }
      }
    };

    (async () => {
      const cached = await getAllEvents();
      cached
        .filter((ev: any) => [21, 22].includes(ev.kind))
        .filter((ev: any) => {
          if (mode === 'following') return authors.includes(ev.pubkey);
          if (typeof mode === 'object' && 'tag' in mode)
            return ev.tags.some((t: string[]) => t[0] === 't' && t[1] === mode.tag);
          if (typeof mode === 'object' && 'author' in mode) return ev.pubkey === mode.author;
          return true;
        })
        .sort((a: any, b: any) => (b.created_at || 0) - (a.created_at || 0))
        .forEach((ev: any) => addEvent(ev, false));
      setItems([...nextItems]);
      if (mode === 'all') {
        const sorted = Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([t]) => t);
        setTags(sorted);
      }
    })();

    const relays = getRelays();
    const sub = pool.subscribeMany(relays, [filter], {
      onevent: async (event: NostrEvent) => {
        addEvent(event);
        await saveEvent(event);
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
