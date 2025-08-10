import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as nostrKinds from 'nostr-tools/kinds';
vi.mock('@/lib/db', () => ({ getEventsByPubkey: vi.fn(), saveEvent: vi.fn() }));
vi.mock('@/lib/relayPool', () => ({ default: { subscribeMany: vi.fn() } }));
vi.mock('@/lib/nostr', () => ({ getRelays: () => [] }));

import { prefetchProfile } from './useProfiles';
import { queryClient } from '@/lib/queryClient';
import relayPool from '@/lib/relayPool';
import { getEventsByPubkey } from '@/lib/db';

const subscribeMany = relayPool.subscribeMany as any;

describe('fetchProfile', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.clearAllMocks();
  });

  it('returns lud16 and wallets when cached event has only lud16', async () => {
    getEventsByPubkey.mockResolvedValueOnce([
      { kind: nostrKinds.Metadata, content: JSON.stringify({ lud16: 'alice@test' }) },
    ]);

    await prefetchProfile('pk1');
    const data: any = queryClient.getQueryData(['profile', 'pk1']);
    expect(data?.lud16).toBe('alice@test');
    expect(data?.wallets).toEqual([
      { label: 'Default', lnaddr: 'alice@test', default: true },
    ]);
    expect(subscribeMany).not.toHaveBeenCalled();
  });

  it('sets lud16 from default wallet when missing', async () => {
    getEventsByPubkey.mockResolvedValueOnce([
      {
        kind: nostrKinds.Metadata,
        content: JSON.stringify({ wallets: [{ label: 'Main', lnaddr: 'bob@test', default: true }] }),
      },
    ]);

    await prefetchProfile('pk2');
    const data: any = queryClient.getQueryData(['profile', 'pk2']);
    expect(data?.lud16).toBe('bob@test');
    expect(data?.wallets).toEqual([
      { label: 'Main', lnaddr: 'bob@test', default: true },
    ]);
    expect(subscribeMany).not.toHaveBeenCalled();
  });
});
