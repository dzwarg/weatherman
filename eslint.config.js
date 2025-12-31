import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist',
      'build',
      'node_modules',
      'coverage',
      '.vite',
      'scripts',
      '.github',
      'packages/*/dist',
      'packages/*/build',
      'packages/*/coverage',
    ],
  },
  {
    files: ['packages/*/src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Allow console in test files
  {
    files: ['**/*.test.{js,jsx}', '**/tests/**/*.{js,jsx}', '**/*.spec.{js,jsx}'],
    rules: {
      'no-console': 'off',
    },
  },
  // Allow console in scripts
  {
    files: ['scripts/**/*.js', '**/*.config.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
