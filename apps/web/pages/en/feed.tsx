import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Home, Users, Plus, Cog } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import FeedTabs from '@/components/FeedTabs';
import VideoFeed from '@/components/VideoFeed';
import AuthorPanel from '@/components/AuthorPanel';
import ThreadedComments from '@/components/ThreadedComments';

export default function FeedPage() {
  const [author, setAuthor] = useState<string | undefined>();
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>();
  const { asPath, query } = useRouter();
  const locale = (query.locale as string) || 'en';
  const links = [
    { href: `/${locale}/feed`, icon: Home, label: 'Home' },
    { href: `/${locale}/feed?tab=following`, icon: Users, label: 'Following' },
    { href: `/${locale}/create`, icon: Plus, label: 'Create' },
    { href: `/${locale}/settings`, icon: Cog, label: 'Settings' },
  ];

  return (
    <main className="mx-auto max-w-[1400px] px-4">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
        <aside className="hidden lg:block self-start sticky top-20 space-y-4">
          <SearchBar />
          <MiniProfileCard />
          <nav>
            <ul className="space-y-2">
              {links.map(({ href, icon: Icon, label }) => {
                const isActive = asPath.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        isActive ? 'bg-white/10 text-white' : 'text-muted-foreground hover:bg-white/5'
                      }`}
                    >
                      <Icon size={20} /> {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
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
