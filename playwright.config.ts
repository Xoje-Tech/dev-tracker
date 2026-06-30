import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for dev-tracker E2E smoke tests.
 *
 * Strategy notes:
 *  - webServer builds + starts the production server (Express serves the
 *    built client from dist/client). This matches real user conditions
 *    better than a Vite dev server.
 *  - We rely on tests/e2e/global-setup.ts to rename `.env` out of the way,
 *    so the webServer.env DATABASE_URL takes effect (env.ts loads .env with
 *    override:true).
 *  - single worker, serial — keeps the e2e SQLite DB simple and the smoke
 *    test deterministic.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    port: 3000,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_URL: "file:./e2e.db",
      SESSION_SECRET: "e2e-te...se",
      NODE_ENV: "test",
      PORT: "3000",
    },
  },
});