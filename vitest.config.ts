import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
      ui: path.resolve(__dirname, 'packages/ui/src'),
    },
  },
});
