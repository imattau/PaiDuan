'use client';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { prefetchFeed } from '@/hooks/useFeed';
import { navigation } from '@/config/navigation';
import { isRouteActive } from '@/utils/navigation';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const asPath = pathname + (searchParams.toString() ? `?${searchParams}` : '');
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 lg:hidden z-30 flex justify-around bg-background-secondary/95 backdrop-blur shadow-card"
    >
      {navigation.map(({ path, icon: Icon, label }) => {
        const href = `/${locale}${path}`;
        const active = isRouteActive(path, pathname, searchParams, locale);
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center px-3 py-2 rounded-md text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent-primary/20 focus-visible:text-accent-primary ${
              active
                ? 'bg-accent-primary/20 text-accent-primary'
                : 'text-muted hover:bg-accent-primary/20 hover:text-accent-primary'
            }`}
            aria-current={active ? 'page' : undefined}
            prefetch={false}
            onMouseEnter={() => {
              router.prefetch(href);
              if (path === '/feed?tab=following') {
                prefetchFeed('following');
              } else if (path.startsWith('/feed')) {
                prefetchFeed('all');
              }
            }}
          >
            <motion.div
              animate={{ scale: active ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Icon />
            </motion.div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
