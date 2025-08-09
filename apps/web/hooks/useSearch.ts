import { useEffect, useRef, useState } from 'react';
import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';
import { VideoCardProps } from '../components/VideoCard';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';

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
  const subRef = useRef<{ close: () => void } | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    subRef.current?.close();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query) {
      setVideos([]);
      setCreators([]);
      return;
    }

    const filters: Filter[] = [];
    const q = query.startsWith('@') || query.startsWith('#') ? query.slice(1) : query;

    if (query.startsWith('@')) {
      filters.push({ kinds: [0], search: q, limit: 20 } as Filter);
    } else {
      // search videos and creators
      const videoFilter: Filter = { kinds: [21, 22], search: q, limit: 50 };
      if (query.startsWith('#')) {
        (videoFilter as any)['#t'] = [q];
      }
      filters.push(videoFilter);
      filters.push({ kinds: [0], search: q, limit: 20 } as Filter);
    }

    const nextVideos: VideoCardProps[] = [];
    const nextCreators: CreatorResult[] = [];

    debounceRef.current = setTimeout(() => {
      const sub = pool.subscribeMany(getRelays(), filters, {
        onevent: (ev: NostrEvent) => {
          if (ev.kind === 21 || ev.kind === 22) {
            const { videoUrl, manifestUrl, posterUrl } = parseImeta(ev.tags);
            if (!videoUrl && !manifestUrl) return;
            const zapTags = ev.tags.filter((t) => t[0] === 'zap');
            const tTags = ev.tags.filter((t) => t[0] === 't').map((t) => t[1]);
            const titleTag = ev.tags.find((t) => t[0] === 'title');
            nextVideos.push({
              videoUrl: videoUrl || manifestUrl || '',
              posterUrl,
              manifestUrl,
              author: ev.pubkey.slice(0, 8),
              caption: titleTag ? titleTag[1] : ev.content,
              eventId: ev.id,
              lightningAddress: zapTags.length ? zapTags[0][1] : '',
              pubkey: ev.pubkey,
              zapTotal: 0,
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
      subRef.current = sub;
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      subRef.current?.close();
    };
  }, [query]);

  return { videos, creators };
}

export default useSearch;
