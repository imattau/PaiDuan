'use client';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import MiniProfileCard from '@/components/MiniProfileCard';
import NotificationBell from '@/components/NotificationBell';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { cardStyle } from '@/components/ui/Card';
import Logo from '@/components/branding/Logo';
import { navItems } from './nav';
import { useLayout } from '@/context/LayoutContext';

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
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const toggleMode = () => setTheme(isDark ? 'light' : 'dark');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || undefined;
  const layout = useLayout();

  return (
    <div className="p-[1.2rem] space-y-4">
      <Link href="/" className="block pl-5" prefetch>
        <Logo width={160} height={34} />
      </Link>

      {/* Search */}
      {showSearch && layout !== 'mobile' && <SearchBar showActions={false} />}

      {/* Profile mini card */}
      {showProfile && layout === 'desktop' && <MiniProfileCard stats={me?.stats} />}

      {/* Nav */}
      <nav className={`${cardStyle} p-2`}>
        <ul className="flex flex-col">
          {navItems.map(({ href, label, icon: Icon }) => {
            const currentUrl = new URL(
              pathname + (searchParams.toString() ? `?${searchParams}` : ''),
              'http://localhost',
            );
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent-primary/20 focus-visible:text-accent-primary ${
                    active
                      ? 'bg-accent-primary/20 text-accent-primary'
                      : 'text-muted hover:bg-accent-primary/20 hover:text-accent-primary'
                  }`}
                  aria-current={active ? 'page' : undefined}
                  prefetch={false}
                  onMouseEnter={() => router.prefetch(href)}
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
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <NotificationBell />
      </div>

    </div>
  );
}
