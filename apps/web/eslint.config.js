import baseConfig from '@eboto/eslint-config/base';
import reactConfig from '@eboto/eslint-config/react';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.output', '.vinxi', '.nitro', 'src/routeTree.gen.ts'],
  },
  ...baseConfig,
  ...reactConfig,
  {
    files: ['src/routes/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/only-throw-error': 'off',
    },
  },
];
