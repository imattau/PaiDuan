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
    <nav className="hidden lg:flex lg:flex-col lg:w-48 lg:fixed lg:inset-y-0 lg:pl-4 lg:pt-6 bg-brand-surface/90 backdrop-blur">
      <div className="mb-8 text-2xl font-bold text-white">PaiDuan</div>
      <ul className="space-y-2">
        {links.map(({ href, icon: Icon, label, desktopOnly }) => (
          <li key={href} className={desktopOnly ? 'hidden lg:block' : ''}>
            <Link
              href={href}
              className={`flex items-center rounded px-3 py-2 ${
                asPath === href ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <Icon size={20} className="mr-3" /> {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
