'use client';

import { extendTheme } from '@chakra-ui/react';
import themeConfig from './theme-config';

const theme = extendTheme({
  config: themeConfig,
  colors: {
    background: {
      primary: 'hsl(var(--background-primary))',
      secondary: 'hsl(var(--background-secondary))',
    },
    text: {
      primary: 'hsl(var(--text-primary))',
    },
    card: 'hsl(var(--card))',
    surface: 'hsl(var(--surface))',
    accent: {
      primary: 'hsl(var(--accent-primary))',
      hover: 'hsl(var(--accent-hover))',
      active: 'hsl(var(--accent-active))',
    },
    border: {
      primary: 'hsl(var(--border-primary))',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'background.primary',
        color: 'text.primary',
      },
    },
  },
});

export default theme;

