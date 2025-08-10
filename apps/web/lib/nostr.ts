'use client';
import NDK from '@nostr-dev-kit/ndk';
import { getPublicKey } from 'nostr-tools/pure';
import { hexToBytes, normalizeURL } from 'nostr-tools/utils';
import relaysConfig from '../relays.json';
import { bus } from '@/agents/bus';

/**
 * Shared NDK instance initialised with the application's relay list.
 */
export const ndk = new NDK({ explicitRelayUrls: getRelays() });

export type NDKConnectionStatus = 'connecting' | 'connected' | 'error';

export let ndkConnectionStatus: NDKConnectionStatus = 'connecting';

export const NDK_STATUS_EVENT = 'pd.ndkstatus';

function setStatus(status: NDKConnectionStatus) {
  ndkConnectionStatus = status;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(NDK_STATUS_EVENT, { detail: status }));
  }
}

let retryTimeout: ReturnType<typeof setTimeout> | undefined;

async function connectNDK(attempt = 0): Promise<void> {
  clearTimeout(retryTimeout);
  setStatus('connecting');
  try {
    await ndk.connect();
    if (ndk.pool.connectedRelays().length === 0) {
      console.warn('NDK connected with zero relays');
      setStatus('error');
      const delay = Math.min(1000 * 2 ** attempt, 30000);
      retryTimeout = setTimeout(() => connectNDK(attempt + 1), delay);
      return;
    }
    setStatus('connected');
  } catch (err) {
    console.error('NDK connection failed', err);
    setStatus('error');
    const delay = Math.min(1000 * 2 ** attempt, 30000);
    retryTimeout = setTimeout(() => connectNDK(attempt + 1), delay);
  }
}

// establish connections eagerly so hooks/components can use it immediately
void connectNDK();

// update relay connections when the list changes
bus.on('nostr.relays.changed', ({ relays }) => {
  ndk.explicitRelayUrls = relays;
  void connectNDK();
});

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
    return getPublicKey(hexToBytes(sk));
  } catch {
    return undefined;
  }
}

/** Relays you want to hit – tweak as needed */
const DEFAULT_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.snort.social'];

export function normalizeRelay(url: string): string | undefined {
  try {
    const normalized = normalizeURL(url);
    const u = new URL(normalized);
    if (u.protocol !== 'ws:' && u.protocol !== 'wss:') return undefined;
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  } catch {
    return undefined;
  }
}

export function parseRelays(input: unknown): string[] | undefined {
  let relays: string[] | undefined;
  if (Array.isArray(input)) {
    relays = input.filter((r): r is string => typeof r === 'string' && r.length > 0);
  } else if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      if (Array.isArray(parsed)) {
        relays = parsed.filter((r): r is string => typeof r === 'string' && r.length > 0);
      }
    } catch {
      // not JSON
    }
    if (!relays) {
      relays = input
        .split(',')
        .map((r) => r.trim())
        .filter((r): r is string => r.length > 0);
    }
  }

  return relays?.map((r) => normalizeRelay(r)).filter((r): r is string => !!r);
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

export default ndk;
