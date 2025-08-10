'use client';

import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import theme from '../styles/theme';
import { ThemeProvider, useTheme } from 'next-themes';
import { themes } from '@/agents/theme';
import { ModqueueProvider } from '@/context/modqueueContext';
import { GestureProvider } from '@paiduan/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { OverlayHost } from '@/components/ui/Overlay';
import { NotificationsProvider } from '@/hooks/useNotifications';
import { useEffect } from 'react';

function ColorModeSync() {
  const { resolvedTheme } = useTheme();
  const { setColorMode } = useColorMode();

  useEffect(() => {
    if (resolvedTheme === 'light' || resolvedTheme === 'dark') {
      setColorMode(resolvedTheme);
    }
  }, [resolvedTheme, setColorMode]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem themes={Array.from(themes)}>
        <ColorModeSync />
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
