/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CreateVideoForm from './CreateVideoForm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';
import { NextIntlClientProvider } from 'next-intl';
import common from '../../locales/en/common.json';
import create from '../../locales/en/create.json';

(globalThis as any).React = React;

const mockTrim = vi.fn();
vi.mock('../../utils/trimVideoWebCodecs', () => ({
  trimVideoWebCodecs: (...args: any[]) => mockTrim(...(args as any)),
}));

const mockSignEvent = vi.fn(() => Promise.resolve({}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    state: { status: 'ready', pubkey: 'pub', signer: { signEvent: mockSignEvent } },
  }),
}));

let profileMock: any = {};
vi.mock('../../hooks/useProfile', () => ({ useProfile: () => profileMock }));
vi.mock('../../hooks/useFollowing', () => ({ default: () => ({ following: [] }) }));
vi.mock('../../lib/nostr', () => ({ getRelays: () => [] }));

const mockPublish = vi.hoisted(() => vi.fn());
vi.mock('../../lib/relayPool', () => ({ default: { publish: mockPublish } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));
const mockToast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('react-hot-toast', () => ({ toast: mockToast }));
let origCreateElement: any;

const messages = { common, create };
const renderForm = (root: any) => {
  root.render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <QueryClientProvider client={queryClient}>
        <CreateVideoForm />
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
};

describe('CreateVideoForm', () => {
  beforeEach(() => {
    mockTrim.mockReset();
    mockSignEvent.mockReset();
    mockPublish.mockReset();
    mockToast.success.mockReset();
    mockToast.error.mockReset();
    (URL as any).revokeObjectURL = vi.fn();
    (HTMLMediaElement.prototype as any).load = vi.fn();
    (HTMLMediaElement.prototype as any).play = vi.fn(() => Promise.resolve());
    (globalThis as any).fetch = undefined;

    (document.createElement as any).mockRestore?.();
    origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: any, opts?: any) => {
      const el = origCreateElement(tag, opts) as any;
      if (tag === 'video') {
        Object.defineProperty(el, 'videoWidth', { configurable: true, value: 540 });
        Object.defineProperty(el, 'videoHeight', { configurable: true, value: 960 });
        Object.defineProperty(el, 'duration', { configurable: true, value: 10 });
        setTimeout(() => el.onloadedmetadata?.(new Event('loadedmetadata')));
      }
      return el;
    });
    profileMock = {};
    queryClient.clear();
    delete process.env.NEXT_PUBLIC_UPLOAD_URL;
  });

  it('prefills lightning address from profile', async () => {
    profileMock = { lud16: 'user@example.com' };
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });
    await Promise.resolve();
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    expect(lightningInput.value).toBe('user@example.com');
  });

  it('starts with empty lightning address when profile missing data', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });
    await Promise.resolve();
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    expect(lightningInput.value).toBe('');
  });

  it('auto trims selected file and keeps publish disabled until form complete', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation((_f: any, opts: any, onProgress: any) => {
      onProgress?.(0.5);
      onProgress?.(1);
      return Promise.resolve(new Blob());
    });

    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const publishButton = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    expect(mockTrim).toHaveBeenCalledWith(file, { start: 0, end: 10 }, expect.any(Function));
    expect(container.querySelector('.bg-blue-500')).not.toBeNull();
    expect(publishButton.disabled).toBe(true);

    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto?.set?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      setValue(topicsInput, 'topic');
      setValue(lightningInput, 'addr');
    });
    await Promise.resolve();
    const publishButtonAfter = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;
    expect(publishButtonAfter.disabled).toBe(false);
  });

  it('caps trimming at five minutes', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (document.createElement as any).mockImplementation((tag: any, opts?: any) => {
      const el = origCreateElement(tag, opts) as any;
      if (tag === 'video') {
        Object.defineProperty(el, 'videoWidth', { configurable: true, value: 540 });
        Object.defineProperty(el, 'videoHeight', { configurable: true, value: 960 });
        Object.defineProperty(el, 'duration', { configurable: true, value: 400 });
        setTimeout(() => el.onloadedmetadata?.(new Event('loadedmetadata')));
      }
      return el;
    });

    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    expect(mockTrim).toHaveBeenCalledWith(file, { start: 0, end: 300 }, expect.any(Function));
  });

  it('rejects landscape videos', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    (document.createElement as any).mockImplementation((tag: any, opts?: any) => {
      const el = origCreateElement(tag, opts) as any;
      if (tag === 'video') {
        Object.defineProperty(el, 'videoWidth', { configurable: true, value: 1920 });
        Object.defineProperty(el, 'videoHeight', { configurable: true, value: 1080 });
        Object.defineProperty(el, 'duration', { configurable: true, value: 10 });
        setTimeout(() => el.onloadedmetadata?.(new Event('loadedmetadata')));
      }
      return el;
    });

    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    expect(container.textContent).toContain('Video must be vertical');
    expect(mockTrim).not.toHaveBeenCalled();
  });

  it('prefills lightning address with lud16 when wallets empty', async () => {
    profileMock = { wallets: [], lud16: 'alice@test' };
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });
    await Promise.resolve();
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    expect(lightningInput.value).toBe('alice@test');
  });


  it('posts video when publish is clicked', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation((_f: any, opts: any, onProgress: any) => {
      onProgress?.(1);
      return Promise.resolve(new Blob());
    });

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }),
      }),
    );
    (globalThis as any).fetch = mockFetch;
    process.env.NEXT_PUBLIC_UPLOAD_URL = 'https://nostr.media/api/upload';

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    const publishButton = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;
    const licenseSelect = container.querySelector(
      '[data-testid="license-select"]',
    ) as HTMLSelectElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto?.set?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      setValue(topicsInput, 'topic');
      setValue(lightningInput, 'addr');
      licenseSelect.value = 'CC BY';
      licenseSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();
    const publishBtn = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;

    await act(async () => {
      publishBtn.click();
    });

    expect(mockFetch).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_UPLOAD_URL,
      expect.any(Object),
    );
    const tags = mockSignEvent.mock.calls[0][0].tags;
    expect(tags).toContainEqual(['zap', 'addr', '100']);
    expect(tags).toContainEqual(['copyright', 'CC BY']);
  });

  it('saves zap splits for collaborators', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation((_f: any, opts: any, onProgress: any) => {
      onProgress?.(1);
      return Promise.resolve(new Blob());
    });

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }),
      }),
    );
    (globalThis as any).fetch = mockFetch;

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    const addButton = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Add collaborator'),
    ) as HTMLButtonElement;

    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto?.set?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };

    await act(async () => {
      setValue(topicsInput, 'topic');
      setValue(lightningInput, 'addr');
      addButton.click();
    });

    const lnInput = container.querySelector('input[placeholder="ln@addr"]') as HTMLInputElement;
    const pctInput = container.querySelector('input[type="number"]') as HTMLInputElement;

    await act(async () => {
      setValue(lnInput, 'col@example.com');
      setValue(pctInput, '10');
    });

    const publishBtn = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;
    await act(async () => {
      publishBtn.click();
    });

    const body = mockFetch.mock.calls[0][1].body as FormData;
    expect(body.get('zapSplits')).toBe(JSON.stringify([{ lnaddr: 'col@example.com', pct: 10 }]));
    const tags = mockSignEvent.mock.calls[0][0].tags;
    expect(tags).toContainEqual(['zap', 'addr', '90']);
    expect(tags).toContainEqual(['zap', 'col@example.com', '10']);
  });

  it('uses custom license when Other is selected', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation((_f: any, opts: any) => {
      opts.onProgress?.(1);
      return Promise.resolve(new Blob());
    });

    const mockFetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }),
      }),
    );
    (globalThis as any).fetch = mockFetch;

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    const publishButton = container.querySelector(
      '[data-testid="publish-button"]',
    ) as HTMLButtonElement;
    const licenseSelect = container.querySelector(
      '[data-testid="license-select"]',
    ) as HTMLSelectElement;

    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      proto?.set?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const customInput = () =>
      container.querySelector('[data-testid="custom-license-input"]') as HTMLInputElement;
    await act(async () => {
      setValue(topicsInput, 'topic');
      setValue(lightningInput, 'addr');
      licenseSelect.value = 'other';
      licenseSelect.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => {
      setValue(customInput(), 'My License');
    });
    await Promise.resolve();

    await act(async () => {
      publishButton.click();
    });

    const tags = mockSignEvent.mock.calls[0][0].tags;
    expect(tags).toContainEqual(['copyright', 'My License']);
  });

  it('shows video preview and reopens file dialog when clicked', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation((_f: any, opts: any) => {
      opts.onProgress?.(1);
      return Promise.resolve(new Blob());
    });

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      renderForm(root);
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const dropzone = fileInput.parentElement as HTMLElement;
    const clickSpy = vi.spyOn(fileInput, 'click');

    await act(async () => {
      dropzone.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(clickSpy).toHaveBeenCalledTimes(1);

    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });
    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await Promise.resolve();

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeTruthy();
    expect(video.src).toContain('blob:mock');

    await act(async () => {
      dropzone.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
