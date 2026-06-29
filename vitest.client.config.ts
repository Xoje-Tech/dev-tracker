import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@client/auth": resolve(process.cwd(), "src/client/modules/auth"),
      "@client/board": resolve(process.cwd(), "src/client/modules/board"),
      "@client/projects": resolve(process.cwd(), "src/client/modules/projects"),
      "@client/shared": resolve(process.cwd(), "src/client/modules/shared"),
      "@client/tags": resolve(process.cwd(), "src/client/modules/tags"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/client/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
    },
  },
});
