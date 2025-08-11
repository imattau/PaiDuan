/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MainNav from '@/components/layout/MainNav';
import type { LayoutType } from '@/hooks/useLayout';
import { useLayout } from '@/hooks/useLayout';

vi.mock('@/hooks/useLayout');

vi.mock('@chakra-ui/react', () => {
  const React = require('react');
  return {
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    VStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    HStack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    IconButton: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    useColorMode: () => ({ colorMode: 'light', toggleColorMode: () => {} }),
    useColorModeValue: (v: any) => v,
  };
});

vi.mock('@/components/NotificationBell', () => ({ default: () => null }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ prefetch: () => {} }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const useAuthMock = vi.fn();
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => useAuthMock() }));

(globalThis as any).React = React;

describe('MainNav', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ state: { status: 'ready' } });
  });

  (['desktop', 'tablet', 'mobile'] as LayoutType[]).forEach(layout => {
    it(`renders correctly on ${layout}`, () => {
      vi.mocked(useLayout).mockReturnValue(layout);
      const html = renderToStaticMarkup(
        <MainNav showSearch={false} showProfile={false} />,
      );
      expect(html).toContain('/settings');
      expect(html).toContain('aria-current="page"');
    });
  });

  it('shows limited nav when signed out', () => {
    useAuthMock.mockReturnValue({ state: { status: 'signedOut' } });
    vi.mocked(useLayout).mockReturnValue('mobile');
    const html = renderToStaticMarkup(
      <MainNav showSearch={false} showProfile={false} />,
    );
    expect(html).toContain('/get-started');
    expect(html).not.toContain('/settings');
  });
});
