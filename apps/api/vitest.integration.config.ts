import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './src/__tests__/integration/testDatabase';

export default defineConfig({
  test: {
    include: ['src/__tests__/integration/**/*.test.ts'],
    globalSetup: ['./src/__tests__/integration/globalSetup.ts'],
    setupFiles: ['./src/__tests__/integration/setup.ts'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DIRECT_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'integration-test-secret',
      AUTH_RATE_LIMIT_MAX: '100000',
    },
  },
});
