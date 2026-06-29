import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@client": resolve(process.cwd(), "src/client"),
      "@client/auth": resolve(process.cwd(), "src/client/modules/auth"),
      "@client/shared": resolve(process.cwd(), "src/client/modules/shared"),
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
    outDir: "dist/client",
  },
});
