import '../styles/globals.css';
import Providers from './providers';
import { LayoutProvider } from '@/context/LayoutContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LayoutProvider>
          <Providers>{children}</Providers>
        </LayoutProvider>
      </body>
    </html>
  );
}
