'use client';
import { useEffect, useState } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';

const TTL_MS = 1000 * 60 * 60; // 1 hour

interface FollowerCache {
  count: number;
  list?: string[];
  ts: number;
}

function loadCache(pubkey: string): FollowerCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`followers-${pubkey}`);
    if (!raw) return null;
    const data = JSON.parse(raw) as FollowerCache;
    if (Date.now() - data.ts > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

export function useFollowers(pubkey?: string) {
  const [followers, setFollowers] = useState<string[]>([]);
  useEffect(() => {
    if (!pubkey) return;
    const cached = loadCache(pubkey);
    if (cached?.list) {
      setFollowers(cached.list);
      return;
    }
    const seen = new Set<string>();
    const sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Contacts], '#p': [pubkey] } as Filter],
        {
          onevent: (ev: any) => {
          if (!seen.has(ev.pubkey)) {
            seen.add(ev.pubkey);
            setFollowers(Array.from(seen));
          }
        },
        oneose: () => {
          if (typeof window !== 'undefined') {
            const payload: FollowerCache = {
              count: seen.size,
              list: Array.from(seen),
              ts: Date.now(),
            };
            window.localStorage.setItem(
              `followers-${pubkey}`,
              JSON.stringify(payload),
            );
          }
          sub.close();
        },
      },
    );
    return () => sub.close();
  }, [pubkey]);
  return followers;
}

export default useFollowers;
