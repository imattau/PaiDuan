import Link from 'next/link';
import { Home, Users, Plus, Cog } from 'lucide-react';
import { useRouter } from 'next/router';

export default function SideNav() {
  const { asPath, query } = useRouter();
  const locale = (query.locale as string) || 'en';
  const links = [
    { href: `/${locale}/feed`, icon: Home, label: 'Home' },
    { href: `/${locale}/feed?tab=following`, icon: Users, label: 'Following' },
    { href: `/${locale}/create`, icon: Plus, label: 'Create', desktopOnly: true },
    { href: `/${locale}/settings`, icon: Cog, label: 'Settings' },
  ];
  return (
    <nav
      aria-label="Main navigation"
      className="hidden lg:flex lg:flex-col lg:w-48 lg:fixed lg:left-0 lg:inset-y-0 bg-panel/95 backdrop-blur z-40 pl-4 pt-6"
    >
      <h1 className="mb-8 text-2xl font-bold text-white">PaiDuan</h1>
      <ul className="space-y-2">
        {links.map(({ href, icon: Icon, label, desktopOnly }) => {
          const isActive = asPath.startsWith(href);
          return (
            <li key={href} className={desktopOnly ? 'hidden lg:block' : ''}>
              <Link
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent/20 focus-visible:text-accent ${
                  isActive
                    ? 'bg-accent/20 text-accent'
                    : 'text-muted-foreground hover:bg-accent/20 hover:text-accent'
                }`}
                aria-current={isActive ? 'page' : undefined}
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
