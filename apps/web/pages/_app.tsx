import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '../hooks/useNotifications';
import NotificationDrawer from '../components/NotificationDrawer';
import { ThemeProvider } from '../hooks/useTheme';
import InstallBanner from '../components/InstallBanner';
import useOffline from '../utils/useOffline';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as Sentry from '@sentry/nextjs';
import { trackPageview, analyticsEnabled, consentGiven } from '../utils/analytics';

export default function MyApp({ Component, pageProps }: AppProps) {
  useOffline();
  const router = useRouter();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && consentGiven()) {
      Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
    }
  }, []);

  useEffect(() => {
    const handleRoute = (url: string) => trackPageview(url);
    handleRoute(window.location.pathname);
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
  }, [router]);

  return (
    <ThemeProvider>
      <GestureProvider>
        <NotificationsProvider>
          <Sentry.ErrorBoundary
            fallback={
              <div className="p-4 text-center" onClick={() => window.location.reload()}>
                Something went wrong – tap to reload
              </div>
            }
          >
            <Component {...pageProps} />
          </Sentry.ErrorBoundary>
          <NotificationDrawer />
          <InstallBanner />
          <Toaster />
        </NotificationsProvider>
      </GestureProvider>
    </ThemeProvider>
  );
}
