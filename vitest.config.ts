import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.{test,spec}.{js,ts}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.{ts,vue}'],
      exclude: ['app/**/*.spec.ts', 'app/**/*.test.ts'],
    },
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './app'),
      '#app': resolve(__dirname, './node_modules/nuxt/dist/app'),
    },
  },
});
