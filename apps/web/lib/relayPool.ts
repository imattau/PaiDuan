import ndk from './nostr';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { SimplePool, Relay } from 'nostr-tools';

const simplePool = new SimplePool();

function ensureConnected(op: string): boolean {
  if (ndk.pool.connectedRelays().length > 0) return true;
  console.warn(`relayPool.${op} called with no connected relays`);
  return false;
}

// Lightweight wrapper around NDK providing a SimplePool-like interface
// used throughout the app. When a relay list is provided the underlying
// SimplePool is used directly, otherwise the shared NDK instance
// handles routing.

  export default {
    subscribeMany(relays: (string | Relay)[] = [], filters: any[], handlers: any) {
      if (relays.length > 0)
        return simplePool.subscribeMany(relays as string[], filters, handlers);

    if (!ensureConnected('subscribeMany')) return { close: () => {} } as { close: () => void };

    const sub = ndk.subscribe(filters);
    if (handlers?.onevent) {
      sub.on('event', (ev: any) => handlers.onevent(ev.rawEvent ? ev.rawEvent() : ev));
    }
    if (handlers?.oneose) {
      sub.on('eose', () => handlers.oneose());
    }
    return { close: () => sub.stop() } as { close: () => void };
  },

    async list(relays: (string | Relay)[] = [], filters: any[]) {
      if (relays.length > 0) {
        const results = await Promise.all(
          filters.map((f) => simplePool.querySync(relays as string[], f)),
        );
        return results.flat();
      }

    if (!ensureConnected('list')) return [];

    const events = await ndk.fetchEvents(filters);
    return Array.from(events).map((e: any) => (e.rawEvent ? e.rawEvent() : e));
  },

    async get(relays: (string | Relay)[] = [], filter: any) {
      if (relays.length > 0) return simplePool.get(relays as string[], filter);

      if (!ensureConnected('get')) return null;

      const ev = await ndk.fetchEvent(filter);
      return ev ? ((ev as any).rawEvent ? (ev as any).rawEvent() : ev) : null;
    },

    async publish(relays: (string | Relay)[] = [], event: any) {
      if (relays.length > 0) {
        const raw = event instanceof NDKEvent ? event.rawEvent() : event;
        return simplePool.publish(relays as string[], raw);
      }

    if (!ensureConnected('publish')) return;

      const ndkEvent = event instanceof NDKEvent ? event : new NDKEvent(ndk, event);
      await ndkEvent.publish();
    },
  };
