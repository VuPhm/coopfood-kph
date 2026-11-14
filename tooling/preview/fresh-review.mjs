#!/usr/bin/env node
// Local review only. Backend and synthetic data are managed separately.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const options = { adminPort: 4175, store: 'off', storePort: 4180, api: 'http://127.0.0.1:8082' };
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--help') {
    console.log('Usage: node tooling/preview/fresh-review.mjs [--admin-port 4175|off] [--store off|online|mock] [--store-port 4180] [--api http://127.0.0.1:8082]');
    process.exit(0);
  }
  const key = { '--admin-port': 'adminPort', '--store': 'store', '--store-port': 'storePort', '--api': 'api' }[arg];
  if (!key || !args[i + 1]) throw new Error(`Unknown or incomplete option: ${arg}`);
  options[key] = args[++i];
}
for (const key of ['adminPort', 'storePort']) {
  if (key === 'adminPort' && options[key] === 'off') continue;
  options[key] = Number(options[key]);
  if (!Number.isInteger(options[key]) || options[key] < 1 || options[key] > 65535) throw new Error(`Invalid ${key}`);
}
if (options.adminPort === 'off' && options.store === 'off') throw new Error('Select Admin or a Store entry');
if (!['off', 'online', 'mock'].includes(options.store)) throw new Error('Store must be off, online, or mock');
const api = new URL(options.api);
if (!['http:', 'https:'].includes(api.protocol) || !['127.0.0.1', 'localhost', '::1', '[::1]'].includes(api.hostname) || api.pathname !== '/' || api.search || api.hash || api.username || api.password) {
  throw new Error('API must be a local HTTP(S) origin');
}
process.env.ADMIN_API_TARGET = api.origin;
process.env.VITE_STORE_APP_MOCK = String(options.store === 'mock');
process.env.VITE_STORE_APP_ONLINE = String(options.store === 'online');

const servers = [];
async function start(app, port) {
  const root = path.join(repo, 'apps', app);
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), configLoader: 'runner', envDir: root,
    server: { host: '127.0.0.1', port, strictPort: true, proxy: { '/api': api.origin } } });
  servers.push(server);
  await server.listen();
  return server;
}
async function close() { await Promise.all(servers.map(server => server.close())); }
try {
  if (options.adminPort !== 'off') await start('admin-web', options.adminPort);
  if (options.store !== 'off') await start('store-pwa', options.storePort);
  const probePort = options.adminPort === 'off' ? options.storePort : options.adminPort;
  const response = await fetch(`http://127.0.0.1:${probePort}/api/v1/auth/session`, { signal: AbortSignal.timeout(5000) });
  if (response.status !== 401) throw new Error(`Session probe expected HTTP 401, received ${response.status}; check backend at ${api.origin}`);
  if (options.adminPort !== 'off') console.log(`Admin: http://127.0.0.1:${options.adminPort}/ (localhost: http://localhost:${options.adminPort}/)`);
  if (options.store !== 'off') console.log(`Store ${options.store}: http://127.0.0.1:${options.storePort}/ (localhost: http://localhost:${options.storePort}/)`);
  console.log(`API proxy: ${api.origin}; anonymous session: HTTP 401`);
  console.log('Stop with Ctrl+C. No backend or database was started or changed.');
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void close().finally(() => process.exit(0)); });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  await close();
  process.exitCode = 1;
}
