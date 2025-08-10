/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import RightPanel from '@/components/feed/RightPanel';
import { LayoutContext } from '@/context/LayoutContext';

const disclosureState = { isOpen: false };
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
    useDisclosure: () => ({ isOpen: disclosureState.isOpen, onClose: vi.fn() }),
  };
});

vi.mock('next/link', () => ({ default: (props: any) => <a {...props} /> }));
vi.mock('next/image', () => ({ default: (props: any) => <img {...props} /> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch: () => {} }) }));
vi.mock('@/components/comments/Thread', () => ({ default: () => <div data-thread /> }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ picture: '/a.jpg', name: 'A' }) }));
vi.mock('@/hooks/useFollowerCount', () => ({ default: () => 1 }));
const feedSelectionState = {
  selectedVideoId: undefined as string | undefined,
  selectedVideoAuthor: undefined as string | undefined,
};
vi.mock('@/store/feedSelection', () => ({
  useFeedSelection: () => feedSelectionState,
}));

(globalThis as any).React = React;

describe('RightPanel', () => {
  it('renders in a drawer when forced', () => {
    const html = renderToStaticMarkup(
      <LayoutContext.Provider value="desktop">
        <RightPanel onFilterByAuthor={() => {}} forceDrawer />
      </LayoutContext.Provider>,
    );
    expect(html).toContain('data-drawer');
  });

  it('renders content only when drawer is open', () => {
    feedSelectionState.selectedVideoId = 'vid123';
    feedSelectionState.selectedVideoAuthor = 'pk';

    disclosureState.isOpen = false;
    const closedHtml = renderToStaticMarkup(
      <LayoutContext.Provider value="mobile">
        <RightPanel onFilterByAuthor={() => {}} />
      </LayoutContext.Provider>,
    );
    expect(closedHtml).not.toContain('data-thread');
    expect(closedHtml).not.toContain('1');

    disclosureState.isOpen = true;
    const openHtml = renderToStaticMarkup(
      <LayoutContext.Provider value="mobile">
        <RightPanel onFilterByAuthor={() => {}} />
      </LayoutContext.Provider>,
    );
    expect(openHtml).toContain('data-thread');
    expect(openHtml).toContain('1');
  });
});

