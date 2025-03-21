// import js from '@eslint/js';
// import { FlatCompat } from '@eslint/eslintrc';
// import * as path from 'node:path';

// const compat = new FlatCompat({
//   // import.meta.dirname is available after Node.js v20.11.0
//   baseDirectory: path.resolve(import.meta.dirname, './src'),
//   recommendedConfig: js.configs.recommended,
// });

// const eslintConfig = [
//   ...compat.config({
//     extends: ['eslint:recommended'],
//   }),
// ];
// export default eslintConfig;

import pluginJs from '@eslint/js';
export default [pluginJs.configs.recommended];
