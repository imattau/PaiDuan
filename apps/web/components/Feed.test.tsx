/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed, { getCenteredVirtualItem, estimateFeedItemSize } from './Feed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutProvider } from '@/context/LayoutContext';
import type { VirtualItem } from '@tanstack/react-virtual';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('Feed', () => {
  it('renders skeleton during loading', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <LayoutProvider>
          <Feed items={[]} loading />
        </LayoutProvider>
      </QueryClientProvider>,
    );
    expect(html).toContain('bg-text-primary/10');
  });

  it('renders empty state when no items', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={new QueryClient()}>
        <LayoutProvider>
          <Feed items={[]} />
        </LayoutProvider>
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

  describe('estimateFeedItemSize', () => {
    it('matches window height when bottom nav is absent', () => {
      const original = window.innerHeight;
      (window as any).innerHeight = 900;
      document.documentElement.style.removeProperty('--bottom-nav-height');
      expect(estimateFeedItemSize()).toBe(900);
      (window as any).innerHeight = original;
    });

    it('subtracts bottom nav height when present', () => {
      const original = window.innerHeight;
      (window as any).innerHeight = 900;
      document.documentElement.style.setProperty('--bottom-nav-height', '50');
      expect(estimateFeedItemSize()).toBe(850);
      document.documentElement.style.removeProperty('--bottom-nav-height');
      (window as any).innerHeight = original;
    });

    it('returns 0 when window is undefined', () => {
      const originalWindow = (globalThis as any).window;
      // @ts-ignore simulate server environment
      delete (globalThis as any).window;
      expect(estimateFeedItemSize()).toBe(0);
      (globalThis as any).window = originalWindow;
    });

  });
});
