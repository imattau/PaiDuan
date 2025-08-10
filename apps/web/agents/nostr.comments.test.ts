import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import type { EventTemplate } from 'nostr-tools/pure';
import type { Signer } from '@/lib/signers/types';
import { subscribe, sendComment } from './nostr.comments';
import pool from '@/lib/relayPool';
import { getCommentsByVideoId, saveComment } from '@/lib/db';

vi.mock('@/lib/nostr', () => ({ getRelays: () => ['wss://example.com'] }));
vi.mock('@/lib/db', () => ({
  getCommentsByVideoId: vi.fn().mockResolvedValue([]),
  saveComment: vi.fn(),
}));

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
      signEvent: vi.fn(async (evt: any) => ({
        ...evt,
        id: 'id',
        sig: 'sig',
        pubkey: evt.pubkey || 'pub',
      })),
    };
    await sendComment('video123', 'hello', signer);
    const arg = (signer.signEvent as any).mock.calls[0][0];
    expectTypeOf(arg).toMatchTypeOf<EventTemplate & { pubkey: string }>();
  });

  it('reads cache before subscribing and saves incoming events', async () => {
    const cached: any = {
      id: 'cached',
      pubkey: 'pub',
      created_at: 1,
      kind: 1,
      tags: [],
      content: 'hello',
    };
    (getCommentsByVideoId as any).mockResolvedValueOnce([cached]);
    const onEvent = vi.fn();
    subscribe('video123', onEvent);
    await new Promise((r) => setTimeout(r, 0));
    expect(onEvent).toHaveBeenCalled();
    expect(onEvent.mock.calls[0][0]).toEqual(cached);
    handlers.onevent(cached);
    expect(saveComment).toHaveBeenCalledWith('video123', cached);
  });
});
