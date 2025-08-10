'use client';
import { useQueries } from '@tanstack/react-query';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { getEventsByPubkey, saveEvent } from '@/lib/db';
import { queryClient } from '@/lib/queryClient';
import { cacheImage, getCachedImage } from '@/lib/imageCache';

export type Profile = {
  name?: string;
  picture?: string;
  pictureRevoke?: () => void;
  about?: string;
  lud16?: string;
  wallets?: { label: string; lnaddr: string; default?: boolean }[];
  zapSplits?: { lnaddr: string; pct: number }[];
};

function ensureWallets(content: any) {
  if (Array.isArray(content.wallets) && content.wallets.length > 0) {
    if (typeof content.lud16 !== 'string' || !content.lud16) {
      const def = content.wallets.find((w: any) => w?.default)?.lnaddr || content.wallets[0]?.lnaddr;
      if (def) content.lud16 = def;
    }
  } else if (typeof content.lud16 === 'string' && content.lud16) {
    content.wallets = [{ label: 'Default', lnaddr: content.lud16, default: true }];
  } else {
    content.wallets = [];
  }
}

async function loadPicture(url: string) {
  let target = url;
  if (typeof window !== 'undefined') {
    try {
      const abs = new URL(url, location.href);
      if (abs.origin !== location.origin) {
        target = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      }
    } catch {
      /* ignore */
    }
  }
  const cached = await getCachedImage(target);
  return cached || (await cacheImage(target));
}

async function fetchProfile(pubkey: string): Promise<Profile> {
  const events = await getEventsByPubkey(pubkey);
  const latest = events
    .filter((e) => e.kind === nostrKinds.Metadata)
    .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))[0];
  if (latest) {
    try {
      const content = JSON.parse(latest.content);
      ensureWallets(content);
      if (content.picture) {
        const img = await loadPicture(content.picture);
        content.picture = img.url;
        content.pictureRevoke = img.revoke;
      }
      return content;
    } catch {
      /* ignore */
    }
  }
  return await new Promise<Profile>((resolve) => {
    let profile: Profile | null = null;
    const sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Metadata], authors: [pubkey], limit: 1 } as Filter],
      {
        onevent: async (ev: any) => {
          try {
            const content = JSON.parse(ev.content);
            ensureWallets(content);
            if (content.picture) {
              const img = await loadPicture(content.picture);
              content.picture = img.url;
              content.pictureRevoke = img.revoke;
            }
            await saveEvent(ev);
            profile = content;
          } catch {
            profile = {};
          }
        },
        oneose: () => {
          sub.close();
          resolve(profile || {});
        },
      },
    );
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
