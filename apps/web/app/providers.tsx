'use client';

import { ChakraProvider } from '@chakra-ui/react';
import theme from '../styles/theme';
import { ThemeProvider } from 'next-themes';
import { ModqueueProvider } from '@/context/modqueueContext';
import { GestureProvider } from '@paiduan/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { OverlayHost } from '@/components/ui/Overlay';
import { NotificationsProvider } from '@/hooks/useNotifications';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GestureProvider>
          <ModqueueProvider>
            <QueryClientProvider client={queryClient}>
              <NotificationsProvider>
                {children}
                <OverlayHost />
              </NotificationsProvider>
            </QueryClientProvider>
          </ModqueueProvider>
        </GestureProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
