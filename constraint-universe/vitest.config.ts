import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Keep tests deterministic and avoid tinypool recursion/stack issues
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Disable thread pool entirely
    fileParallelism: false,
    maxConcurrency: 1,

    // Most of our domain tests are pure TS and don't need jsdom.
    environment: "node",

    // Be explicit to avoid surprises in CI / local
    globals: true,

    // Reduce overhead
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
