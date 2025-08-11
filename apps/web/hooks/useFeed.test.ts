import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prefetchFeed, FEED_PAGE_LIMIT } from './useFeed';
import { queryClient } from '@/lib/queryClient';

const now = Math.floor(Date.now() / 1000);
const oldEvent = {
  id: 'old',
  pubkey: 'pk1',
  created_at: now - 8 * 24 * 60 * 60,
  kind: 21,
  tags: [
    ['imeta', 'url https://example.com/video.mp4', 'image https://example.com/poster.jpg'],
    ['t', 't1'],
    ['title', 'old'],
  ],
  content: '',
  sig: '',
};
const recentEvent = {
  id: 'new',
  pubkey: 'pk1',
  created_at: now - 60,
  kind: 21,
  tags: [
    ['imeta', 'url https://example.com/video.mp4', 'image https://example.com/poster.jpg'],
    ['t', 't1'],
    ['title', 'new'],
  ],
  content: '',
  sig: '',
};

const { subscribeMany } = vi.hoisted(() => {
  const subscribeMany = vi.fn((_relays: any, filters: any, opts: any) => {
    const filter = filters[0];
    [oldEvent, recentEvent].forEach((e) => {
      if (!filter.since || e.created_at >= filter.since) {
        opts.onevent(e);
      }
    });
    opts.oneose();
    return { close: vi.fn() };
  });
  return { subscribeMany };
});

vi.mock('@/lib/relayPool', () => ({
  default: { subscribeMany },
}));
vi.mock('@/lib/nostr', () => ({ getRelays: () => ['wss://example.com'] }));
vi.mock('@/lib/db', () => ({ saveEvent: vi.fn() }));

describe('useFeed since filter', () => {
  const limit = FEED_PAGE_LIMIT;
  beforeEach(() => {
    queryClient.clear();
    subscribeMany.mockClear();
  });

  it('excludes events older than seven days for the all feed', async () => {
    await prefetchFeed('all', [], limit);
    const data: any = queryClient.getQueryData(['feed', 'all', '', limit]);
    expect(data.pages[0].items).toHaveLength(1);
    expect(data.pages[0].items[0].eventId).toBe('new');
  });

  it('includes old events for following feed', async () => {
    await prefetchFeed('following', [], limit);
    const data: any = queryClient.getQueryData(['feed', 'following', '', limit]);
    expect(data.pages[0].items).toHaveLength(2);
  });

  it('includes old events for author feed', async () => {
    const mode = { author: 'pk1' };
    await prefetchFeed(mode, [], limit);
    const data: any = queryClient.getQueryData(['feed', mode, '', limit]);
    expect(data.pages[0].items).toHaveLength(2);
  });

  it('includes old events for tag feed', async () => {
    const mode = { tag: 't1' };
    await prefetchFeed(mode, [], limit);
    const data: any = queryClient.getQueryData(['feed', mode, '', limit]);
    expect(data.pages[0].items).toHaveLength(2);
  });
});

