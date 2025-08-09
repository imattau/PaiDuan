'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { navItems } from './nav';
import { useLayout } from '@/context/LayoutContext';

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const layout = useLayout();
  if (layout === 'desktop') return null;

  return (
    <nav className="fixed bottom-0 inset-x-0 flex justify-around border-t bg-surface">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 p-3 focus:outline-none focus-visible:text-accent-primary ${
              active ? 'text-accent-primary' : 'text-muted hover:text-accent-primary'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            prefetch={false}
            onMouseEnter={() => router.prefetch(href)}
          >
            <Icon size={24} />
            <span className="sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

