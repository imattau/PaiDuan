'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { navItems } from './nav';

export default function BottomNav() {
  const { asPath } = useRouter();

  return (
    <nav className="fixed bottom-0 inset-x-0 flex justify-around border-t bg-surface lg:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = asPath.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 p-3 focus:outline-none focus-visible:text-accent-primary ${
              active ? 'text-accent-primary' : 'text-muted hover:text-accent-primary'
            }`}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={24} />
            <span className="sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

