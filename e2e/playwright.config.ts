import { defineConfig, devices } from "@playwright/test";

const appUrl = process.env.E2E_APP_URL ?? "http://127.0.0.1:4173";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./artifacts/test-results",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI
    ? [["line"], ["html", { outputFolder: "artifacts/report", open: "never" }]]
    : [["list"], ["html", { outputFolder: "artifacts/report", open: "never" }]],
  use: {
    baseURL: appUrl,
    locale: "vi-VN",
    timezoneId: "Asia/Ho_Chi_Minh",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "allow",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1024 } },
    },
    {
      name: "mobile-card-chromium",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
});
