import type { AppProps, AppContext } from 'next/app';
import App from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';
import { NotificationsProvider } from '../hooks/useNotifications';
import NotificationDrawer from '../components/NotificationDrawer';
import NavBar from '../components/NavBar';
import { ThemeProvider } from '@/context/themeContext';
import InstallBanner from '../components/InstallBanner';
import useOffline from '../utils/useOffline';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import * as Sentry from '@sentry/nextjs';
import { NextIntlClientProvider } from 'next-intl';
import { trackPageview, analyticsEnabled, consentGiven } from '../utils/analytics';
import { useAuth } from '@/hooks/useAuth';

export default function MyApp({ Component, pageProps }: AppProps) {
  useOffline();
  const router = useRouter();
  const { hasKeys, hasProfile } = useAuth();
  const locale = (router.query.locale as string) || 'en';
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  useEffect(() => {
    const accent = localStorage.getItem('accent') || 'violet';
    document.documentElement.setAttribute('data-accent', accent);
  }, []);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && consentGiven()) {
      Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
    }
  }, []);

  // Redirect users based on authentication state when visiting the landing page.
  useEffect(() => {
    const landingPaths = ['/', '/[locale]'];
    if (landingPaths.includes(router.pathname) && hasKeys) {
      if (!hasProfile) {
        router.replace('/onboarding/profile');
      } else {
        router.replace('/en/feed');
      }
    }
  }, [router, hasKeys, hasProfile]);

  useEffect(() => {
    const handleRoute = (url: string) => trackPageview(url);
    handleRoute(window.location.pathname);
    router.events.on('routeChangeComplete', handleRoute);
    return () => router.events.off('routeChangeComplete', handleRoute);
  }, [router]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={pageProps.messages}
      timeZone={timeZone}
      onError={(err) => {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(err);
        }
      }}
    >
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
              {router.pathname.startsWith('/en/feed') || router.pathname.startsWith('/en/create') || router.pathname.startsWith('/en/profile') || router.pathname.startsWith('/en/settings') ? <NavBar /> : null}
              <InstallBanner />
              <Toaster />
            </NotificationsProvider>
          </GestureProvider>
        </ThemeProvider>
    </NextIntlClientProvider>
  );
}

MyApp.getInitialProps = async (appContext: AppContext) => {
  const appProps = await App.getInitialProps(appContext);
  const locale = (appContext.router?.query?.locale as string) || 'en';
  const messages = (await import(`../locales/${locale}/common.json`)).default;
  return {
    ...appProps,
    pageProps: {
      ...appProps.pageProps,
      messages: { common: messages },
    },
  };
};
