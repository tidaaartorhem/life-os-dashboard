import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests run against a dev server started by the webServer block.
 * They use the app's demo user database; each spec cleans up the
 * entities it creates so runs stay idempotent.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3102",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "PORT=3102 npm run dev",
    url: "http://localhost:3102",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
