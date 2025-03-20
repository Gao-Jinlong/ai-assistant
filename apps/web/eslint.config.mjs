import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
export default defineConfig([
  reactHooks.configs['recommended-latest'],
  {
    files: ['./app/**/*.ts', './app/**/*.tsx'],
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
