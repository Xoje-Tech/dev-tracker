import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**"],
    setupFiles: ["../../tests/setup.ts"],
    globalSetup: ["../../tests/global-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@auth": resolve(__dirname, "src/modules/auth"),
      "@projects": resolve(__dirname, "src/modules/projects"),
      "@boards": resolve(__dirname, "src/modules/boards"),
      "@tasks": resolve(__dirname, "src/modules/tasks"),
      "@tags": resolve(__dirname, "src/modules/tags"),
      "@shared": resolve(__dirname, "src/modules/shared"),
      "@config": resolve(__dirname, "src/config"),
    },
  },
});
