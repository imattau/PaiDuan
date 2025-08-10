import { defineConfig, defaultExclude } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web'),
      ui: path.resolve(__dirname, 'packages/ui/src'),
      '@videojs/http-streaming': path.resolve(
        __dirname,
        'test/stubs/videojs-http-streaming.ts',
      ),
    },
  },

  test: {
    exclude: [...defaultExclude, 'apps/web/components/create/CreateVideoForm*.test.tsx'],
  },

});
