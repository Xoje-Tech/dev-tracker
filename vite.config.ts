import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  root: resolve(process.cwd(), "src/client"),
  resolve: {
    alias: {
      "@client/auth": resolve(process.cwd(), "src/client/modules/auth"),
      "@client/board": resolve(process.cwd(), "src/client/modules/board"),
      "@client/projects": resolve(process.cwd(), "src/client/modules/projects"),
      "@client/shared": resolve(process.cwd(), "src/client/modules/shared"),
      "@client/tags": resolve(process.cwd(), "src/client/modules/tags"),
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
    outDir: resolve(process.cwd(), "dist/client"),
    emptyOutDir: true,
  },
});
