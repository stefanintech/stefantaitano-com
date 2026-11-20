import js from '@eslint/js';
import globals from 'globals';

/**
 * Correctness rules only. Formatting stays out of this config.
 * Generated Eleventy output, the vendored slide deck, and vendored browser scripts are not linted.
 */
export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.cache/**',
      'src/_includes/scripts/**',
      'src/_includes/css/**',
      'src/assets/talks/**',
      'src/assets/scripts/vendor/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node
    },
    rules: {
      // A leading underscore is an unused binding kept for a signature or a rest omit.
      'no-unused-vars': ['error', {argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_'}]
    }
  },
  {
    files: ['src/assets/scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  }
];
