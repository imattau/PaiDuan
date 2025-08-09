/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CreateVideoForm from './CreateVideoForm';
import { __clearProfileCache } from '../../hooks/useProfiles';
const following = ['pk1', 'pk2'];
let onEvent: ((ev: any) => void) | null = null;
const subscribeMany = vi.fn((relays: any, filters: any, opts: any) => {
  onEvent = opts.onevent;
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
    __clearProfileCache();
    subscribeMany.mockClear();
    onEvent = null;
  });

  it('subscribes once and populates lnaddr datalist', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<CreateVideoForm />);
    });
    await Promise.resolve();
    expect(subscribeMany).toHaveBeenCalledTimes(1);
    expect(subscribeMany.mock.calls[0][1][0].authors).toEqual(following);
    act(() => {
      onEvent?.({ pubkey: 'pk1', content: JSON.stringify({ lud16: 'alice@test' }) });
      onEvent?.({ pubkey: 'pk2', content: JSON.stringify({ lud16: 'bob@test' }) });
    });
    await Promise.resolve();
    const opts = container.querySelectorAll('#lnaddr-options option');
    const values = Array.from(opts).map((o) => o.getAttribute('value'));
    expect(values).toEqual(expect.arrayContaining(['alice@test', 'bob@test']));
  });
});
