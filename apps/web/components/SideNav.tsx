import Link from 'next/link';
import { Home, Users, Plus, Cog } from 'lucide-react';
import { useRouter } from 'next/router';

const links = [
  { href: '/feed', icon: Home, label: 'Home' },
  { href: '/feed?tab=following', icon: Users, label: 'Following' },
  { href: '/create', icon: Plus, label: 'Create', desktopOnly: true },
  { href: '/settings', icon: Cog, label: 'Settings' },
];

export default function SideNav() {
  const { asPath } = useRouter();
  return (
    <nav className="hidden lg:flex lg:flex-col lg:w-48 lg:fixed lg:left-0 lg:inset-y-0 bg-brand-surface/95 backdrop-blur z-40 pl-4 pt-6">
      <h1 className="mb-8 text-2xl font-bold text-white">PaiDuan</h1>
      <ul className="space-y-2">
        {links.map(({ href, icon: Icon, label, desktopOnly }) => {
          const isActive = asPath.startsWith(href);
          return (
            <li key={href} className={desktopOnly ? 'hidden lg:block' : ''}>
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
  );
}
