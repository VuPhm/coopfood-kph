// Read-only fixture API for an interactive R2-01 shell preview. Never stores data.
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');

const session = readFileSync('contracts/fixtures/api/session.json');
const history = readFileSync('contracts/fixtures/api/kph-page.json');
const photo = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e9f5ed"/><text x="60" y="65" text-anchor="middle" fill="#006633" font-size="18">DEMO</text></svg>';

createServer((request, response) => {
  const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  if (request.method !== 'GET') {
    response.writeHead(501, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ detail: 'Synthetic shell preview: ghi dữ liệu không khả dụng.' }));
    return;
  }
  if (path === '/api/v1/auth/session') {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(session);
  } else if (path.endsWith('/kph')) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(history);
  } else if (path.endsWith('/photos/1')) {
    response.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    response.end(photo);
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ detail: 'Synthetic fixture route unavailable.' }));
  }
}).listen(8080, '127.0.0.1', () => {
  console.log('R2-01 synthetic read-only API: http://127.0.0.1:8080');
});
