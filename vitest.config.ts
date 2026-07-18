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
    // PR B: disable file-parallelism. The project shares a single Prisma
    // client + SQLite test.db across all test files; running them in
    // parallel causes cross-file state bleed (one file's beforeEach
    // wipe races with another file's beforeAll session prime). Forks
    // pool with per-file DBs would be the proper fix, but is out of
    // scope for PR B. See roadmap-and-sprints/issues for the follow-up.
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
      "@milestones": resolve(process.cwd(), "src/modules/milestones"),
      "@shared": resolve(process.cwd(), "src/modules/shared"),
      "@config": resolve(process.cwd(), "src/config"),
    },
  },
});
