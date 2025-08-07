import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '../hooks/useNotifications';
import NotificationDrawer from '../components/NotificationDrawer';
import { ThemeProvider } from '../hooks/useTheme';
import InstallBanner from '../components/InstallBanner';
import useOffline from '../utils/useOffline';

export default function MyApp({ Component, pageProps }: AppProps) {
  useOffline();
  return (
    <ThemeProvider>
      <GestureProvider>
        <NotificationsProvider>
          <Component {...pageProps} />
          <NotificationDrawer />
          <InstallBanner />
          <Toaster />
        </NotificationsProvider>
      </GestureProvider>
    </ThemeProvider>
  );
}
