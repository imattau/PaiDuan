'use client';

import { ThemeProvider } from '@/context/themeContext';
import { GestureProvider } from '@paiduan/ui';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GestureProvider>{children}</GestureProvider>
    </ThemeProvider>
  );
}
