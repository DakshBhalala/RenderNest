import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@rendernest/shared': path.resolve(__dirname, 'packages/shared/src/index.ts'),
      '@rendernest/database': path.resolve(__dirname, 'packages/database/src/index.ts'),
      '@rendernest/providers': path.resolve(__dirname, 'packages/providers/src/index.ts'),
    },
  },
});
