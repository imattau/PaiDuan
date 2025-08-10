/* @vitest-environment jsdom */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Ensure React is available globally for components compiled with the classic JSX runtime
(globalThis as any).React = React;

const useFeedMock = vi.hoisted(() => vi.fn(() => ({ items: [], loadMore: vi.fn(), loading: false })));
vi.mock('@/hooks/useFeed', () => ({ default: useFeedMock }));
vi.mock('@/components/layout/AppShell', () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/layout/MainNav', () => ({ default: () => null }));
vi.mock('@/components/feed/RightPanel', () => ({ default: () => null }));
vi.mock('@/components/Feed', () => ({ default: () => null }));
vi.mock('@/hooks/useCurrentVideo', () => ({ CurrentVideoProvider: ({ children }: any) => <>{children}</> }));

const setFilterAuthor = vi.fn();
vi.mock('@/store/feedSelection', () => ({ useFeedSelection: () => ({ filterAuthor: undefined, setFilterAuthor }) }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ state: { status: 'ready', pubkey: 'me' } }) }));
vi.mock('@/hooks/useFollowing', () => ({ default: () => ({ following: ['pk1', 'pk2'] }) }));
vi.mock('@/hooks/useFollowerCount', () => ({ default: () => 0 }));
vi.mock('@/hooks/useProfile', () => ({ useProfile: () => ({}) }));
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: (k: string) => (k === 'tab' ? 'following' : null) }) }));

import FeedPage from './page';

describe('FeedPage', () => {
  it('uses following authors when tab=following', () => {
    render(<FeedPage />);
    expect(useFeedMock).toHaveBeenCalledWith('following', ['pk1', 'pk2']);
  });
});
