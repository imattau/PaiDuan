'use client';
import { useEffect } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { getRelays } from '@/lib/nostr';
import pool from '@/lib/relayPool';
import { useFollowingStore, setFollowing } from '@/store/following';
import { useAuth } from './useAuth';

// Track active subscriptions per pubkey to avoid duplicate network traffic.
const activeSubs = new Map<string, { sub: { close: () => void }; refs: number }>();

export function useFollowing(pubkey?: string) {
  const { state } = useAuth();
  const actualPubkey = pubkey ?? (state.status === 'ready' ? state.pubkey : undefined);
  const store = useFollowingStore();

  useEffect(() => {
    if (!actualPubkey) return;

    const entry = activeSubs.get(actualPubkey);
    if (entry) {
      entry.refs++;
      return () => {
        const e = activeSubs.get(actualPubkey);
        if (e && --e.refs === 0) {
          e.sub.close();
          activeSubs.delete(actualPubkey);
        }
      };
    }

    let sub: { close: () => void };
    sub = pool.subscribeMany(
      getRelays(),
      [{ kinds: [nostrKinds.Contacts], authors: [actualPubkey] } as Filter],
      {
        onevent: (ev: any) => {
          const contacts = ev.tags
            .filter((t: any) => t[0] === 'p' && typeof t[1] === 'string')
            .map((t: any) => t[1]);
          setFollowing(Array.from(new Set(contacts)));
        },
        oneose: () => {
          sub.close();
          activeSubs.delete(actualPubkey);
        },
      },
    );
    activeSubs.set(actualPubkey, { sub, refs: 1 });

    return () => {
      const e = activeSubs.get(actualPubkey);
      if (e && --e.refs === 0) {
        e.sub.close();
        activeSubs.delete(actualPubkey);
      }
    };
  }, [actualPubkey]);

  return store;
}

export default useFollowing;
