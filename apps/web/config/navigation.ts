import { Home, Users, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationRoute {
  path: string;
  label: string;
  icon: LucideIcon;
}

export const navigation: NavigationRoute[] = [
  { path: '/feed', label: 'Home', icon: Home },
  { path: '/feed?tab=following', label: 'Following', icon: Users },
  { path: '/create', label: 'Create', icon: Plus },
  { path: '/settings', label: 'Settings', icon: User },
];
