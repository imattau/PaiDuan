/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'background-primary': 'hsl(var(--background-primary))',
        'background-secondary': 'hsl(var(--background-secondary))',
        'text-primary': 'hsl(var(--text-primary))',
        card: 'hsl(var(--card))',
        surface: 'hsl(var(--surface))',
        'accent-primary': 'hsl(var(--accent-primary))',
        'accent-hover': 'hsl(var(--accent-hover))',
        'accent-active': 'hsl(var(--accent-active))',
        'border-primary': 'hsl(var(--border-primary))',
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
    require('daisyui'),
  ],
};
