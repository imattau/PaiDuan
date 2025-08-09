'use client';

import { ThemeProvider } from '@/context/themeContext';
import { ModqueueProvider } from '@/context/modqueueContext';
import { GestureProvider } from '@paiduan/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GestureProvider>
        <ModqueueProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </ModqueueProvider>
      </GestureProvider>
    </ThemeProvider>
  );
}
