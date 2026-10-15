import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173/ai-kkodle/',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'pixel-7',
      use: { ...devices['Pixel 7'] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'iphone-14',
      use: { ...devices['iPhone 14'] },
      testMatch: /mobile\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['iPhone 13'] },
      testMatch: /ime\.spec\.ts/,
      grep: /WebKit compositionend/,
    },
  ],
});
