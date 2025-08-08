import { useEffect, useRef, useState } from 'react';
import { SimplePool } from 'nostr-tools/pool';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { VideoCardProps } from '../components/VideoCard';
import { getRelays } from '@/lib/nostr';

export interface CreatorResult {
  pubkey: string;
  name: string;
  picture?: string;
}

export interface SearchResults {
  videos: VideoCardProps[];
  creators: CreatorResult[];
}


export function useSearch(query: string): SearchResults {
  const [videos, setVideos] = useState<VideoCardProps[]>([]);
  const [creators, setCreators] = useState<CreatorResult[]>([]);
  const poolRef = useRef<SimplePool>();
  const subRef = useRef<{ close: () => void } | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!query) {
      setVideos([]);
      setCreators([]);
      subRef.current?.close();
      return;
    }

    const pool = (poolRef.current ||= new SimplePool());
    subRef.current?.close();
    if (timerRef.current) clearTimeout(timerRef.current);

    const relays = getRelays();
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

    const nextVideos: VideoCardProps[] = [];
    const nextCreators: CreatorResult[] = [];
    const sub = pool.subscribeMany(relays, filters, {
      onevent: (ev: NostrEvent) => {
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
      },
    });

    timerRef.current = setTimeout(() => sub.close(), 20000);
    subRef.current = sub;

    return () => {
      sub.close();
    };
  }, [query]);

  return { videos, creators };
}

export default useSearch;
