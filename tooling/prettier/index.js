import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

/** @typedef  {import("prettier").Config} PrettierConfig */
/** @typedef  {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */
/** @typedef  {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
  plugins: [
    require.resolve('@ianvs/prettier-plugin-sort-imports'),
    require.resolve('prettier-plugin-tailwindcss'),
  ],
  tailwindStylesheet: path.join(
    __dirname,
    '../../apps/web/src/styles/globals.css',
  ),
  tailwindFunctions: ['cn', 'cva'],
  trailingComma: 'all',
  singleQuote: true,
  semi: true,
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrder: [
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '^(next/(.*)$)|^(next$)',
    '^(expo(.*)$)|^(expo$)',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@eboto/(.*)$',
    '',
    '^~/',
    '^[../]',
    '^[./]',
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderTypeScriptVersion: '4.4.0',
};

export default config;
