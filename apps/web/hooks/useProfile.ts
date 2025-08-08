'use client';
import { useEffect, useState } from 'react';
import { type Filter } from 'nostr-tools';
import * as nostrKinds from 'nostr-tools/kinds';
import { getPool, RELAYS } from '@/lib/nostr';

export function useProfile(pubkey?: string) {
  const [meta, setMeta] = useState<any>(null);
  useEffect(() => {
    if (!pubkey) return;
    const pool = getPool();
    const sub = pool.subscribeMany(
      RELAYS,
      [{ kinds: [nostrKinds.Metadata], authors: [pubkey], limit: 1 } as Filter],
      {},
    );
    sub.on('event', (ev) => {
      try {
        setMeta(JSON.parse(ev.content));
      } catch {}
    });
    return () => sub.close();
  }, [pubkey]);
  return meta as { name?: string; picture?: string; about?: string } | null;
}
