/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        surface: 'hsl(var(--surface))',
        panel: 'hsl(var(--panel))',
        accent: 'hsl(var(--accent))',
        border: 'hsl(var(--border))',
        brand: {
          DEFAULT: '#9d4edd',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 6px 24px 0 rgb(0 0 0 / 0.05)',
      },
    },
  },
  variants: {
    extend: {
      margin: ['rtl'],
      padding: ['rtl'],
    },
  },
  plugins: [
    plugin(require('tailwindcss-plugin-rtl')),
    require('@tailwindcss/typography'),
  ],
};
