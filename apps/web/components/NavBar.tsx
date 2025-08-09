import Link from 'next/link';
import { Home, Users, Plus, Settings } from 'lucide-react';
import { useRouter, usePathname, useSearchParams, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { prefetchFeed } from '@/hooks/useFeed';

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const asPath = pathname + (searchParams.toString() ? `?${searchParams}` : '');
  const links = [
    { href: `/${locale}/feed`, icon: <Home />, label: 'Home' },
    { href: `/${locale}/feed?tab=following`, icon: <Users />, label: 'Following' },
    { href: `/${locale}/create`, icon: <Plus />, label: 'Create' },
    { href: `/${locale}/settings`, icon: <Settings />, label: 'Settings' },
  ];
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 lg:hidden z-30 flex justify-around bg-background-secondary/95 backdrop-blur shadow-card"
    >
      {links.map(({ href, icon, label }) => {
        const active = asPath.startsWith(href);
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
              if (href.includes('/feed?tab=following')) {
                prefetchFeed('following');
              } else if (href.includes('/feed')) {
                prefetchFeed('all');
              }
            }}
          >
            <motion.div
              animate={{ scale: active ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
