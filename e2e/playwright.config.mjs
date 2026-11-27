// Playwright settings for e2e/astra.spec.mjs. The site must already run (npm start) against a test Supabase project.
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 60000,
  fullyParallel: false,
  use: { locale: "ru-RU", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
});
