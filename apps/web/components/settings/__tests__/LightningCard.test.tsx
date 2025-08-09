// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
vi.mock(
  'qrcode',
  () => ({
    default: {
      toDataURL: vi.fn(() => Promise.resolve('data:qr')),
    },
  }),
  { virtual: true },
);
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
const authenticateMock = vi.fn();
vi.mock('@/utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
  authenticate: (...args: any[]) => authenticateMock(...args),
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

  it('copies address to clipboard', async () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Copy'));
    expect(writeText).toHaveBeenCalledWith('user@example.com');
  });

  it('renders QR code when address present', async () => {
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    const img = await screen.findByAltText('Lightning address QR code');
    expect(img).toBeInTheDocument();
  });
});

