import '../styles/globals.css';
import Providers from './providers';
import { LayoutProvider } from '@/context/LayoutContext';
import { NextIntlClientProvider } from 'next-intl';
import { locales } from '../utils/locales';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as typeof locales[number])) {
    notFound();
  }

  const messages = {
    common: (await import(`../locales/${locale}/common.json`)).default,
  };

  return (
    <html lang={locale}>
      <body>
        <LayoutProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </LayoutProvider>
      </body>
    </html>
  );
}
