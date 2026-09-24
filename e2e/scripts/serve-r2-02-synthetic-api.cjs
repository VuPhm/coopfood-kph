// R2-02 interactive preview only. Synthetic session/catalog and memory-only records.
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const { resolve, extname, sep } = require('node:path');

const session = JSON.parse(readFileSync('contracts/fixtures/api/session.json'));
const baseline = JSON.parse(readFileSync('contracts/fixtures/api/kph-page.json'));
const store = session.user.stores[0];
const records = [...baseline.items];
let unavailableOnce = true;
const dist = resolve('apps/store-pwa/dist');

function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}

function payloadFromMultipart(request, body) {
  const boundary = /boundary=([^;]+)/i.exec(request.headers['content-type'] || '')?.[1];
  if (!boundary) throw new Error('Multipart boundary missing');
  const parts = body.toString('latin1').split(`--${boundary}`);
  const payloadPart = parts.find(part => part.includes('name="payload"'));
  if (!payloadPart) throw new Error('Payload part missing');
  const start = payloadPart.indexOf('\r\n\r\n');
  const payload = JSON.parse(payloadPart.slice(start + 4).trim());
  const names = parts.filter(part => part.includes('name="photos"')).map(part => /filename="([^"]+)"/.exec(part)?.[1] || 'evidence.jpg');
  if (names.length < 1 || names.length > 3) throw new Error('One to three photos required');
  return { payload, names };
}

createServer(async (request, response) => {
  const url = new URL(request.url || '/', 'http://127.0.0.1');
  const path = url.pathname;
  if (request.method === 'GET' && path === '/api/v1/auth/session') return json(response, 200, session);
  if (request.method === 'GET' && path.includes('/catalog/barcodes/')) {
    const barcode = decodeURIComponent(path.split('/').pop());
    if (barcode === 'UNAVAILABLE-CREATE' && unavailableOnce) {
      unavailableOnce = false;
      return json(response, 503, { status: 503, code: 'CATALOG_UNAVAILABLE', detail: 'Synthetic catalog temporarily unavailable.' });
    }
    if (barcode === '0890123456789' || barcode === 'FOUND-CREATE') return json(response, 200, {
      status: 'FOUND', barcode,
      product: { id: '30000000-0000-4000-8000-000000000001', barcode, skuCode: 'SKU-000042', name: 'Sản phẩm thử nghiệm 01', primarySupplier: { code: 'NCC-0007', name: 'NCC Demo' } },
    });
    return json(response, 200, { status: 'NOT_FOUND', barcode });
  }
  if (request.method === 'GET' && path.endsWith('/kph')) {
    const page = Number(url.searchParams.get('page') || '1');
    const pageSize = Number(url.searchParams.get('pageSize') || '25');
    const type = url.searchParams.get('type');
    const filtered = type ? records.filter(record => record.type === type) : records;
    return json(response, 200, {
      items: filtered.slice((page - 1) * pageSize, page * pageSize), page, pageSize,
      totalItems: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
      typeTotals: { tpcn: records.filter(record => record.type === 'TPCN').length, tpts: records.filter(record => record.type === 'TPTS').length },
    });
  }
  if (request.method === 'GET' && path.includes('/photos/')) {
    response.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, no-store' });
    response.end('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="#e9f5ed"/><text x="150" y="106" text-anchor="middle" fill="#006633" font-size="24">SYNTHETIC</text></svg>');
    return;
  }
  if (request.method === 'POST' && path.endsWith('/kph')) {
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const { payload, names } = payloadFromMultipart(request, Buffer.concat(chunks));
      const id = randomUUID();
      const found = payload.barcode === '0890123456789' || payload.barcode === 'FOUND-CREATE';
      const record = {
        ...baseline.items[0], id, type: payload.type, detectedDate: payload.detectedDate,
        processedDate: payload.processedDate, quantity: payload.quantity, unit: payload.unit,
        condition: payload.condition, conditionDetail: payload.conditionDetail,
        resolution: payload.resolution, resolutionDetail: payload.resolutionDetail,
        barcode: payload.barcode, lookupStatus: payload.barcode ? found ? 'FOUND' : 'NOT_FOUND' : 'MANUAL',
        catalogSnapshot: found ? baseline.items[0].catalogSnapshot : {
          skuCode: payload.manualSkuCode || null, productName: payload.manualProductName || null,
          supplierCode: null, supplierName: payload.manualSupplierName || null,
        },
        note: payload.note, store: { id: store.id, code: store.code, name: store.name },
        detectedBy: { id: session.user.id, displayName: session.user.displayName },
        photos: names.map((_, index) => ({ ordinal: index + 1, stampedContentPath: `/api/v1/stores/${store.id}/kph/${id}/photos/${index + 1}`, capturedAt: new Date().toISOString() })),
        createdAt: new Date().toISOString(),
      };
      records.unshift(record);
      return json(response, 201, record);
    } catch (error) {
      return json(response, 400, { detail: error.message });
    }
  }
  if (request.method === 'GET' && !path.startsWith('/api/')) {
    const file = resolve(dist, `.${path === '/' ? '/index.html' : path}`);
    if (file !== dist && !file.startsWith(`${dist}${sep}`)) return json(response, 404, { detail: 'Not found' });
    try {
      const bytes = readFileSync(file);
      const contentType = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
      }[extname(file)] || 'application/octet-stream';
      response.writeHead(200, { 'Content-Type': contentType });
      response.end(bytes);
    } catch {
      const index = readFileSync(resolve(dist, 'index.html'));
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(index);
    }
    return;
  }
  return json(response, 501, { detail: 'Synthetic R2-02 preview: thao tác này không khả dụng.' });
}).listen(4177, '127.0.0.1', () => {
  console.log('R2-02 synthetic memory-only preview: http://127.0.0.1:4177');
});
