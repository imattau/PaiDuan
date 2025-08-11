import { defineConfig, defaultExclude } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
      ui: path.resolve(__dirname, 'packages/ui/src'),
      'react-virtuoso': path.resolve(__dirname, 'test/stubs/react-virtuoso.ts'),
      'react-virtualized-auto-sizer': path.resolve(
        __dirname,
        'test/stubs/react-virtualized-auto-sizer.js'
      ),
    },
  },

  test: {
    exclude: [...defaultExclude],
  },

});
