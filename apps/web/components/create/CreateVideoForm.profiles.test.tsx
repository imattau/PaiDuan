/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CreateVideoForm from './CreateVideoForm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
const following = ['pk1', 'pk2'];
let onEvents: ((ev: any) => void)[] = [];
const subscribeMany = vi.fn((relays: any, filters: any, opts: any) => {
  onEvents.push(opts.onevent);
  return { close: vi.fn() };
});
(globalThis as any).React = React;

describe('CreateVideoForm profiles', () => {

  vi.mock('../../hooks/useAuth', () => ({
    useAuth: () => ({ state: { status: 'signedOut' } }),
  }));
  vi.mock('../../hooks/useFollowing', () => ({
    default: () => ({ following }),
  }));
  vi.mock('../../lib/nostr', () => ({
    getPool: () => ({ subscribeMany }),
    getRelays: () => [],
  }));
  vi.mock('next/navigation', () => ({
    useRouter: () => ({ back: vi.fn() }),
  }));

  beforeEach(() => {
    queryClient.clear();
    subscribeMany.mockClear();
    onEvents = [];
  });

  it('subscribes once and populates lnaddr datalist', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
    });
    await Promise.resolve();
    expect(subscribeMany).toHaveBeenCalledTimes(following.length);
    act(() => {
      onEvents[0]?.({ pubkey: 'pk1', content: JSON.stringify({ lud16: 'alice@test' }) });
      onEvents[1]?.({ pubkey: 'pk2', content: JSON.stringify({ lud16: 'bob@test' }) });
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    const opts = container.querySelectorAll('#lnaddr-options option');
    const values = Array.from(opts).map((o) => o.getAttribute('value'));
    expect(values).toEqual(expect.arrayContaining(['alice@test', 'bob@test']));
  });
});
