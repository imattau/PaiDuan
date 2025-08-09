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
  useProfile: () => ({}),
}));

vi.mock('@/lib/nostr', () => ({
  getPool: () => ({ publish: vi.fn() }),
  getRelays: () => [],
}));

const fetchPayDataMock = vi.fn();
const requestInvoiceMock = vi.fn();

vi.mock('@/utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
  requestInvoice: (...args: any[]) => requestInvoiceMock(...args),
}));

describe('LightningCard', () => {
  beforeEach(() => {
    fetchPayDataMock.mockReset();
    requestInvoiceMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('enables save after successful test zap', async () => {
    fetchPayDataMock.mockResolvedValue({ callback: 'https://cb' });
    requestInvoiceMock.mockResolvedValue({ invoice: 'inv', result: {} });
    render(<LightningCard />);
    const input = screen.getByPlaceholderText('name@example.com');
    fireEvent.change(input, { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByText('Send test zap'));
    await waitFor(() => expect(requestInvoiceMock).toHaveBeenCalled());
    const saveBtn = screen.getByText('Save') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
    fireEvent.click(saveBtn);
    await waitFor(() => expect(fetchPayDataMock).toHaveBeenCalledTimes(2));
  });

  it('shows error for invalid address', async () => {
    fetchPayDataMock.mockRejectedValue(new Error('bad'));
    render(<LightningCard />);
    const input = screen.getByPlaceholderText('name@example.com');
    fireEvent.change(input, { target: { value: 'badaddress' } });
    fireEvent.click(screen.getByText('Send test zap'));
    await screen.findByText('bad');
    expect(requestInvoiceMock).not.toHaveBeenCalled();
    expect((screen.getByText('Save') as HTMLButtonElement).disabled).toBe(true);
  });

  it('handles failed LNURL request', async () => {
    fetchPayDataMock.mockResolvedValue({ callback: 'https://cb' });
    requestInvoiceMock.mockRejectedValue(new Error('fail'));
    render(<LightningCard />);
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Send test zap'));
    await screen.findByText('fail');
    expect((screen.getByText('Save') as HTMLButtonElement).disabled).toBe(true);
  });
});
