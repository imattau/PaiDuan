/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BottomNav from '@/components/layout/BottomNav';
import type { LayoutType } from '@/hooks/useLayout';
import { useLayout } from '@/hooks/useLayout';

vi.mock('@/hooks/useLayout');

vi.mock('@chakra-ui/react', () => {
  const React = require('react');
  return {
    Flex: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    useColorModeValue: (v: any) => v,
  };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: () => {} }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => useAuthMock() }));

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

describe('BottomNav', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ state: { status: 'ready' } });
  });

  (['desktop', 'tablet', 'mobile'] as LayoutType[]).forEach(layout => {
    it(`renders correctly on ${layout}`, () => {
      vi.mocked(useLayout).mockReturnValue(layout);
      const html = renderToStaticMarkup(<BottomNav />);
      if (layout === 'desktop') {
        expect(html).toBe('');
      } else {
        expect(html).toContain('/settings');
        expect(html).toContain('aria-current="page"');
      }
    });
  });

  it('shows limited nav when signed out', () => {
    useAuthMock.mockReturnValue({ state: { status: 'signedOut' } });
    vi.mocked(useLayout).mockReturnValue('mobile');
    const html = renderToStaticMarkup(<BottomNav />);
    expect(html).toContain('/get-started');
    expect(html).not.toContain('/settings');
  });
});
