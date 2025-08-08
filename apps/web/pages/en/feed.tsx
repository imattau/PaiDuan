import { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import FeedTabs from '@/components/FeedTabs';
import VideoFeed from '@/components/VideoFeed';
import AuthorPanel from '@/components/AuthorPanel';
import ThreadedComments from '@/components/ThreadedComments';

export default function FeedPage() {
  const [author, setAuthor] = useState<string | undefined>();
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>();

  return (
    <main className="mx-auto max-w-[1400px] px-4">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden lg:block self-start sticky top-20 space-y-4">
          <SearchBar />
          <MiniProfileCard />
        </aside>

        <section>
          <FeedTabs />
          <VideoFeed onAuthorClick={(pubkey) => setAuthor(pubkey)} />
        </section>

        <aside className="hidden xl:block self-start sticky top-20 space-y-4">
          <AuthorPanel pubkey={author} onFilter={() => {}} />
          <ThreadedComments noteId={currentNoteId} />
        </aside>
      </div>
    </main>
  );
}
