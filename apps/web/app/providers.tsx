'use client';

import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from '../styles/theme';
import { ThemeProvider } from 'next-themes';
import { ModqueueProvider } from '@/context/modqueueContext';
import { GestureProvider } from '@paiduan/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { OverlayHost } from '@/components/ui/Overlay';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <GestureProvider>
          <ModqueueProvider>
            <QueryClientProvider client={queryClient}>
              {children}
              <OverlayHost />
            </QueryClientProvider>
          </ModqueueProvider>
        </GestureProvider>
      </ThemeProvider>
    </ChakraProvider>
  );
}
