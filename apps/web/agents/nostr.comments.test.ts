import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import type { EventTemplate } from 'nostr-tools/pure';
import type { Signer } from '@/lib/signers/types';
import { subscribe, sendComment } from './nostr.comments';
import pool from '@/lib/relayPool';

vi.mock('@/lib/nostr', () => ({ getRelays: () => ['wss://example.com'] }));

const close = vi.fn();
let handlers: any;

vi.mock('@/lib/relayPool', () => ({
  default: {
    subscribeMany: vi.fn((_relays: any, _filters: any, h: any) => {
      handlers = h;
      return { close };
    }),
    publish: vi.fn(async () => {}),
  },
}));

describe('nostr.comments', () => {
  it('adds since and limit to filter and closes on eose', () => {
    subscribe('video123', vi.fn());
    const filters = (pool.subscribeMany as any).mock.calls[0][1];
    expect(filters[0]).toMatchObject({ since: expect.any(Number), limit: expect.any(Number) });
    handlers.oneose();
    expect(close).toHaveBeenCalled();
  });

  it('constructs typed event template when sending comment', async () => {
    const signer: Signer = {
      type: 'local',
      getPublicKey: vi.fn().mockResolvedValue('pub'),
      signEvent: vi.fn(async (evt: any) => ({ ...evt, id: 'id', sig: 'sig', pubkey: evt.pubkey || 'pub' })),
    };
    await sendComment('video123', 'hello', signer);
    const arg = (signer.signEvent as any).mock.calls[0][0];
    expectTypeOf(arg).toMatchTypeOf<EventTemplate & { pubkey: string }>();
  });
});
