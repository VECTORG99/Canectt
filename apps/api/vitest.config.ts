import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@canectt/schema': join(__dirname, '..', '..', 'packages', 'schema', 'src'),
      '@canectt/config': join(__dirname, '..', '..', 'packages', 'config', 'src'),
      '@canectt/design-tokens': join(__dirname, '..', '..', 'packages', 'design-tokens', 'src'),
      '@canectt/recognition-engine': join(
        __dirname,
        '..',
        '..',
        'packages',
        'recognition-engine',
        'src',
      ),
      '@canectt/export-engine': join(__dirname, '..', '..', 'packages', 'export-engine', 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: [],
  },
});
