/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import CreateVideoForm from './CreateVideoForm';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../../lib/queryClient';

(globalThis as any).React = React;

class MockWorker {
  onmessage: ((ev: any) => void) | null = null;
  constructor(private messages: any[]) {
    setTimeout(() => {
      for (const m of this.messages) {
        this.onmessage?.({ data: m });
      }
    }, 0);
  }
  postMessage() {}
  terminate() {}
}

const mockTrim = vi.fn();
vi.mock('../../utils/trimVideoWebCodecs', () => ({
  trimVideoWebCodecs: (...args: any[]) => mockTrim(...(args as any)),
}));

const mockSignEvent = vi.fn(() => Promise.resolve({}));
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ state: { status: 'ready', pubkey: 'pub', signer: { signEvent: mockSignEvent } } }),
}));

vi.mock('../../hooks/useProfile', () => ({ useProfile: () => ({}) }));
vi.mock('../../hooks/useFollowing', () => ({ default: () => ({ following: [] }) }));
vi.mock('../../lib/nostr', () => ({ getRelays: () => [] }));

const mockPublish = vi.fn();
vi.mock('../../lib/relayPool', () => ({ default: { publish: mockPublish } }));

vi.mock('next/navigation', () => ({ useRouter: () => ({ back: vi.fn() }) }));

describe('CreateVideoForm', () => {
  beforeEach(() => {
    mockTrim.mockReset();
    mockSignEvent.mockReset();
    mockPublish.mockReset();
    (URL as any).revokeObjectURL = vi.fn();
    (HTMLMediaElement.prototype as any).load = vi.fn();
    (HTMLMediaElement.prototype as any).play = vi.fn(() => Promise.resolve());
    (globalThis as any).fetch = undefined;

    (document.createElement as any).mockRestore?.();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: any, opts?: any) => {
      const el = origCreateElement(tag, opts) as any;
      if (tag === 'video') {
        Object.defineProperty(el, 'videoWidth', { configurable: true, value: 640 });
        Object.defineProperty(el, 'videoHeight', { configurable: true, value: 480 });
        setTimeout(() => el.onloadedmetadata?.(new Event('loadedmetadata')));
      }
      return el;
    });
    queryClient.clear();
  });

  it('auto converts selected file and keeps publish disabled until form complete', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation(() => new MockWorker([
      { type: 'progress', progress: 0.5 },
      { type: 'done', blob: new Blob() },
    ]));

    const container = document.createElement('div');
    const root = createRoot(container);
    act(() => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const publishButton = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r));
    await new Promise((r) => setTimeout(r));

    expect(mockTrim).toHaveBeenCalledWith(file, {
      start: 0,
      width: 640,
      height: 480,
    });
    expect(container.querySelector('.bg-blue-500')).not.toBeNull();
    expect(publishButton.disabled).toBe(true);

    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      );
      proto?.set?.call(el, value);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    await act(async () => {
      setValue(topicsInput, 'topic');
      setValue(lightningInput, 'addr');
    });
    await Promise.resolve();
    const publishButtonAfter = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;
    expect(publishButtonAfter.disabled).toBe(false);
  });

  it('posts video when publish is clicked', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation(() => new MockWorker([
      { type: 'progress', progress: 1 },
      { type: 'done', blob: new Blob() },
    ]));

    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }) }),
    );
    (globalThis as any).fetch = mockFetch;
    (globalThis as any).alert = vi.fn();

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    const publishButton = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;
    const licenseSelect = container.querySelector('[data-testid="license-select"]') as HTMLSelectElement;
    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r));
    await new Promise((r) => setTimeout(r));

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      );
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
    const publishBtn = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;

    await act(async () => {
      publishBtn.click();
    });

    expect(mockFetch).toHaveBeenCalledWith('https://nostr.media/api/upload', expect.any(Object));
    const tags = mockSignEvent.mock.calls[0][0].tags;
    expect(tags).toContainEqual(['zap', 'addr', '100']);
    expect(tags).toContainEqual(['copyright', 'CC BY']);
  });

  it('saves zap splits for collaborators', async () => {
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock');
    mockTrim.mockImplementation(() => new MockWorker([
      { type: 'progress', progress: 1 },
      { type: 'done', blob: new Blob() },
    ]));

    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }) }),
    );
    (globalThis as any).fetch = mockFetch;
    (globalThis as any).alert = vi.fn();

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
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
    await new Promise((r) => setTimeout(r));
    await new Promise((r) => setTimeout(r));

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      );
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

    const publishBtn = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;
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
    mockTrim.mockImplementation(() => new MockWorker([
      { type: 'progress', progress: 1 },
      { type: 'done', blob: new Blob() },
    ]));

    const mockFetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ video: 'v', poster: 'p', manifest: 'm' }) }),
    );
    (globalThis as any).fetch = mockFetch;
    (globalThis as any).alert = vi.fn();

    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <CreateVideoForm />
        </QueryClientProvider>,
      );
    });

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const topicsInput = container.querySelector(
      'input[placeholder="Topic tags (comma separated)"]',
    ) as HTMLInputElement;
    const lightningInput = Array.from(container.querySelectorAll('label'))
      .find((l) => l.textContent?.includes('Lightning address'))!
      .querySelector('input') as HTMLInputElement;
    const publishButton = container.querySelector('[data-testid="publish-button"]') as HTMLButtonElement;
    const licenseSelect = container.querySelector('[data-testid="license-select"]') as HTMLSelectElement;

    const file = new File(['x'], 'video.mp4', { type: 'video/mp4' });

    await act(async () => {
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await new Promise((r) => setTimeout(r));
    await new Promise((r) => setTimeout(r));

    const setValue = (el: HTMLInputElement, value: string) => {
      const proto = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      );
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
});

