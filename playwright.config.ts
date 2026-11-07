import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    extraHTTPHeaders: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  },
  webServer: {
    command: "npx tsx src/server/index.ts",
    url: "http://127.0.0.1:3000/api/auth/me",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
