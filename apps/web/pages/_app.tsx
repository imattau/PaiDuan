import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GestureProvider>
      <Component {...pageProps} />
    </GestureProvider>
  );
}
