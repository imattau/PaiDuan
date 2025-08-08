import AppShell from '@/components/layout/AppShell';
import LeftNav from '@/components/layout/LeftNav';
import RightPanel from '@/components/feed/RightPanel';
import { useFeedSelection } from '@/store/feedSelection';

export default function FeedPage() {
  const { setFilterAuthor } = useFeedSelection();
  // TODO: wire to your hooks/state
  const me = { avatar: '/api/avatar/me', name: 'You', username: 'me', stats: { followers: 1234, following: 321 } };
  const author = undefined; // or the author of the currently focused video
  const videos: any[] = []; // your feed items

  function filterByAuthor(pubkey: string) {
    // switch your feed mode to that author (update useFeed or router query)
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
            videos.map((v) => <div key={v.id}>{/* <VideoCard {...v} /> */}</div>)
          )}
        </div>
      }
      right={<RightPanel author={author} onFilterByAuthor={filterByAuthor} />}
    />
  );
}
