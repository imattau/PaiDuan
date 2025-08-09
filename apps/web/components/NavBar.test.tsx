import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import NavBar from './NavBar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: () => {} }),
  usePathname: () => '/en/feed',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: 'en' }),
}));

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('NavBar', () => {
  it('includes link to settings page', () => {
    const html = renderToStaticMarkup(<NavBar />);
    expect(html).toContain('/en/settings');
  });
});
