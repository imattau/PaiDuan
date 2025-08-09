import ndk from './nostr';
import { NDKEvent } from '@nostr-dev-kit/ndk';

// Lightweight wrapper around NDK providing a SimplePool-like interface
// used throughout the app. Relay lists are handled inside the NDK
// instance so the first argument is ignored.

export default {
  subscribeMany(_relays: string[], filters: any[], handlers: any) {
    const sub = ndk.subscribe(filters);
    if (handlers?.onevent) {
      sub.on('event', (ev: any) => handlers.onevent(ev.rawEvent ? ev.rawEvent() : ev));
    }
    if (handlers?.oneose) {
      sub.on('eose', () => handlers.oneose());
    }
    return { close: () => sub.stop() } as { close: () => void };
  },

  async list(_relays: string[], filters: any[]) {
    const events = await ndk.fetchEvents(filters);
    return Array.from(events).map((e: any) => (e.rawEvent ? e.rawEvent() : e));
  },

  async get(_relays: string[], filter: any) {
    const ev = await ndk.fetchEvent(filter);
    return ev ? (ev.rawEvent ? ev.rawEvent() : ev) : null;
  },

  async publish(_relays: string[] | any, event: any) {
    const ndkEvent = event instanceof NDKEvent ? event : new NDKEvent(ndk, event);
    await ndk.publish(ndkEvent);
  },
};
