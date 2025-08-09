'use client';
import { SimplePool } from 'nostr-tools/pool';
import { getPublicKey } from 'nostr-tools/pure';
import relaysConfig from '../relays.json';

let _pool: SimplePool | null = null;

export function getPool() {
  if (!_pool) _pool = new SimplePool();
  return _pool;
}

const LS_KEY = 'pd.auth.v1';

function loadAuth(): any | undefined {
  if (typeof localStorage === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function getMyPrivkey(): string | undefined {
  const saved = loadAuth();
  if (saved?.method === 'local') return saved.data?.privkeyHex;
  return undefined;
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
const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.snort.social'];

export function parseRelays(input: unknown): string[] | undefined {
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

export function getRelays(): string[] {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pd.relays');
      const parsed = parseRelays(stored);
      if (parsed && parsed.length > 0) return parsed;
    } catch {
      /* ignore */
    }
  }
  return parseRelays(relaysConfig) ?? DEFAULT_RELAYS;
}
