import Link from 'next/link';
import { Home, Users, Plus, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

export default function NavBar() {
  const { asPath, query } = useRouter();
  const locale = (query.locale as string) || 'en';
  const links = [
    { href: `/${locale}/feed`, icon: <Home />, label: 'Home' },
    { href: `/${locale}/feed?tab=following`, icon: <Users />, label: 'Following' },
    { href: `/${locale}/create`, icon: <Plus />, label: 'Create' },
    { href: `/${locale}/profile`, icon: <User />, label: 'Profile' },
  ];
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 lg:hidden z-30 flex justify-around bg-brand-surface/95 backdrop-blur shadow-card"
    >
      {links.map(({ href, icon, label }) => {
        const active = asPath.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center py-2 text-sm text-white/80"
            aria-current={active ? 'page' : undefined}
          >
            <motion.div
              animate={{ scale: active ? 1.2 : 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {icon}
            </motion.div>
            <span className={active ? 'text-white' : ''}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
