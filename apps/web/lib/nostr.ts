'use client';
import { SimplePool } from 'nostr-tools/pool';
import { getPublicKey } from 'nostr-tools/pure';
import relaysConfig from '../relays.json';

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
const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.snort.social',
];

function parseRelays(input: unknown): string[] | undefined {
  if (Array.isArray(input)) {
    return input.filter((r): r is string => typeof r === 'string' && r.length > 0);
  }
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        return parsed.filter((r): r is string => typeof r === 'string' && r.length > 0);
      }
    } catch {
      // not JSON
    }
    return input
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
  }
  return undefined;
}

export const RELAYS: string[] =
  parseRelays(process.env.NEXT_PUBLIC_RELAYS) ??
  parseRelays(relaysConfig) ??
  DEFAULT_RELAYS;
