/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RightPanel from '@/components/feed/RightPanel';
import { LayoutContext } from '@/context/LayoutContext';

vi.mock('@chakra-ui/react', () => {
  const React = require('react');
  return {
    Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
    Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Drawer: ({ children, ...props }: any) => <div data-drawer {...props}>{children}</div>,
    DrawerOverlay: ({ children, ...props }: any) => <div data-overlay {...props}>{children}</div>,
    DrawerContent: ({ children, ...props }: any) => <div data-content {...props}>{children}</div>,
    DrawerBody: ({ children, ...props }: any) => <div data-body {...props}>{children}</div>,
    useColorModeValue: (v: any) => v,
    useDisclosure: () => ({ isOpen: false, onOpen: vi.fn(), onClose: vi.fn() }),
  };
});

vi.mock('next/link', () => ({ default: (props: any) => <a {...props} /> }));
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: () => {} }) }));
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: () => ({ selectedVideoId: undefined, selectedVideoAuthor: undefined }),
}));

(globalThis as any).React = React;

describe('RightPanel', () => {
  it('renders in a drawer when forced', () => {
    const author = { avatar: '/a.jpg', name: 'A', username: 'a', pubkey: 'pk', followers: 1 };
    const html = renderToStaticMarkup(
      <LayoutContext.Provider value="desktop">
        <RightPanel author={author} onFilterByAuthor={() => {}} forceDrawer />
      </LayoutContext.Provider>,
    );
    expect(html).toContain('data-drawer');
  });
});

