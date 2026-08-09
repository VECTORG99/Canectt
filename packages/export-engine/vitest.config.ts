import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@canectt/schema': join(__dirname, '..', '..', 'packages', 'schema', 'src'),
      '@canectt/design-tokens': join(__dirname, '..', '..', 'packages', 'design-tokens', 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
  },
});
