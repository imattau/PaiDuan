import '../styles/globals.css';
import Providers from './providers';
import { ColorModeScript } from '@chakra-ui/react';
import themeConfig from '../styles/theme-config';

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale?: string };
}) {
  const { locale } = params;

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#101010" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <ColorModeScript initialColorMode={themeConfig.initialColorMode} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
