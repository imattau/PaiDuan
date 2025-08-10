"use client";

import type { Event as NostrEvent, EventTemplate } from 'nostr-tools/pure';
import type { Signer } from '@/lib/signers/types';
import pool from '@/lib/relayPool';
import { getRelays } from '@/lib/nostr';
import comments from './nostr.comments';

/**
 * Repost a Nostr event by ID.
 *
 * Inputs:
 * - eventId: the ID of the event to repost
 * - originalPubkey: pubkey of the original author
 * - myPubkey: pubkey of the user performing the repost
 * - signer: capable of signing Nostr events
 *
 * Outputs:
 * - resolves when publish succeeds
 * - throws if the original event cannot be found or publishing fails
 */
export async function repost({
  eventId,
  originalPubkey,
  myPubkey,
  signer,
}: {
  eventId: string;
  originalPubkey: string;
  myPubkey: string;
  signer: Signer;
}): Promise<void> {
  const relays = getRelays();
  let original: NostrEvent | null = null;
  let relayUrl: string | undefined;

  for (const r of relays) {
    original = await pool.get([r], { ids: [eventId] });
    if (original) {
      relayUrl = r;
      break;
    }
  }

  if (!original || !relayUrl) {
    throw new Error('Original event not found');
  }

  const event: EventTemplate & { pubkey: string } = {
    kind: 6,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['e', eventId, relayUrl],
      ['p', originalPubkey],
    ],
    content: JSON.stringify(original),
    pubkey: myPubkey,
  };

  const signed = await signer.signEvent(event);
  await pool.publish(relays, signed);
}

export const nostr = {
  repost,
  comments,
};

export default nostr;
