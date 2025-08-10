import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { JSDOM } from 'jsdom';

vi.mock('@/lib/relayPool', () => ({
  default: {
    subscribeMany: vi.fn((_relays: any, _filters: any, opts: any) => {
      setTimeout(() => {
        opts.onevent({ pubkey: 'pk1' });
        opts.onevent({ pubkey: 'pk2' });
        setTimeout(() => opts.oneose && opts.oneose(), 0);
      }, 5);
      return { close: vi.fn() };
    }),
  },
}));
vi.mock('@/lib/nostr', () => ({ getRelays: () => ['wss://example.com'] }));

import useFollowerCount from './useFollowerCount';
import pool from '@/lib/relayPool';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.com',
});
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;

function TestComponent() {
  const count = useFollowerCount('me');
  return <div data-count={count}></div>;
}

function SwitchTestComponent({ pubkey }: { pubkey: string }) {
  const count = useFollowerCount(pubkey);
  return <div data-count={count}></div>;
}

describe('useFollowerCount', () => {
  const subscribeMany = vi.mocked(pool.subscribeMany);

  beforeEach(() => {
    window.localStorage.clear();
    subscribeMany.mockClear();
  });

  it('caches follower count and avoids repeat subscriptions', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<TestComponent />);
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(subscribeMany).toHaveBeenCalledTimes(1);
    expect(container.querySelector('div')?.getAttribute('data-count')).toBe('2');
    root.unmount();

    const container2 = document.createElement('div');
    const root2 = createRoot(container2);
    await act(async () => {
      root2.render(<TestComponent />);
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(subscribeMany).toHaveBeenCalledTimes(1);
    expect(container2.querySelector('div')?.getAttribute('data-count')).toBe('2');
  });

  it('resets count and closes previous subscription on pubkey change', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<SwitchTestComponent pubkey="me" />);
    });
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('div')?.getAttribute('data-count')).toBe('2');
    const firstClose = subscribeMany.mock.results[0].value.close;

    await act(async () => {
      root.render(<SwitchTestComponent pubkey="you" />);
    });
    expect(container.querySelector('div')?.getAttribute('data-count')).toBe('0');
    await new Promise((r) => setTimeout(r, 10));
    expect(container.querySelector('div')?.getAttribute('data-count')).toBe('2');
    expect(firstClose).toHaveBeenCalled();

    root.unmount();
    const secondClose = subscribeMany.mock.results[1].value.close;
    expect(secondClose).toHaveBeenCalled();
  });
});
