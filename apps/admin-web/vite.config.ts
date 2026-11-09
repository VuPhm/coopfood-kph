import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174, strictPort: true, headers: { "Cache-Control": "no-store" }, proxy: { "/api": "http://127.0.0.1:8081" } },
  preview: { strictPort: true, headers: { "Cache-Control": "no-store" }, proxy: { "/api": "http://127.0.0.1:8081" } },
});
