/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfileCard from '../ProfileCard';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    state: { status: 'ready', pubkey: 'pk', signer: { signEvent: vi.fn(async (e: any) => e) } },
  }),
}));

let profileMock: any = { name: 'Alice' };
vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => profileMock,
}));

var publishMock: any;
vi.mock('@/lib/relayPool', () => {
  publishMock = vi.fn(() => Promise.resolve());
  return { default: { publish: (...args: any[]) => publishMock(...args) } };
});
vi.mock('@/lib/nostr', () => ({ getRelays: () => [] }));

vi.mock('../../ui/AvatarCropper', () => ({
  __esModule: true,
  default: ({ onComplete }: any) => (
    <div data-testid="avatar-cropper">
      <button onClick={() => onComplete('data:image/png;base64,cropped')}>finish</button>
    </div>
  ),
}));

describe('ProfileCard', () => {
  beforeEach(() => {
    profileMock = { name: 'Alice' };
    publishMock.mockReset();
  });

  it('opens cropper and saves cropped image', async () => {
    class FileReaderMock {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReaderMock, ev: any) => any) | null = null;
      readAsDataURL(_file: any) {
        this.result = 'raw';
        if (this.onload) this.onload({ target: { result: this.result } });
      }
    }
    (global as any).FileReader = FileReaderMock as any;

    render(<ProfileCard />);

    const fileInput = screen.getByLabelText('profile picture');
    const file = new File(['img'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await screen.findByTestId('avatar-cropper');
    fireEvent.click(screen.getByText('finish'));

    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);
    await waitFor(() => expect(publishMock).toHaveBeenCalled());
    const event = publishMock.mock.calls[0][1];
    expect(event.content).toContain('data:image/png;base64,cropped');
  });
});

