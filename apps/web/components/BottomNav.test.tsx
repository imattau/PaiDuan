/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BottomNav from '@/components/layout/BottomNav';
import { LayoutProvider } from '@/context/LayoutContext';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: () => {} }),
  usePathname: () => '/feed',
}));

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('BottomNav', () => {
  it('includes link to settings page', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
      writable: true,
      configurable: true,
    });
    const html = renderToStaticMarkup(
      <LayoutProvider>
        <BottomNav />
      </LayoutProvider>,
    );
    expect(html).toContain('/settings');
  });
});
