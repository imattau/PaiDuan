/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed, { estimateFeedItemSize } from './Feed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLayout } from '@/hooks/useLayout';

vi.mock('@/hooks/useLayout');

vi.mocked(useLayout).mockReturnValue('mobile');

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

  describe('estimateFeedItemSize', () => {
    it('matches window height', () => {
      const original = window.innerHeight;
      (window as any).innerHeight = 900;
      expect(estimateFeedItemSize()).toBe(900);
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
