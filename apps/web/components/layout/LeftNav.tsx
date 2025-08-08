'use client';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/context/themeContext';
import { Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/router';
import { cardStyle } from '@/components/ui/Card';

export default function LeftNav({
  me,
}: {
  me: {
    avatar: string;
    name: string;
    username: string;
    stats: { followers: number; following: number };
  };
}) {
  const { mode, toggleMode } = useTheme();
  const { asPath } = useRouter();

  return (
    <div className="p-[1.2rem] space-y-4">
      {/* Search */}
      <SearchBar showActions={false} />

      {/* Profile mini card */}
      <MiniProfileCard />

      {/* Nav */}
      <nav className={`${cardStyle} p-2`}>
        <ul className="flex flex-col">
          {[
            { href: '/feed', label: 'Home' },
            { href: '/following', label: 'Following' },
            { href: '/create', label: 'Create' },
            { href: '/settings', label: 'Settings' },
          ].map(({ href, label }) => {
            const active = asPath.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`px-3 py-2 rounded-lg text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent/20 focus-visible:text-accent ${
                    active
                      ? 'bg-accent/20 text-accent'
                      : 'text-muted-foreground hover:bg-accent/20 hover:text-accent'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Actions */}
      <div className={`${cardStyle} p-2 flex items-center justify-between`}>
        <button
          onClick={toggleMode}
          className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 focus-visible:bg-white/50 dark:focus-visible:bg-white/10"
        >
          {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <NotificationBell />
      </div>

      {/* Stats */}
      <div className={`${cardStyle} p-4 text-sm`}>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Followers</span>
          <span className="text-[0.9rem] font-light">{me.stats.followers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground">Following</span>
          <span className="text-[0.9rem] font-light">{me.stats.following.toLocaleString()}</span>
        </div>
        <Link href="/settings" className="mt-3 inline-block text-sm underline">
          Profile settings
        </Link>
      </div>
    </div>
  );
}
