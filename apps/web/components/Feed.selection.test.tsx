/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

const scrollToIndex = vi.fn();
const MockVirtuoso = React.forwardRef((props: any, ref: any) => {
  if (typeof ref === 'function') {
    ref({ scrollToIndex });
  } else if (ref) {
    ref.current = { scrollToIndex };
  }
  return <div {...props} />;
});
MockVirtuoso.displayName = 'Virtuoso';
vi.mock('react-virtuoso', () => ({ Virtuoso: MockVirtuoso }));

vi.mock('./VideoCard', () => ({
  VideoCard: (props: any) => <div data-video={props.eventId} />, // simple stub
  default: (props: any) => <div data-video={props.eventId} />,
}));
vi.mock('./EmptyState', () => ({ default: () => null }));
vi.mock('./ui/SkeletonVideoCard', () => ({ SkeletonVideoCard: () => null }));
vi.mock('next/link', () => ({ default: (props: any) => <a {...props} /> }));
vi.mock('./CommentDrawer', () => ({ default: () => null }));
vi.mock('./ZapButton', () => ({ default: () => null }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ state: { status: 'ready', pubkey: 'pk' } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ wallets: [] }) }));
vi.mock('@/context/LayoutContext', () => ({
  useLayout: () => 'mobile',
  LayoutProvider: ({ children }: any) => <div>{children}</div>,
}));

import Feed from './Feed';
import { useFeedSelection } from '@/store/feedSelection';

describe('Feed selection persistence', () => {
  it('scrolls to persisted selected video on mount', async () => {
    localStorage.clear();
    useFeedSelection.getState().setSelectedVideo('vid2', 'pk2');
    expect(
      JSON.parse(localStorage.getItem('feed-selection') as string).state,
    ).toMatchObject({ selectedVideoId: 'vid2', selectedVideoAuthor: 'pk2' });

    const items = [
      { eventId: 'vid1', pubkey: 'pk1', author: 'a1', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid2', pubkey: 'pk2', author: 'a2', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid3', pubkey: 'pk3', author: 'a3', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
    ];

    render(<Feed items={items} />);
    await waitFor(() => {
      expect(scrollToIndex).toHaveBeenCalledWith({ index: 1 });
    });
  });
});
