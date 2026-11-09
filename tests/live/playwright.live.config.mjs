import { defineConfig } from '@playwright/test';

// Live canary against youtube.com with the real unpacked extension (see live.spec.mjs).
export default defineConfig({
  testDir: '.',
  testMatch: 'live.spec.mjs',
  workers: 1,
  retries: 1, // one retry absorbs a slow YouTube response; a real breakage fails twice
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never', outputFolder: '../../playwright-report' }]],
  use: {
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
