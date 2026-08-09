import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@canectt/schema': join(__dirname, '..', '..', 'packages', 'schema', 'src'),
      '@canectt/config': join(__dirname, '..', '..', 'packages', 'config', 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
