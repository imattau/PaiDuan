import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import Feed from './Feed';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('Feed', () => {
  it('renders skeleton during loading', () => {
    const html = renderToStaticMarkup(<Feed items={[]} loading />);
    expect(html).toContain('bg-text-primary/10');
  });

  it('renders empty state when no items', () => {
    const html = renderToStaticMarkup(<Feed items={[]} />);
    expect(html).toContain('<svg');
  });
});
