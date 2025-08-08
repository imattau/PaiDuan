/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { act } from 'react';
import { CreateVideoForm } from './CreateVideoForm';
import { trimVideoWebCodecs } from '../../utils/trimVideoWebCodecs';

(globalThis as any).React = React;

vi.mock('../../utils/trimVideoWebCodecs', () => ({
  trimVideoWebCodecs: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pub', signer: { signEvent: vi.fn((e:any) => e) } } }),
}));

vi.mock('../../hooks/useProfile', () => ({ useProfile: () => ({}) }));

vi.mock('../../lib/nostr', () => ({ getRelays: () => [] }));

vi.mock('nostr-tools/pool', () => ({
  SimplePool: vi.fn(() => ({ publish: vi.fn() })),
}));

describe('CreateVideoForm', () => {
  afterEach(() => cleanup());
  it('starts conversion on file select and keeps publish disabled until ready', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');

    let progressCb: (p: number) => void = () => {};
    let resolveConversion: (b: Blob) => void = () => {};
    const trimMock = vi.mocked(trimVideoWebCodecs);
    trimMock.mockImplementation(
      (_f: File, _s: number, _e: number | undefined, onProgress: (p: number) => void) => {
        progressCb = onProgress;
        return new Promise<Blob>((res) => {
          resolveConversion = res;
        });
      },
    );

    const { container, getByTestId, getByLabelText, getByPlaceholderText } = render(
      <CreateVideoForm onCancel={() => {}} />,
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
    });

    expect(trimMock).toHaveBeenCalledWith(file, 0, undefined, expect.any(Function));

    await act(async () => {
      progressCb(0.5);
    });
    expect(container.querySelector('.bg-blue-500')).toBeTruthy();
    const publishButton = getByTestId('publish-button') as HTMLButtonElement;
    expect(publishButton.disabled).toBe(true);

    await act(async () => {
      progressCb(1);
      resolveConversion(new Blob());
    });

    await waitFor(() => expect(container.querySelector('.bg-blue-500')).toBeNull());
    expect(publishButton.disabled).toBe(true);

    fireEvent.change(getByPlaceholderText('Caption'), { target: { value: 'cap' } });
    fireEvent.change(getByPlaceholderText('Topic tags (comma separated)'), {
      target: { value: 'topic' },
    });
    fireEvent.change(getByLabelText('Lightning address'), { target: { value: 'alice@ln' } });
    fireEvent.change(getByPlaceholderText('Copyright information'), { target: { value: 'c' } });

    await waitFor(() => expect(publishButton.disabled).toBe(false));
  });

  it('publishes video when enabled', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');

    vi.mocked(trimVideoWebCodecs).mockResolvedValueOnce(new Blob());

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }),
      }),
    ) as any;
    (globalThis as any).fetch = fetchMock;
    (globalThis as any).alert = vi.fn();

    const { container, getByTestId, getByLabelText, getByPlaceholderText } = render(
      <CreateVideoForm onCancel={() => {}} />,
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['dummy'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
    });

    fireEvent.change(getByPlaceholderText('Caption'), { target: { value: 'cap' } });
    fireEvent.change(getByPlaceholderText('Topic tags (comma separated)'), {
      target: { value: 'topic' },
    });
    fireEvent.change(getByLabelText('Lightning address'), { target: { value: 'alice@ln' } });
    fireEvent.change(getByPlaceholderText('Copyright information'), { target: { value: 'c' } });

    const publishButton = getByTestId('publish-button') as HTMLButtonElement;
    await waitFor(() => expect(publishButton.disabled).toBe(false));
    fireEvent.click(publishButton);

    expect(fetchMock).toHaveBeenCalledWith('https://nostr.media/api/upload', expect.any(Object));
  });
});

