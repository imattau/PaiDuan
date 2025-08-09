'use client';
import { useEffect, useState } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getPool, getRelays } from '@/lib/nostr';
import { getEventsByPubkey, saveEvent } from '@/lib/db';

export type Profile = {
  name?: string;
  picture?: string;
  about?: string;
  lud16?: string;
  wallets?: { label: string; lnaddr: string; default?: boolean }[];
  zapSplits?: { lnaddr: string; pct: number }[];
};

const cache = new Map<string, Profile>();

export function useProfiles(pubkeys: string[]) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let sub: { close: () => void } | undefined;
    (async () => {
      for (const pk of pubkeys) {
        if (cache.has(pk)) continue;
        const events = await getEventsByPubkey(pk);
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
            cache.set(pk, content);
            forceUpdate((x) => x + 1);
          } catch {}
        }
      }
      const missing = pubkeys.filter((pk) => !cache.has(pk));
      if (missing.length === 0) return;
      const pool = getPool();
      sub = pool.subscribeMany(
        getRelays(),
        [{ kinds: [nostrKinds.Metadata], authors: missing, limit: 1 } as Filter],
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
              cache.set(ev.pubkey, content);
              await saveEvent(ev);
              forceUpdate((x) => x + 1);
            } catch {}
          },
        },
      );
    })();
    return () => sub?.close();
  }, [pubkeys.join(',')]);

  return cache;
}

// For testing
export function __clearProfileCache() {
  cache.clear();
}

export { cache as __profileCache };
