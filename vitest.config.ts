import { defineConfig } from "vitest/config";

/**
 * Unit tests only. The app Vite config loads the Cloudflare and React Router
 * plugins, which these tests do not need.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
