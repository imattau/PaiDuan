import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '../hooks/useNotifications';
import NotificationDrawer from '../components/NotificationDrawer';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GestureProvider>
      <NotificationsProvider>
        <Component {...pageProps} />
        <NotificationDrawer />
        <Toaster />
      </NotificationsProvider>
    </GestureProvider>
  );
}
