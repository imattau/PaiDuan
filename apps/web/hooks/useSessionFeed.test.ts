/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { render } from '@testing-library/react';
import { JSDOM } from 'jsdom';

// Ensure React is available globally
(globalThis as any).React = React;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const feedState: { items: any[] } = { items: [] };
const loadMore = vi.fn();
vi.mock('./useFeed', () => ({
  default: () => ({ items: feedState.items, loadMore, loading: false }),
}));

import useSessionFeed from './useSessionFeed';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://example.com' });
(global as any).window = dom.window;
(global as any).document = dom.window.document;
(global as any).navigator = dom.window.navigator;

function TestComponent({ maxSize = 50 }: { maxSize?: number }) {
  const { queue, markSeen } = useSessionFeed('all', [], { threshold: 0, maxSize });
  (TestComponent as any).queue = queue;
  (TestComponent as any).markSeen = markSeen;
  return React.createElement('div', { 'data-items': queue.map((i) => i.eventId).join(',') });
}

describe('useSessionFeed', () => {
  beforeEach(() => {
    feedState.items = [];
    loadMore.mockClear();
    window.localStorage.clear();
  });

  it('persists cursor to localStorage when items are marked seen', async () => {
    feedState.items = [
      { eventId: 'a', pubkey: 'p', author: '', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
    ];
    render(React.createElement(TestComponent, {}));
    await act(async () => {
      (TestComponent as any).markSeen(1);
    });
    expect(window.localStorage.getItem('sessionCursor')).toBe('a');
  });

  it('trims queue to maxSize after appending', async () => {
    feedState.items = Array.from({ length: 5 }, (_, i) => ({
      eventId: String(i + 1),
      pubkey: 'p' + i,
      author: '',
      caption: '',
      videoUrl: '',
      lightningAddress: '',
      zapTotal: 0,
    }));
    const { container } = render(React.createElement(TestComponent, { maxSize: 3 }));
    await act(async () => {});
    const rendered = container.querySelector('div')?.getAttribute('data-items');
    expect(rendered).toBe('3,4,5');
  });
});

