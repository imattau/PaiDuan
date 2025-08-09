import '../styles/globals.css';
import Providers from './providers';
import { LayoutProvider } from '@/context/LayoutContext';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import theme from '../styles/theme';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider theme={theme}>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <LayoutProvider>
            <Providers>{children}</Providers>
          </LayoutProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
