import baseConfig, { restrictEnvAccess } from "@eboto/eslint-config/base";
import nextjsConfig from "@eboto/eslint-config/nextjs";
import reactConfig from "@eboto/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
