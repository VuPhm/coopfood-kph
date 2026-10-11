import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command, mode }) => ({
  // Mobile implementation uses memory-only fixtures in dev until API wiring.
  // Production and an explicit VITE_STORE_APP_MOCK=false retain the online app.
  define: {
    "import.meta.env.VITE_STORE_APP_MOCK": JSON.stringify(loadEnv(mode, ".", "VITE_").VITE_STORE_APP_MOCK ?? (command === "serve" ? "true" : "false")),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: false,
      manifest: false,
      registerType: "prompt",
      workbox: {
        cleanupOutdatedCaches: true,
        globIgnores: ["demo/**"],
        // Include lazy chunks: first use of a form/export must also work offline
        // once installation completes. Cache static assets only, never API/record/photo data.
        globPatterns: ["**/*.{css,html,js,png,webp,svg,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "index.html",
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:8080" },
  },
  preview: { proxy: { "/api": "http://127.0.0.1:8080" } },
}));
