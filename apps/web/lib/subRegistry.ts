import type { Event as NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'nostr-tools/filter';

import { getRelays } from './nostr';
import pool from './relayPool';

type Handler = {
  onevent?: (ev: NostrEvent) => void;
  oneose?: () => void;
};

function normalizeFilter(filter: Filter): Filter {
  const out: Filter = {};

  Object.entries(filter).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      // sort arrays for stable key generation
      (out as any)[k] = [...v].sort();
    } else {
      (out as any)[k] = v;
    }
  });

  if (out.limit !== undefined) {
    const l = out.limit;
    // clamp limit between 1 and 500
    out.limit = Math.max(1, Math.min(l, 500));
  }

  if (out.since !== undefined) {
    const s = out.since;
    // don't allow negative since values
    out.since = Math.max(0, s);
  }

  return out;
}

function keyFor(filter: Filter, relays: string[]): string {
  return JSON.stringify({
    filter,
    relays: [...relays].sort(),
  });
}

class SubRegistry {
  private subs = new Map<
    string,
    { sub: { close: () => void }; handlers: Set<Handler> }
  >();

  register(filters: Filter[], handler: Handler) {
    const relays = getRelays();
    const unsubs: (() => void)[] = [];

    for (const f of filters) {
      const norm = normalizeFilter(f);
      const key = keyFor(norm, relays);
      let entry = this.subs.get(key);
      if (!entry) {
        const handlers = new Set<Handler>();
        const sub = pool.subscribeMany(relays, [norm], {
          onevent: (ev: NostrEvent) => {
            handlers.forEach((h) => h.onevent?.(ev));
          },
          oneose: () => {
            handlers.forEach((h) => h.oneose?.());
            sub.close();
            this.subs.delete(key);
          },
        });
        entry = { sub, handlers };
        this.subs.set(key, entry);
      }

      entry.handlers.add(handler);

      unsubs.push(() => {
        entry?.handlers.delete(handler);
        if (entry && entry.handlers.size === 0) {
          entry.sub.close();
          this.subs.delete(key);
        }
      });
    }

    return {
      close: () => unsubs.forEach((fn) => fn()),
    };
  }
}

const registry = new SubRegistry();

export function register(filters: Filter[], handler: Handler) {
  return registry.register(filters, handler);
}

export default registry;

