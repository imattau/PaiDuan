'use client';
import { useEffect, useState } from 'react';
import * as nostrKinds from 'nostr-tools/kinds';
import type { Filter } from 'nostr-tools/filter';
import { register } from '@/lib/subRegistry';

export function useFollowers(pubkey?: string) {
  const [followers, setFollowers] = useState<string[]>([]);
  useEffect(() => {
    if (!pubkey) return;
    const seen = new Set<string>();
    const sub = register(
      [{ kinds: [nostrKinds.Contacts], '#p': [pubkey] } as Filter],
      {
        onevent: (ev) => {
          if (!seen.has(ev.pubkey)) {
            seen.add(ev.pubkey);
            setFollowers(Array.from(seen));
          }
        },
      },
    );
    return () => sub.close();
  }, [pubkey]);
  return followers;
}

export default useFollowers;
