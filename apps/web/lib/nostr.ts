'use client';
import { SimplePool, getPublicKey } from 'nostr-tools';

let _pool: SimplePool | null = null;

export function getPool() {
  if (!_pool) _pool = new SimplePool();
  return _pool;
}

/** TODO: replace with your real key vault */
export function getMyPrivkey(): string | undefined {
  try {
    return localStorage.getItem('nostr:privkey') ?? undefined;
  } catch {
    return undefined;
  }
}
export function getMyPubkey(): string | undefined {
  const sk = getMyPrivkey();
  if (!sk) return undefined;
  try {
    return getPublicKey(sk);
  } catch {
    return undefined;
  }
}

/** Relays you want to hit – tweak as needed */
export const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
];
