import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["tests/setup.ts"],
    fileParallelism: false,
    exclude: ["**/node_modules/**", "**/dist/**", "tests/e2e/**"],
  },
});
