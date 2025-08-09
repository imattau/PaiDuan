'use client';
import { useEffect, useState } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getPool, getRelays } from '@/lib/nostr';

export function useProfile(pubkey?: string) {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => {
    if (!pubkey) return;
    const pool = getPool();
    const sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Metadata], authors: [pubkey], limit: 1 } as Filter],
      {
        onevent: (ev) => {
          try {
            const content = JSON.parse(ev.content);
            if (!Array.isArray(content.wallets)) {
              if (typeof content.lud16 === 'string' && content.lud16) {
                content.wallets = [
                  { label: 'Default', lnaddr: content.lud16, default: true },
                ];
              } else {
                content.wallets = [];
              }
            }
            setMeta(content);
          } catch {}
        },
      },
    );
    return () => sub.close();
  }, [pubkey]);
  return meta as {
    name?: string;
    picture?: string;
    about?: string;
    lud16?: string;
    wallets?: { label: string; lnaddr: string; default?: boolean }[];
  } | null;
}
