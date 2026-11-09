// The existing online Store entry is used only for two-session acceptance.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
process.env.VITE_STORE_APP_MOCK = 'false';
process.env.VITE_KPH_ONLINE = 'true';
const server = await createServer({
  root: `${root}apps/store-pwa`, configFile: `${root}apps/store-pwa/vite.config.ts`,
  server: { host: '127.0.0.1', port: 4173, strictPort: true, proxy: { '/api': 'http://127.0.0.1:8082' } },
});
await server.listen();
server.printUrls();
