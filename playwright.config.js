import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'e2e.spec.js', workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4175', browserName: 'chromium' },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4175', reuseExistingServer: false, timeout: 120000 }
});
