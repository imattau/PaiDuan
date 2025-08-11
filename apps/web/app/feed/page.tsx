"use client";
import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';
import RightPanel from '@/components/feed/RightPanel';
import Feed from '@/components/Feed';
import useSessionFeed from '@/hooks/useSessionFeed';
import { useAuth } from '@/hooks/useAuth';
import useFollowing from '@/hooks/useFollowing';
import useFollowerCount from '@/hooks/useFollowerCount';
import { useProfile } from '@/hooks/useProfile';
import { useAvatar } from '@/hooks/useAvatar';
import { useFeedSelection } from '@/store/feedSelection';
import { CurrentVideoProvider } from '@/hooks/useCurrentVideo';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function FeedPage() {
  const isClient = typeof window !== 'undefined';
  const { filterAuthor, setFilterAuthor } = useFeedSelection();
  const { state: auth } = useAuth();
  const { following } = useFollowing(
    auth.status === 'ready' ? auth.pubkey : undefined,
  );
  const myFollowerCount = useFollowerCount(
    auth.status === 'ready' ? auth.pubkey : undefined,
  );
  const meProfile = useProfile(auth.status === 'ready' ? auth.pubkey : undefined);
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const feedMode = tab === 'following' ? 'following' : 'all';

  useEffect(() => {
    setFilterAuthor(undefined);
  }, [feedMode, setFilterAuthor]);

  const mode = filterAuthor ? { author: filterAuthor } : feedMode;
  const { queue: videos, fetchMore, markSeen } = useSessionFeed(
    mode,
    feedMode === 'following' && !filterAuthor ? following : [],
  );
  const mePubkey = auth.status === 'ready' ? auth.pubkey : 'me';
  const meAvatar = useAvatar(meProfile?.picture ? undefined : mePubkey);
  const me =
    auth.status === 'ready'
      ? {
          avatar: meProfile?.picture || meAvatar,
          name: meProfile?.name || auth.pubkey.slice(0, 8),
          username: meProfile?.name || auth.pubkey.slice(0, 8),
          stats: { followers: myFollowerCount, following: following.length },
        }
      : {
          avatar: meAvatar,
          name: 'You',
          username: 'me',
          stats: { followers: 0, following: 0 },
        };

  function filterByAuthor(pubkey: string) {
    setFilterAuthor(pubkey);
  }

  const loading = videos.length === 0;

  return (
    <CurrentVideoProvider>
      <AppShell
        left={<MainNav me={me} />}
        center={
          isClient ? (
            <Feed
              items={videos}
              loadMore={fetchMore}
              markSeen={markSeen}
              loading={loading}
            />
          ) : (
            <Feed items={[]} loadMore={() => {}} markSeen={() => {}} loading />
          )
        }
        right={<RightPanel onFilterByAuthor={filterByAuthor} />}
      />
    </CurrentVideoProvider>
  );
}
