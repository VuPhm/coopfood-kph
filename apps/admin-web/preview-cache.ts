import type { Plugin, ViteDevServer } from "vite";

// Ports reused from the Pilot can still be controlled by its root /sw.js.
// Admin has no offline worker. Retire that registration without deleting any
// IndexedDB, localStorage, cookies, or CacheStorage data on the shared origin.
const retirePilotWorker = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim();
  const windows = await self.clients.matchAll({ type: 'window' });
  await self.registration.unregister();
  await Promise.allSettled(windows.map(client => client.navigate(client.url)));
})()));
`;

export function adminPreviewCache(): Plugin {
  const configure = (server: Pick<ViteDevServer, "middlewares">) => {
    server.middlewares.use((request, response, next) => {
      // Only local Admin serving; this plugin has no build/output hook.
      if (!("url" in request) || typeof request.url !== "string" || request.url.split("?")[0] !== "/sw.js") return next();
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/javascript; charset=utf-8");
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Service-Worker-Allowed", "/");
      response.end(retirePilotWorker);
    });
  };
  return { name: "admin-preview-cache", configureServer: configure, configurePreviewServer: configure };
}
