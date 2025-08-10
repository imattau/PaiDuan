import { Home, Users, Plus, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationRoute {
  path: string;
  label: string;
  icon: LucideIcon;
}

const authedRoutes: NavigationRoute[] = [
  { path: '/feed', label: 'Home', icon: Home },
  { path: '/feed?tab=following', label: 'Following', icon: Users },
  { path: '/create', label: 'Create', icon: Plus },
  { path: '/settings', label: 'Settings', icon: User },
];

const unauthRoutes: NavigationRoute[] = [
  { path: '/feed', label: 'Feed', icon: Home },
  { path: '/get-started', label: 'Get Started', icon: Plus },
];

export function getNavigation(isAuthenticated: boolean): NavigationRoute[] {
  return isAuthenticated ? authedRoutes : unauthRoutes;
}
