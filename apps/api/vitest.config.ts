import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // dist/ contém a build compilada (CJS); coletá-la quebra o runner.
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
