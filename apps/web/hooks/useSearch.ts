import { useEffect, useRef, useState } from 'react';
import { SimplePool, Event as NostrEvent, Filter } from 'nostr-tools';
import { VideoCardProps } from '../components/VideoCard';

export interface CreatorResult {
  pubkey: string;
  name: string;
  picture?: string;
}

export interface SearchResults {
  videos: VideoCardProps[];
  creators: CreatorResult[];
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

export function useSearch(query: string): SearchResults {
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const poolRef = useRef<SimplePool>();
  const subRef = useRef<{ unsub: () => void } | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query) {
      setVideos([]);
      setCreators([]);
      subRef.current?.unsub();
      return;
    }

    const pool = (poolRef.current ||= new SimplePool());
    subRef.current?.unsub();
    if (timerRef.current) clearTimeout(timerRef.current);

    const relays = relayList();
    const filters: Filter[] = [];
    const q = query.startsWith('@') || query.startsWith('#') ? query.slice(1) : query;

    if (query.startsWith('@')) {
      filters.push({ kinds: [0], search: q, limit: 20 } as Filter);
    } else {
      // search videos and creators
      const videoFilter: Filter = { kinds: [30023], search: q, limit: 50 };
      if (query.startsWith('#')) {
        (videoFilter as any)['#t'] = [q];
      }
      filters.push(videoFilter);
      filters.push({ kinds: [0], search: q, limit: 20 } as Filter);
    }

    const sub = pool.sub(relays, filters);
    const nextVideos: VideoCardProps[] = [];
    const nextCreators: CreatorResult[] = [];

    sub.on('event', (ev: NostrEvent) => {
      if (ev.kind === 30023) {
        const videoTag = ev.tags.find((t) => t[0] === 'v');
        if (!videoTag) return;
        const posterTag = ev.tags.find((t) => t[0] === 'image');
        const manifestTag = ev.tags.find((t) => t[0] === 'vman');
        const zapTag = ev.tags.find((t) => t[0] === 'zap');
        const tTags = ev.tags.filter((t) => t[0] === 't').map((t) => t[1]);
        nextVideos.push({
          videoUrl: videoTag[1],
          posterUrl: posterTag ? posterTag[1] : undefined,
          manifestUrl: manifestTag ? manifestTag[1] : undefined,
          author: ev.pubkey.slice(0, 8),
          caption: tTags.join(' '),
          eventId: ev.id,
          lightningAddress: zapTag ? zapTag[1] : '',
          pubkey: ev.pubkey,
          zapTotal: 0,
          onLike: () => {},
        });
        setVideos([...nextVideos]);
      } else if (ev.kind === 0) {
        try {
          const content = JSON.parse(ev.content);
          nextCreators.push({
            pubkey: ev.pubkey,
            name: content.name || ev.pubkey.slice(0, 8),
            picture: content.picture,
          });
          setCreators([...nextCreators]);
        } catch {
          /* ignore */
        }
      }
    });

    timerRef.current = setTimeout(() => sub.unsub(), 20000);
    subRef.current = sub;

    return () => {
      sub.unsub();
    };
  }, [query]);

  return { videos, creators };
}

export default useSearch;
