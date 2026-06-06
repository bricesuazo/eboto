import baseConfig from '@eboto/eslint-config/base';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['.turbo'],
  },
  ...baseConfig,
];
