// ESLint config base compartida por todos los paquetes del monorepo.
// Cada paquete/apps puede extenderla con su propio eslint.config.mjs.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'apps/web/public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "Literal[raw=/#[0-9a-fA-F]{3,8}/]:not(MemberExpression > Property.key)",
          message:
            'No hardcodear colores hex: usar tokens CSS (--color-*) de packages/design-tokens.',
        },
      ],
    },
  },
  // Los hex viven únicamente en packages/design-tokens (la fuente de los tokens).
  {
    files: ['packages/design-tokens/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
  prettier,
);
