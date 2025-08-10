// @vitest-environment jsdom
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import QRCode from 'qrcode';
import LightningCard from '../LightningCard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { status: 'ready', pubkey: 'pk', signer: { signEvent: vi.fn(async (e: any) => e) } },
  }),
}));

let profileMock: any = { wallets: [] };
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => profileMock,
}));

var publishMock: any;
vi.mock('@/lib/relayPool', () => {
  publishMock = vi.fn();
  return { default: { publish: (...args: any[]) => publishMock(...args) } };
});
vi.mock('@/lib/nostr', () => ({ getRelays: () => [] }));

const fetchPayDataMock = vi.fn();
const authenticateMock = vi.fn();
vi.mock('@/utils/lnurl', () => ({
  fetchPayData: (...args: any[]) => fetchPayDataMock(...args),
  authenticate: (...args: any[]) => authenticateMock(...args),
}));

const writeTextMock = vi.fn();
Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

describe('LightningCard', () => {
  beforeEach(() => {
    fetchPayDataMock.mockReset();
    publishMock.mockReset();
    writeTextMock.mockReset();
    (QRCode.toDataURL as any).mockReset();
    (QRCode.toDataURL as any).mockResolvedValue('data:image/png;base64,qr');
    profileMock = { wallets: [] };
  });

  afterEach(() => {
    cleanup();
  });

  it('initializes wallet input from profile lud16', async () => {
    profileMock = { lud16: 'user@example.com' };
    render(<LightningCard />);
    expect(await screen.findByDisplayValue('user@example.com')).toBeTruthy();
  });

  it('starts with empty wallet input when profile has none', async () => {
    profileMock = {};
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    const addrInput = screen.getByPlaceholderText('name@example.com') as HTMLInputElement;
    expect(addrInput.value).toBe('');
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
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('Label'), {
      target: { value: 'Main' },
    });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByText('Copy'));
    await waitFor(() => expect(writeTextMock).toHaveBeenCalledWith('user@example.com'));
  });

  it('renders QR code when address present', async () => {
    render(<LightningCard />);
    fireEvent.click(screen.getByText('Add wallet'));
    fireEvent.change(screen.getByPlaceholderText('Label'), {
      target: { value: 'Main' },
    });
    fireEvent.change(screen.getByPlaceholderText('name@example.com'), {
      target: { value: 'user@example.com' },
    });
    await waitFor(() => expect(QRCode.toDataURL).toHaveBeenCalledWith('user@example.com'));
    await screen.findByAltText('Lightning address QR code');
  });
});

