"use client";

import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Signer } from '@/lib/signers/types';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';

export function subscribe(
  videoId: string,
  onEvent: (ev: NostrEvent) => void,
  onHide?: (id: string) => void,
): { close: () => void } {
  const relays = getRelays();
  const sub = pool.subscribeMany(relays, [{ kinds: [1], '#e': [videoId] }], {
    onevent: onEvent,
  });

  let hideSub: { close: () => void } | undefined;
  if (onHide) {
    hideSub = pool.subscribeMany(relays, [{ kinds: [9001] }], {
      onevent: (ev: NostrEvent) => {
        const tag = ev.tags.find((t) => t[0] === 'e');
        if (tag) onHide(tag[1]);
      },
    });
  }

  return {
    close: () => {
      sub.close();
      hideSub?.close();
    },
  };
}

export async function sendComment(
  videoId: string,
  content: string,
  signer: Signer,
  replyTo?: NostrEvent,
): Promise<NostrEvent> {
  const relays = getRelays();
  const pubkey = await signer.getPublicKey();
  const tags: string[][] = [["e", videoId]];
  if (replyTo) {
    tags.push(["e", replyTo.id]);
    tags.push(["p", replyTo.pubkey]);
  }
  const event: any = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags,
    content,
    pubkey,
  };
  const signed = await signer.signEvent(event);
  await pool.publish(relays, signed);
  return signed;
}

export const comments = { subscribe, sendComment };
export default comments;
