import { defineConfig, devices } from '@playwright/test';

const API_PORT = 3100;
const WEB_PORT = 5174;
const MOCK_PORT = 4010;

/**
 * E2E memakai basis data uji (`muhasabah_test`), Redis DB 2, dan AlAdhan tiruan.
 * Butuh `docker compose up -d db redis`.
 */
const apiEnv = {
  NODE_ENV: 'test',
  PORT: String(API_PORT),
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'postgresql://muhasabah:muhasabah@localhost:5432/muhasabah_test',
  REDIS_URL: process.env.E2E_REDIS_URL ?? 'redis://localhost:6379/2',
  JWT_ACCESS_SECRET: 'e2e-access-secret-0123456789-abcdefghijklmnop',
  JWT_REFRESH_SECRET: 'e2e-refresh-secret-0123456789-abcdefghijklmno',
  ALADHAN_BASE_URL: `http://localhost:${MOCK_PORT}`,
  CORS_ORIGIN: `http://localhost:${WEB_PORT}`,
};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    timezoneId: 'Asia/Jakarta',
    locale: 'id-ID',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `node e2e/mock-aladhan.mjs`,
      url: `http://localhost:${MOCK_PORT}/health`,
      env: { PORT: String(MOCK_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      command:
        'pnpm exec prisma migrate deploy && pnpm exec ts-node --transpile-only prisma/seed/index.ts && pnpm exec nest build && node dist/main.js',
      cwd: '../api',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: apiEnv,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `pnpm exec vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      reuseExistingServer: !process.env.CI,
    },
  ],
});
