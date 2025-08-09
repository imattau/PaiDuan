// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LightningCard from '../LightningCard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { status: 'ready', pubkey: 'pk', signer: { signEvent: vi.fn(async (e: any) => e) } },
  }),
}));

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({ wallets: [] }),
}));

const publishMock = vi.fn();
vi.mock('@/lib/nostr', () => ({
  getPool: () => ({ publish: publishMock }),
  getRelays: () => [],
}));

const fetchPayDataMock = vi.fn();
vi.mock('@/utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
}));

describe('LightningCard', () => {
  beforeEach(() => {
    fetchPayDataMock.mockReset();
    publishMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('adds wallet and saves', async () => {
    fetchPayDataMock.mockResolvedValue({});
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('Label'), {
      target: { value: 'Main' },
    });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    await waitFor(() => expect(fetchPayDataMock).toHaveBeenCalledWith('user@example.com'));
    await waitFor(() => expect(publishMock).toHaveBeenCalled());
  });

  it('shows error for invalid wallet', async () => {
    fetchPayDataMock.mockRejectedValue(new Error('bad'));
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('Label'), {
      target: { value: 'Main' },
    });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'bad' },
    });
    fireEvent.click(screen.getByText('Save'));
    await screen.findByText('bad');
    expect(publishMock).not.toHaveBeenCalled();
  });
});

