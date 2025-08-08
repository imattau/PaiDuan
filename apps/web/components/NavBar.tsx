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
            className={`flex flex-col items-center px-3 py-2 rounded-md text-[1.2rem] font-bold focus:outline-none focus-visible:bg-accent/20 focus-visible:text-accent ${
              active
                ? 'bg-accent/20 text-accent'
                : 'text-muted-foreground hover:bg-accent/10 hover:text-accent'
            }`}
            aria-current={active ? 'page' : undefined}
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
