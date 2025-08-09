"use client";

import '../styles/globals.css';
import Providers from './providers';
import { LayoutProvider } from '@/context/LayoutContext';
import { useParams } from 'next/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useParams<{ locale?: string }>();

  return (
    <html lang={locale}>
      <body>
        <LayoutProvider>
          <Providers>{children}</Providers>
        </LayoutProvider>
      </body>
    </html>
  );
}
