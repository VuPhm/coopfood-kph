import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Preview ports can retain a worker from an older Pilot or another local build.
// This is served only by Vite dev/preview, never written to a production build.
const retireWorker = `
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  await self.clients.claim();
  const windows = await self.clients.matchAll({ type: 'window' });
  await self.registration.unregister();
  await Promise.allSettled(windows.map(client => client.navigate(client.url)));
})()));
`;
const previewHead = `<meta name="coopfood-local-preview" content="fresh">
<script>
(() => {
  if (!('serviceWorker' in navigator)) return;
  const controlled = !!navigator.serviceWorker.controller;
  if (controlled) document.documentElement.style.visibility = 'hidden';
  navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .then(() => { if (controlled) location.reload(); })
    .catch(() => { document.documentElement.style.removeProperty('visibility'); });
})();
</script>`;
const addPreviewHead = (html) => html.replace(/<head(?:\s[^>]*)?>/i, head => `${head}\n${previewHead}`);

export function previewFreshness() {
  let config;
  return {
    name: "coopfood-preview-freshness",
    configResolved(resolved) { config = resolved; },
    config() { return { server: { headers: { "Cache-Control": "no-store" } }, preview: { headers: { "Cache-Control": "no-store" } } }; },
    transformIndexHtml(html) { return config.command === "serve" ? addPreviewHead(html) : html; },
    configureServer(server) { server.middlewares.use(workerMiddleware); },
    configurePreviewServer(server) {
      server.middlewares.use(workerMiddleware);
      server.middlewares.use((request, response, next) => {
        const pathname = (request.url ?? "").split("?")[0];
        if ((pathname === "/api" || pathname.startsWith("/api/")) || !["GET", "HEAD"].includes(request.method ?? "") || !request.headers.accept?.includes("text/html")) return next();
        const html = addPreviewHead(readFileSync(resolve(config.root, config.build.outDir, "index.html"), "utf8"));
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.setHeader("Cache-Control", "no-store");
        response.end(request.method === "HEAD" ? undefined : html);
      });
    },
  };
}

const workerMiddleware = (request, response, next) => {
  const pathname = (request.url ?? "").split("?")[0];
  if (pathname === "/api" || pathname.startsWith("/api/") || request.method !== "GET") return next();
  // The browser sends this header even for a registration at a nonstandard URL.
  // Normal JS/assets and business API requests keep their normal handlers.
  if (request.headers["service-worker"] !== "script" && pathname !== "/sw.js" && pathname !== "/dev-sw.js") return next();
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/javascript; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Service-Worker-Allowed", "/");
  response.end(retireWorker);
};
