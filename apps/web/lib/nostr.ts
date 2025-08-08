'use client';
import { SimplePool } from 'nostr-tools/pool';
import { getPublicKey } from 'nostr-tools/pure';

let _pool: SimplePool | null = null;

export function getPool() {
  if (!_pool) _pool = new SimplePool();
  return _pool;
}

export interface KeyVault {
  getPrivateKey(): string | undefined;
  getPublicKey(): string | undefined;
}

export class LocalStorageKeyVault implements KeyVault {
  getPrivateKey(): string | undefined {
    try {
      return localStorage.getItem('nostr:privkey') ?? undefined;
    } catch {
      return undefined;
    }
  }

  getPublicKey(): string | undefined {
    const sk = this.getPrivateKey();
    if (!sk) return undefined;
    try {
      return getPublicKey(sk);
    } catch {
      return undefined;
    }
  }
}

/** TODO: replace with your real key vault */
export let keyVault: KeyVault = new LocalStorageKeyVault();

export function getMyPrivkey(): string | undefined {
  return keyVault.getPrivateKey();
}
export function getMyPubkey(): string | undefined {
  return keyVault.getPublicKey();
}

/** Relays you want to hit – tweak as needed */
export const RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
];
