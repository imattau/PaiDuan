"use client";
import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';
import RightPanel from '@/components/feed/RightPanel';
import Feed from '@/components/Feed';
import useFeed from '@/hooks/useFeed';
import { useAuth } from '@/hooks/useAuth';
import useFollowing from '@/hooks/useFollowing';
import useFollowerCount from '@/hooks/useFollowerCount';
import { useProfile } from '@/hooks/useProfile';
import { useFeedSelection } from '@/store/feedSelection';
import { CurrentVideoProvider } from '@/hooks/useCurrentVideo';

export default function FeedPage() {
  const { filterAuthor, setFilterAuthor } = useFeedSelection();
  const { items: videos, loadMore, loading } = useFeed(
    filterAuthor ? { author: filterAuthor } : 'all',
  );

  const { state: auth } = useAuth();
  const { following } = useFollowing(
    auth.status === 'ready' ? auth.pubkey : undefined,
  );
  const myFollowerCount = useFollowerCount(
    auth.status === 'ready' ? auth.pubkey : undefined,
  );
  const meProfile = useProfile(auth.status === 'ready' ? auth.pubkey : undefined);
  const me =
    auth.status === 'ready'
      ? {
          avatar: meProfile?.picture || `/api/avatar/${auth.pubkey}`,
          name: meProfile?.name || auth.pubkey.slice(0, 8),
          username: meProfile?.name || auth.pubkey.slice(0, 8),
          stats: { followers: myFollowerCount, following: following.length },
        }
      : {
          avatar: '/api/avatar/me',
          name: 'You',
          username: 'me',
          stats: { followers: 0, following: 0 },
        };

  function filterByAuthor(pubkey: string) {
    setFilterAuthor(pubkey);
  }

  return (
    <CurrentVideoProvider>
      <AppShell
        left={<MainNav me={me} />}
        center={
          <div className="feed-container h-full">
            {/* tabs bar you already have can stay on top */}
            <Feed items={videos} loadMore={loadMore} loading={loading} />
          </div>
        }
        right={<RightPanel onFilterByAuthor={filterByAuthor} />}
      />
    </CurrentVideoProvider>
  );
}
