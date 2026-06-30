import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@client/auth": resolve(__dirname, "src/client/modules/auth"),
      "@client/board": resolve(__dirname, "src/client/modules/board"),
      "@client/projects": resolve(__dirname, "src/client/modules/projects"),
      "@client/shared": resolve(__dirname, "src/client/modules/shared"),
      "@client/tags": resolve(__dirname, "src/client/modules/tags"),
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