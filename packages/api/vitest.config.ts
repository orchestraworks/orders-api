import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    setupFiles: ["./test/setup.ts"],
    // Every test file truncates the same database, so files must not run in parallel.
    fileParallelism: false,
  },
});
