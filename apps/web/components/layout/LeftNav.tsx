'use client';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/context/themeContext';
import { Sun, Moon } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      {/* Search */}
      <SearchBar />

      {/* Profile mini card */}
      <MiniProfileCard />

      {/* Nav */}
      <nav className="bg-card border border-token rounded-2xl p-2">
        <ul className="flex flex-col">
          <li>
            <Link
              className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block"
              href="/feed"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block"
              href="/following"
            >
              Following
            </Link>
          </li>
          <li>
            <Link
              className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block"
              href="/create"
            >
              Create
            </Link>
          </li>
          <li>
            <Link
              className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 inline-block"
              href="/settings"
            >
              Settings
            </Link>
          </li>
        </ul>
      </nav>

      {/* Actions */}
      <div className="bg-card border border-token rounded-2xl p-2 flex items-center justify-between">
        <button
          onClick={toggleMode}
          className="px-3 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10"
        >
          {mode === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <NotificationBell />
      </div>

      {/* Stats */}
      <div className="bg-card border border-token rounded-2xl p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Followers</span>
          <span className="font-medium">{me.stats.followers.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-muted-foreground">Following</span>
          <span className="font-medium">{me.stats.following.toLocaleString()}</span>
        </div>
        <Link href="/settings" className="mt-3 inline-block text-sm underline">
          Profile settings
        </Link>
      </div>
    </div>
  );
}
