import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { GestureProvider } from '@paiduan/ui';
import { Toaster } from 'react-hot-toast';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <GestureProvider>
      <Component {...pageProps} />
      <Toaster />
    </GestureProvider>
  );
}
