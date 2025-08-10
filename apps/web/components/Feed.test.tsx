/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed, { estimateFeedItemSize } from './Feed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LayoutProvider } from '@/context/LayoutContext';

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

    it('caps height by width on narrow viewports', () => {
      const originalHeight = window.innerHeight;
      const originalWidth = window.innerWidth;
      (window as any).innerHeight = 900;
      (window as any).innerWidth = 300;
      document.documentElement.style.removeProperty('--bottom-nav-height');
      expect(estimateFeedItemSize()).toBeCloseTo((300 * 16) / 9);
      (window as any).innerHeight = originalHeight;
      (window as any).innerWidth = originalWidth;
    });
  });
});
