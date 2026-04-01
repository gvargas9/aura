import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/production",
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 1,
  workers: 1,
  use: {
    baseURL: "https://aura.inspiration-ai.com",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
    },
  },
  reporter: [["list"], ["html", { open: "never" }]],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 812 },
        isMobile: true,
      },
    },
  ],
});
