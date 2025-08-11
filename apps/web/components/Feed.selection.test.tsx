/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const virtuosoMock = vi.hoisted(() => {
  const React = require('react');
  const scrollToIndex = vi.fn();
  const MockVirtuoso = React.forwardRef((props: any, ref: any) => {
    if (typeof ref === 'function') {
      ref({ scrollToIndex });
    } else if (ref) {
      ref.current = { scrollToIndex };
    }
    return React.createElement('div', props);
  });
  MockVirtuoso.displayName = 'Virtuoso';
  return { Virtuoso: MockVirtuoso, scrollToIndex };
});
vi.mock('react-virtuoso', () => ({ Virtuoso: virtuosoMock.Virtuoso }));
const { scrollToIndex } = virtuosoMock;

vi.mock('./VideoCard', () => {
  const React = require('react');
  return {
    VideoCard: (props: any) => React.createElement('div', { 'data-video': props.eventId }),
    default: (props: any) => React.createElement('div', { 'data-video': props.eventId }),
  };
});
vi.mock('./EmptyState', () => ({ default: () => null }));
vi.mock('./ui/SkeletonVideoCard', () => ({ SkeletonVideoCard: () => null }));
vi.mock('next/link', () => {
  const React = require('react');
  return { default: (props: any) => React.createElement('a', props) };
});
vi.mock('./CommentDrawer', () => ({ default: () => null }));
vi.mock('./ZapButton', () => ({ default: () => null }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ state: { status: 'ready', pubkey: 'pk' } }) }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({ wallets: [] }) }));
vi.mock('@/hooks/useLayout', () => ({ useLayout: () => 'mobile' }));

import Feed from './Feed';
import { useFeedSelection } from '@/store/feedSelection';
import { useSettings } from '@/store/settings';

describe('Feed selection persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    scrollToIndex.mockClear();
    useSettings.getState().setEnableFeedResume(false);
  });

  it('scrolls to persisted selected video on mount', async () => {
    act(() => {
      useFeedSelection.getState().setSelectedVideo('vid2', 'pk2');
    });
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

  it('restores last viewed position after refresh', async () => {
    act(() => {
      useSettings.getState().setEnableFeedResume(true);
      useFeedSelection.getState().setLastPosition(1, 'vid3', 123);
    });
    const items = [
      { eventId: 'vid1', pubkey: 'pk1', author: 'a1', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid2', pubkey: 'pk2', author: 'a2', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid3', pubkey: 'pk3', author: 'a3', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
    ];
    render(<Feed items={items} />);
    await waitFor(() => {
      expect(scrollToIndex).toHaveBeenCalledWith({ index: 1, align: 'start' });
    });
  });

  it('fetches older pages when last cursor is missing', async () => {
    act(() => {
      useSettings.getState().setEnableFeedResume(true);
      useFeedSelection.getState().setLastPosition(1, 'vid4', 123);
    });

    const initialItems = [
      { eventId: 'vid1', pubkey: 'pk1', author: 'a1', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid2', pubkey: 'pk2', author: 'a2', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
    ];

    const olderItems = [
      { eventId: 'vid3', pubkey: 'pk3', author: 'a3', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
      { eventId: 'vid4', pubkey: 'pk4', author: 'a4', caption: '', videoUrl: '', lightningAddress: '', zapTotal: 0 },
    ];

    const loadMoreSpy = vi.fn();

    const Wrapper = () => {
      const [items, setItems] = React.useState(initialItems);
      const loadMore = () => {
        loadMoreSpy();
        setItems((prev) => [...prev, ...olderItems]);
      };
      return <Feed items={items} loadMore={loadMore} />;
    };

    render(<Wrapper />);

    await waitFor(() => {
      expect(loadMoreSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(scrollToIndex).toHaveBeenCalledWith({ index: 1, align: 'start' });
    });
  });
});
