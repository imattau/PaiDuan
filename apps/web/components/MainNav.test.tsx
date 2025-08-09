/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import MainNav from '@/components/layout/MainNav';
import { LayoutContext, LayoutType } from '@/context/LayoutContext';

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

(globalThis as any).React = React;

describe('MainNav', () => {
  (['desktop', 'tablet', 'mobile'] as LayoutType[]).forEach(layout => {
    it(`renders correctly on ${layout}`, () => {
      const html = renderToStaticMarkup(
        <LayoutContext.Provider value={layout}>
          <MainNav showSearch={false} showProfile={false} />
        </LayoutContext.Provider>,
      );
      expect(html).toContain('/settings');
      expect(html).toContain('aria-current="page"');
    });
  });
});
