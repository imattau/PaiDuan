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
        accent: 'var(--accent)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          DEFAULT: '#7c3aed',
          surface: '#1a1b1f',
          panel: '#202125',
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
