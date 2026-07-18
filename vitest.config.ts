import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["src/client/**", "node_modules/**"],
    setupFiles: ["./tests/setup.ts"],
    globalSetup: ["./tests/global-setup.ts"],
    // PR B set fileParallelism: false to prevent cross-file state bleed
    // in the shared Prisma client + test.db. PR C inherits this fix
    // (develop was merged with it). Removing this will reintroduce the
    // intermittent failures documented in PR #79.
    fileParallelism: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "src"),
      "@auth": resolve(process.cwd(), "src/modules/auth"),
      "@projects": resolve(process.cwd(), "src/modules/projects"),
      "@boards": resolve(process.cwd(), "src/modules/boards"),
      "@tasks": resolve(process.cwd(), "src/modules/tasks"),
      "@tags": resolve(process.cwd(), "src/modules/tags"),
      "@sprints": resolve(process.cwd(), "src/modules/sprints"),
      "@shared": resolve(process.cwd(), "src/modules/shared"),
      "@config": resolve(process.cwd(), "src/config"),
    },
  },
});
