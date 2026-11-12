import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { adminPreviewCache } from "./preview-cache.js";

export default defineConfig(({ mode }) => {
  const apiTarget = loadEnv(mode, ".", "ADMIN_").ADMIN_API_TARGET ?? "http://127.0.0.1:8081";
  return {
    plugins: [adminPreviewCache(), react(), tailwindcss()],
    server: { port: 5174, strictPort: true, headers: { "Cache-Control": "no-store" }, proxy: { "/api": apiTarget } },
    preview: { strictPort: true, headers: { "Cache-Control": "no-store" }, proxy: { "/api": apiTarget } },
  };
});
