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
  const { asPath, locale } = useRouter();

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
            const currentUrl = new URL(asPath, 'http://localhost');
            const targetUrl = new URL(href, 'http://localhost');
            let currentPath = currentUrl.pathname;
            if (locale) currentPath = currentPath.replace(new RegExp(`^/${locale}`), '');
            const active =
              currentPath === targetUrl.pathname &&
              (targetUrl.search
                ? currentUrl.search === targetUrl.search
                : currentUrl.search === '');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent/20 focus-visible:text-accent ${
                    active
                      ? 'bg-accent/20 text-accent'
                      : 'text-muted-foreground hover:bg-accent/20 hover:text-accent'
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
