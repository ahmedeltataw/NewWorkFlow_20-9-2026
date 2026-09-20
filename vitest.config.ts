import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000/",
        pretendToBeVisual: true,
      },
    },
  },
});
