// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LightningHistory from '../LightningHistory';

vi.mock('@/lib/nostr', () => ({
  getRelays: () => [],
}));

const subscribeManyMock = vi.hoisted(() => vi.fn());
let onEvent: any;

vi.mock('@/hooks/pool', () => ({
  default: {
    subscribeMany: (...args: any[]) => subscribeManyMock(...args),
  },
}));

describe('LightningHistory', () => {
  beforeEach(() => {
    subscribeManyMock.mockReset();
    subscribeManyMock.mockImplementation((_relays: any, _filters: any, opts: any) => {
      onEvent = opts.onevent;
      return { close: vi.fn() };
    });
    (window as any).nostr = { getPublicKey: async () => 'pk' };
  });

  it('renders zap events in order and updates totals', async () => {
    render(<LightningHistory />);
    await waitFor(() => expect(subscribeManyMock).toHaveBeenCalled());

    act(() => {
      onEvent({ id: '1', pubkey: 'alice', tags: [['amount', '1000']], created_at: 1 });
      onEvent({ id: '2', pubkey: 'bob', tags: [['amount', '2000']], created_at: 2 });
    });

    const items = await screen.findAllByRole('listitem');
    expect(items[0].textContent).toContain('2 sats');
    expect(items[1].textContent).toContain('1 sats');
    expect(screen.getByTestId('total-amount').textContent).toContain('3');
    expect(screen.getByTestId('total-count').textContent).toContain('2');

    act(() => {
      onEvent({ id: '3', pubkey: 'carol', tags: [['amount', '3000']], created_at: 3 });
    });

    const items2 = await screen.findAllByRole('listitem');
    expect(items2[0].textContent).toContain('3 sats');
    expect(screen.getByTestId('total-amount').textContent).toContain('6');
    expect(screen.getByTestId('total-count').textContent).toContain('3');
  });
});
