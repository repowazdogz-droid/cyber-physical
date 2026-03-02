import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  esbuild: {
    target: 'ES2022',
  },
});
