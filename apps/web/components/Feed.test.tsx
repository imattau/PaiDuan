import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed, { getCenteredVirtualItem } from './Feed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { VirtualItem } from '@tanstack/react-virtual';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('Feed', () => {
  it('renders skeleton during loading', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <Feed items={[]} loading />
      </QueryClientProvider>,
    );
    expect(html).toContain('bg-text-primary/10');
  });

  it('renders empty state when no items', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <Feed items={[]} />
      </QueryClientProvider>,
    );
    expect(html).toContain('<svg');
  });

  describe('getCenteredVirtualItem', () => {
    const items: VirtualItem[] = [
      { index: 0, start: 0, end: 100, size: 100, key: 0, lane: 0 },
      { index: 1, start: 100, end: 200, size: 100, key: 1, lane: 0 },
      { index: 2, start: 200, end: 300, size: 100, key: 2, lane: 0 },
    ];

    it('finds item overlapping the viewport center', () => {
      const result = getCenteredVirtualItem(items, 100, 0);
      expect(result?.index).toBe(0);
    });

    it('ignores overscanned items during fast scrolling', () => {
      const overscanned = items.slice(1);
      const result = getCenteredVirtualItem(overscanned, 100, 175);
      expect(result?.index).toBe(2);
    });
  });
});
