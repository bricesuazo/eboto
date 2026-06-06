import baseConfig from '@eboto/eslint-config/base';

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ['convex/_generated', '.turbo'],
  },
  ...baseConfig,
];
