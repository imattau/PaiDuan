import ndk from './nostr';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { SimplePool, Relay } from 'nostr-tools';

const simplePool = new SimplePool();

// Lightweight wrapper around NDK providing a SimplePool-like interface
// used throughout the app. When a relay list is provided the underlying
// SimplePool is used directly, otherwise the shared NDK instance
// handles routing.

const relayPool = {
  subscribeMany(relays: (string | Relay)[] = [], filters: any[], handlers: any) {
    if (relays.length > 0) return simplePool.subscribeMany(relays, filters, handlers);

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
    if (relays.length > 0) return simplePool.list(relays, filters);

    const events = await ndk.fetchEvents(filters);
    return Array.from(events).map((e: any) => (e.rawEvent ? e.rawEvent() : e));
  },

  async get(relays: (string | Relay)[] = [], filter: any) {
    if (relays.length > 0) return simplePool.get(relays, filter);

    const ev = await ndk.fetchEvent(filter);
    return ev ? (ev.rawEvent ? ev.rawEvent() : ev) : null;
  },

  async publish(relays: (string | Relay)[] = [], event: any) {
    if (relays.length > 0) {
      const raw = event instanceof NDKEvent ? event.rawEvent() : event;
      return simplePool.publish(relays, raw);
    }

    const ndkEvent = event instanceof NDKEvent ? event : new NDKEvent(ndk, event);
    await ndk.publish(ndkEvent);
  },
};

export default relayPool;
