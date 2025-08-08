import AppShell from '@/components/layout/AppShell';
import MainNav from '@/components/layout/MainNav';
import RightPanel from '@/components/feed/RightPanel';
import PlaceholderVideo from '@/components/PlaceholderVideo';
import useFeed from '@/hooks/useFeed';
import { useAuth } from '@/hooks/useAuth';
import useFollowing from '@/hooks/useFollowing';
import useFollowers from '@/hooks/useFollowers';
import { useProfile } from '@/hooks/useProfile';
import { useFeedSelection } from '@/store/feedSelection';

export default function FeedPage() {
  const { filterAuthor, setFilterAuthor, selectedVideoAuthor } = useFeedSelection();
  const { items: videos } = useFeed(filterAuthor ? { author: filterAuthor } : 'all');

  const { state: auth } = useAuth();
  const { following } = useFollowing();
  const myFollowers = useFollowers(auth.status === 'ready' ? auth.pubkey : undefined);
  const authorFollowers = useFollowers(selectedVideoAuthor);
  const meProfile = useProfile(auth.status === 'ready' ? auth.pubkey : undefined);
  const me =
    auth.status === 'ready'
      ? {
          avatar: meProfile?.picture || `/api/avatar/${auth.pubkey}`,
          name: meProfile?.name || auth.pubkey.slice(0, 8),
          username: meProfile?.name || auth.pubkey.slice(0, 8),
          stats: { followers: myFollowers.length, following: following.length },
        }
      : {
          avatar: '/api/avatar/me',
          name: 'You',
          username: 'me',
          stats: { followers: 0, following: 0 },
        };

  const authorProfile = useProfile(selectedVideoAuthor);
  const author =
    selectedVideoAuthor && authorProfile
      ? {
          avatar: authorProfile.picture || `/api/avatar/${selectedVideoAuthor}`,
          name: authorProfile.name || selectedVideoAuthor.slice(0, 8),
          username: authorProfile.name || selectedVideoAuthor.slice(0, 8),
          pubkey: selectedVideoAuthor,
          followers: authorFollowers.length,
        }
      : undefined;

  function filterByAuthor(pubkey: string) {
    setFilterAuthor(pubkey);
  }

  return (
    <AppShell
      left={<MainNav me={me} />}
      center={
        <div className="space-y-6">
          {/* tabs bar you already have can stay on top */}
          {videos.length === 0 ? (
            <PlaceholderVideo className="aspect-[9/16] w-full max-w-[420px] mx-auto text-foreground" />
          ) : (
            videos.map((v) => <div key={v.eventId}>{/* <VideoCard {...v} /> */}</div>)
          )}
        </div>
      }
      right={<RightPanel author={author} onFilterByAuthor={filterByAuthor} />}
    />
  );
}
