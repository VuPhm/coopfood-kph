// Fresh online create/private-media preview on canonical Store port4173; central backend8082.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
process.env.VITE_STORE_APP_MOCK = 'false';
process.env.VITE_STORE_APP_ONLINE = 'true';
process.env.VITE_KPH_ONLINE = 'true';
const server = await createServer({
  root: `${root}apps/store-pwa`, configFile: `${root}apps/store-pwa/vite.config.ts`,
  server: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8082' } },
});
await server.listen();
server.printUrls();
