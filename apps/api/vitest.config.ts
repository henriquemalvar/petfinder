import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // dist/ contém a build compilada (CJS); coletá-la quebra o runner.
    // A suíte de integração precisa de um Postgres de verdade e roda por
    // vitest.integration.config.ts, via `npm run test:integration`.
    exclude: ['**/node_modules/**', '**/dist/**', 'src/__tests__/integration/**'],
  },
});
