'use client';
import { useQueries } from '@tanstack/react-query';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getPool, getRelays } from '@/lib/nostr';
import { getEventsByPubkey, saveEvent } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';

export type Profile = {
  name?: string;
  picture?: string;
  about?: string;
  lud16?: string;
  wallets?: { label: string; lnaddr: string; default?: boolean }[];
  zapSplits?: { lnaddr: string; pct: number }[];
};

async function fetchProfile(pubkey: string): Promise<Profile> {
  const events = await getEventsByPubkey(pubkey);
  const latest = events
    .filter((e) => e.kind === nostrKinds.Metadata)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0];
  if (latest) {
    try {
      const content = JSON.parse(latest.content);
      if (!Array.isArray(content.wallets)) {
        if (typeof content.lud16 === 'string' && content.lud16) {
          content.wallets = [{ label: 'Default', lnaddr: content.lud16, default: true }];
        } else {
          content.wallets = [];
        }
      }
      return content;
    } catch {
      /* ignore */
    }
  }
  return await new Promise<Profile>((resolve) => {
    const pool = getPool();
    const sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Metadata], authors: [pubkey], limit: 1 } as Filter],
      {
        onevent: async (ev: any) => {
          try {
            const content = JSON.parse(ev.content);
            if (!Array.isArray(content.wallets)) {
              if (typeof content.lud16 === 'string' && content.lud16) {
                content.wallets = [{ label: 'Default', lnaddr: content.lud16, default: true }];
              } else {
                content.wallets = [];
              }
            }
            await saveEvent(ev);
            resolve(content);
          } catch {
            resolve({});
          } finally {
            sub.close();
          }
        },
      },
    );
    setTimeout(() => {
      sub.close();
      resolve({});
    }, 5000);
  });
}

export function useProfiles(pubkeys: string[]) {
  const results = useQueries({
    queries: pubkeys.map((pk) => ({
      queryKey: ['profile', pk],
      queryFn: () => fetchProfile(pk),
      staleTime: 1000 * 60 * 5,
    })),
  });
  const map = new Map<string, Profile>();
  results.forEach((res, idx) => {
    const pk = pubkeys[idx];
    if (res.data) map.set(pk, res.data);
  });
  return map;
}

export function prefetchProfile(pubkey: string) {
  return queryClient.prefetchQuery({
    queryKey: ['profile', pubkey],
    queryFn: () => fetchProfile(pubkey),
    staleTime: 1000 * 60 * 5,
  });
}
