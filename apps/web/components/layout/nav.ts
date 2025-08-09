import { Home, Users, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: '/feed', label: 'Home', icon: Home },
  { href: '/following', label: 'Following', icon: Users },
  { href: '/create', label: 'Create', icon: Plus },
  { href: '/settings', label: 'Settings', icon: User },
];

