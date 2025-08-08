/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { UploadStep } from './UploadStep';

(globalThis as any).React = React;

vi.mock('@/utils/trimVideoWebCodecs', () => ({
  trimVideoWebCodecs: vi.fn(() => Promise.resolve(new Blob()))
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pub', signer: { signEvent: vi.fn() } } })
}));

vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({}) }));

vi.mock('@/lib/nostr', () => ({ getRelays: () => [] }));

describe('UploadStep', () => {
  it('shows metadata inline on large screens after processing', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<UploadStep onBack={() => {}} onCancel={() => {}} forceIsLarge />);
    });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const button = container.querySelector('button.btn-primary') as HTMLButtonElement;
    await act(async () => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Post Video');
  });
});
