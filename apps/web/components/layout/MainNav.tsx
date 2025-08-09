'use client';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from '@/context/themeContext';
import { Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/router';
import { cardStyle } from '@/components/ui/Card';
import Logo from '@/components/branding/Logo';
import { navItems } from './nav';

interface MainNavProps {
  me?: {
    avatar: string;
    name: string;
    username: string;
    stats: { followers: number; following: number };
  };
  showSearch?: boolean;
  showProfile?: boolean;
}

export default function MainNav({
  me,
  showSearch = true,
  showProfile = true,
}: MainNavProps) {
  const { mode, toggleMode } = useTheme();
  const { asPath } = useRouter();

  return (
    <div className="p-[1.2rem] space-y-4">
      <Link href="/" className="block pl-5">
        <Logo width={160} height={34} />
      </Link>

      {/* Search */}
      {showSearch && <SearchBar showActions={false} />}

      {/* Profile mini card */}
      {showProfile && <MiniProfileCard stats={me?.stats} />}

      {/* Nav */}
      <nav className={`${cardStyle} p-2`}>
        <ul className="flex flex-col">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = asPath.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent-primary/20 focus-visible:text-accent-primary ${
                    active
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-muted hover:bg-accent-primary/20 hover:text-accent-primary'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon size={20} /> {label}
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

    </div>
  );
}
