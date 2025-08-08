/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { CreateVideoForm } from './CreateVideoForm';

(globalThis as any).React = React;

vi.mock('../../utils/trimVideoWebCodecs', () => ({
  trimVideoWebCodecs: vi.fn(() => Promise.resolve(new Blob()))
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pub', signer: { signEvent: vi.fn() } } })
}));

vi.mock('../../hooks/useProfile', () => ({ useProfile: () => ({}) }));

vi.mock('../../lib/nostr', () => ({ getRelays: () => [] }));

describe('CreateVideoForm', () => {
  it('enables posting after selecting a file', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(<CreateVideoForm onCancel={() => {}} />);
    });

    const postButton = container.querySelector('[data-testid="post-button"]') as HTMLButtonElement;
    expect(postButton.disabled).toBe(true);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => {
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await Promise.resolve();
    });

    expect(postButton.disabled).toBe(false);
  });
});
