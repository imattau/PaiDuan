import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';
import useFollowing from './useFollowing';
import { useFollowingStore } from '@/store/following';

const { subscribeMany, close } = vi.hoisted(() => {
  const close = vi.fn();
  const subscribeMany = vi.fn((_relays: any, _filters: any, opts: any) => {
    setTimeout(() => {
      opts.onevent({ tags: [['p', 'pk1'], ['p', 'pk2']] });
      opts.oneose && opts.oneose();
    }, 0);
    return { close };
  });
  return { subscribeMany, close };
});

vi.mock('@/lib/relayPool', () => ({
  default: {
    subscribeMany,
  },
}));
vi.mock('@/lib/nostr', () => ({ getRelays: () => ['wss://example.com'] }));

vi.mock('./useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'me' } }),
}));

// setup jsdom
const dom = new JSDOM('<!doctype html><html><body></body></html>');
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;

function TestComponent() {
  useFollowing();
  return null;
}

describe('useFollowing', () => {
  beforeEach(() => {
    useFollowingStore.setState({ following: [] });
    subscribeMany.mockClear();
    close.mockClear();
  });

  it('syncs contacts from relays', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<TestComponent />);
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(useFollowingStore.getState().following).toEqual(['pk1', 'pk2']);
    expect(useFollowingStore.getState().following.length).toBe(2);
    root.unmount();
  });

  it('avoids duplicate subscriptions for the same pubkey', async () => {
    const c1 = document.createElement('div');
    const c2 = document.createElement('div');
    const r1 = createRoot(c1);
    const r2 = createRoot(c2);
    await act(async () => {
      r1.render(<TestComponent />);
      r2.render(<TestComponent />);
    });
    await new Promise((r) => setTimeout(r, 0));
    expect(subscribeMany).toHaveBeenCalledTimes(1);
    r1.unmount();
    r2.unmount();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
