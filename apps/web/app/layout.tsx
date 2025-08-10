import '../styles/globals.css';
import Providers from './providers';
import { LayoutProvider } from '@/context/LayoutContext';
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <ColorModeScript initialColorMode={themeConfig.initialColorMode} />
        <LayoutProvider>
          <Providers>{children}</Providers>
        </LayoutProvider>
      </body>
    </html>
  );
}
