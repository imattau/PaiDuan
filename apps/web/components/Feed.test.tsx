import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed from './Feed';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
});
