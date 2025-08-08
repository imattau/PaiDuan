import AppShell from '@/components/layout/AppShell';
import LeftNav from '@/components/layout/LeftNav';
import RightPanel from '@/components/feed/RightPanel';
import useFeed from '@/hooks/useFeed';
import { useAuth } from '@/hooks/useAuth';
import useFollowing, { getFollowers } from '@/hooks/useFollowing';
import { useProfile } from '@/hooks/useProfile';
import { useFeedSelection } from '@/store/feedSelection';

export default function FeedPage() {
  const { filterAuthor, setFilterAuthor, selectedVideoAuthor } = useFeedSelection();
  const { items: videos } = useFeed(filterAuthor ? { author: filterAuthor } : 'all');

  const { state: auth } = useAuth();
  const { following } = useFollowing();
  const meProfile = useProfile(auth.status === 'ready' ? auth.pubkey : undefined);
  const me =
    auth.status === 'ready'
      ? {
          avatar: meProfile?.picture || `/api/avatar/${auth.pubkey}`,
          name: meProfile?.name || auth.pubkey.slice(0, 8),
          username: meProfile?.name || auth.pubkey.slice(0, 8),
          stats: { followers: getFollowers(auth.pubkey), following: following.length },
        }
      : { avatar: '/api/avatar/me', name: 'You', username: 'me', stats: { followers: 0, following: 0 } };

  const authorProfile = useProfile(selectedVideoAuthor);
  const author =
    selectedVideoAuthor && authorProfile
      ? {
          avatar: authorProfile.picture || `/api/avatar/${selectedVideoAuthor}`,
          name: authorProfile.name || selectedVideoAuthor.slice(0, 8),
          username: authorProfile.name || selectedVideoAuthor.slice(0, 8),
          pubkey: selectedVideoAuthor,
          followers: getFollowers(selectedVideoAuthor),
        }
      : undefined;

  function filterByAuthor(pubkey: string) {
    setFilterAuthor(pubkey);
  }

  return (
    <AppShell
      left={<LeftNav me={me} />}
      center={
        <div className="space-y-6">
          {/* tabs bar you already have can stay on top */}
          {videos.length === 0 ? (
            <div className="text-center text-muted-foreground py-20">No videos yet.</div>
          ) : (
            videos.map((v) => <div key={v.eventId}>{/* <VideoCard {...v} /> */}</div>)
          )}
        </div>
      }
      right={<RightPanel author={author} onFilterByAuthor={filterByAuthor} />}
    />
  );
}
