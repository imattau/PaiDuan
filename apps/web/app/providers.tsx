'use client';

import { ThemeProvider } from '@/context/themeContext';
import { ModqueueProvider } from '@/context/modqueueContext';
import { GestureProvider } from '@paiduan/ui';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GestureProvider>
        <ModqueueProvider>{children}</ModqueueProvider>
      </GestureProvider>
    </ThemeProvider>
  );
}
