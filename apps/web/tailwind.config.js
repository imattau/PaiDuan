/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
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
          surface: '#18181b',
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
