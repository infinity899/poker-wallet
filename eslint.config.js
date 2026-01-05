import antfu from '@antfu/eslint-config';

export default antfu(
  {
    vue: true,
    typescript: true,
    stylistic: {
      semi: true,
    },
    ignores: [
      'scripts/**',
      '*.md',
    ],
  },
  {
    rules: {
      'curly': ['error', 'all'],
      'style/max-statements-per-line': ['error', { max: 1 }],
      'vue/block-order': ['error', {
        order: ['template', 'script', 'style'],
      }],
      'ts/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'vue/multi-word-component-names': 'off',
    },
  },
);
