import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('nostr-tools/pool', () => {
  class SimplePoolMock {
    relays = new Map<string, any>();
    ensureRelay(url: string) {
      let relay = this.relays.get(url);
      if (!relay) {
        relay = {
          rawSend: vi.fn(async () => {}),
          send(message: string) {
            return this.rawSend(message);
          },
          prepareSubscription: vi.fn(() => ({
            fire: () => relay.send('REQ'),
            close: vi.fn(),
          })),
          subscribe(this: any, filters: any[], params?: any) {
            const sub = this.prepareSubscription(filters, params);
            sub.fire();
            return sub;
          },
        };
        this.relays.set(url, relay);
      }
      return relay;
    }
    close() {}
    subscribeMany(relays: string[], filters: any[], params?: any) {
      relays.forEach((url) => {
        this.ensureRelay(url).then((relay) => {
          filters.forEach((f) => relay.subscribe([f], params));
        });
      });
      return { close: vi.fn() } as any;
    }
  }
  return { SimplePool: SimplePoolMock };
});

import { RelayPool } from '@/lib/relayPool';

const info = {
  supported_nips: [1],
  limitation: { max_message_rate: 1, max_subscriptions: 1 },
};

beforeEach(() => {
  vi.resetAllMocks();
  // @ts-ignore
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => info }));
});

describe('RelayPool', () => {
  it('fetches nip11 info only once', async () => {
    const pool = new RelayPool();
    await pool.ensureRelay('wss://relay.example');
    await pool.ensureRelay('wss://relay.example');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('enforces max subscriptions', async () => {
    const pool = new RelayPool();
    const relay: any = await pool.ensureRelay('wss://relay.example');
    const sub1 = relay.prepareSubscription([], {});
    sub1.fire();
    await Promise.resolve();
    const sub2 = relay.prepareSubscription([], {});
    sub2.fire();
    await Promise.resolve();
    expect(relay.rawSend).toHaveBeenCalledTimes(1);
  });

  it('throttles messages by rate limit', async () => {
    vi.useFakeTimers();
    const pool = new RelayPool();
    const relay: any = await pool.ensureRelay('wss://relay.example');
    const p1 = relay.send('one');
    await p1;
    expect(relay.rawSend).toHaveBeenCalledTimes(1);
    const p2 = relay.send('two');
    expect(relay.rawSend).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    await p2;
    expect(relay.rawSend).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
