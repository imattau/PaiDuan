'use client';
import { useEffect } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { useFollowingStore, setFollowing } from '@/store/following';
import { useAuth } from './useAuth';

export function useFollowing(pubkey?: string) {
  const { state } = useAuth();
  const actualPubkey = pubkey ?? (state.status === 'ready' ? state.pubkey : undefined);
  const store = useFollowingStore();

  useEffect(() => {
    if (!actualPubkey) return;
    const sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Contacts], authors: [actualPubkey] } as Filter],
      {
        onevent: (ev: any) => {
          const contacts = ev.tags
            .filter((t: any) => t[0] === 'p' && typeof t[1] === 'string')
            .map((t: any) => t[1]);
          setFollowing(Array.from(new Set(contacts)));
        },
        oneose: () => sub.close(),
      },
    );
    return () => sub.close();
  }, [actualPubkey]);

  return store;
}

export default useFollowing;
