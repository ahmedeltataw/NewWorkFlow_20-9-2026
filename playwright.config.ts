import { defineConfig } from "@playwright/test";

const SERVER_URL = "http://localhost:3000";

const viewports = [
  { name: "320px", width: 320, height: 640 },
  { name: "768px", width: 768, height: 1024 },
  { name: "1024px", width: 1024, height: 768 },
  { name: "1440px", width: 1440, height: 900 },
];

const languages = [
  { tag: "en", name: "English", locale: "en" },
  { tag: "ar", name: "Arabic", locale: "ar" },
];

const projects = viewports.flatMap(({ name, width, height }) =>
  languages.map(({ tag, locale }) => ({
    name: `${name}-${tag}`,
    use: {
      baseURL: SERVER_URL,
      locale,
      viewport: { width, height },
      storageState: {
        cookies: [
          {
            name: "locale",
            value: locale,
            domain: "localhost",
            path: "/",
            expires: -1,
            httpOnly: false,
            secure: false,
            sameSite: "Lax" as const,
          },
        ],
        origins: [],
      },
    },
  })),
);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [["line"]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start",
    env: { NEXT_PUBLIC_API_MOCKING: "enabled" },
    url: SERVER_URL,
    timeout: 240_000,
    reuseExistingServer: !process.env.CI,
  },
  projects,
});
