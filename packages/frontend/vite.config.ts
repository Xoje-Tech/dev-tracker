import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [vue()],
  root: resolve(__dirname, "src/client"),
  resolve: {
    alias: {
      "@client/auth": resolve(__dirname, "src/client/modules/auth"),
      "@client/board": resolve(__dirname, "src/client/modules/board"),
      "@client/projects": resolve(__dirname, "src/client/modules/projects"),
      "@client/shared": resolve(__dirname, "src/client/modules/shared"),
      "@client/tags": resolve(__dirname, "src/client/modules/tags"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: resolve(__dirname, "dist/client"),
    emptyOutDir: true,
  },
});