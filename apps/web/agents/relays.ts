"use client";

import { useSyncExternalStore } from 'react';
import { getRelays as loadRelays, normalizeRelay } from '@/lib/nostr';
import { bus } from './bus';

let relays: string[] = [];

export function initRelays(): void {
  relays = loadRelays();
  bus.emit({ type: 'nostr.relays.changed', relays });
}

initRelays();

function persist() {
  try {
    localStorage.setItem('pd.relays', JSON.stringify(relays));
  } catch {
    /* ignore */
  }
  bus.emit({ type: 'nostr.relays.changed', relays });
}

export function addRelay(url: string): void {
  const normalized = normalizeRelay(url.trim());
  if (!normalized) return;
  if (relays.includes(normalized)) return;
  relays.push(normalized);
  persist();
}

export function removeRelay(url: string): void {
  relays = relays.filter((r) => r !== url);
  persist();
}

export function useRelays() {
  const subscribe = (cb: () => void) => bus.on('nostr.relays.changed', cb);
  const list = useSyncExternalStore(subscribe, () => relays, () => relays);
  return { relays: list, addRelay, removeRelay };
}

export const relaysAgent = { useRelays, addRelay, removeRelay, initRelays };
export default relaysAgent;
