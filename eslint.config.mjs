import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      'apps/web/playwright-report/**',
      'apps/web/test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,vue}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      // Batas modul: fitur hanya boleh diimpor lewat index.ts-nya (ARCHITECTURE.md 5.2).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@/features/*/*'], message: 'Impor fitur lain hanya lewat index.ts-nya.' },
            {
              group: ['**/apps/api/**', 'api/src/*'],
              message: 'web tidak boleh mengimpor dari api.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/api/**/*.ts'],
    rules: {
      // NestJS butuh impor nilai untuk kelas yang dipakai lewat dependency injection.
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['**/apps/web/**'], message: 'api tidak boleh mengimpor dari web.' }],
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs}'],
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  prettier,
);
