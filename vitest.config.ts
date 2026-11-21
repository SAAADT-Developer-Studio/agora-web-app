import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so tests don't boot the Cloudflare/React Router plugins.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["app/**/*.test.ts", "app/**/*.test.tsx"],
  },
});
