import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '../hooks/useNotifications';
import NotificationDrawer from '../components/NotificationDrawer';
import { ThemeProvider } from '../hooks/useTheme';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <GestureProvider>
        <NotificationsProvider>
          <Component {...pageProps} />
          <NotificationDrawer />
          <Toaster />
        </NotificationsProvider>
      </GestureProvider>
    </ThemeProvider>
  );
}
