// Browser interaction check for R2-02 against fixture responses. No operational data is stored.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const session = JSON.parse(readFileSync('contracts/fixtures/api/session.json'));
const history = JSON.parse(readFileSync('contracts/fixtures/api/kph-page.json'));
const baseURL = process.env.R2_CREATE_URL || 'http://127.0.0.1:4176';
const output = 'docs/delivery/r2-02-kph-create';
const png = readFileSync('apps/store-pwa/public/icons/android-chrome-192x192.png');

function replyRecord(kind, count) {
  const template = history.items[0];
  return {
    ...template,
    id: `40000000-0000-4000-8000-0000000000${kind === 'TPCN' ? '91' : '92'}`,
    type: kind,
    barcode: kind === 'TPCN' ? 'FOUND-CREATE' : 'RETRY-CREATE',
    lookupStatus: kind === 'TPCN' ? 'FOUND' : 'NOT_FOUND',
    catalogSnapshot: kind === 'TPCN' ? template.catalogSnapshot : {
      skuCode: null, productName: 'Rau kiểm thử R2-02', supplierCode: null, supplierName: 'NCC nhập tay',
    },
    photos: Array.from({ length: count }, (_, index) => ({
      ordinal: index + 1,
      stampedContentPath: `/api/v1/stores/${template.store.id}/kph/40000000-0000-4000-8000-000000000092/photos/${index + 1}`,
      capturedAt: '2026-09-24T14:00:00+07:00',
    })),
  };
}

async function runViewport(browser, name, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce', timezoneId: 'Asia/Ho_Chi_Minh' });
  const pageErrors = [];
  const posts = [];
  let retryLookups = 0;
  let submittedKind = 'TPCN';
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path.endsWith('/auth/session')) return route.fulfill({ json: session });
    if (request.method() === 'GET' && path.endsWith('/kph')) return route.fulfill({ json: history });
    if (request.method() === 'GET' && path.includes('/catalog/barcodes/')) {
      const code = decodeURIComponent(path.split('/').pop());
      if (code === 'FOUND-CREATE') return route.fulfill({ json: {
        status: 'FOUND', barcode: code,
        product: { id: '30000000-0000-4000-8000-000000000001', barcode: code, skuCode: 'SKU-000042', name: 'Sản phẩm thử nghiệm 01', primarySupplier: { code: 'NCC-0007', name: 'NCC Demo' } },
      } });
      if (code === 'RETRY-CREATE' && ++retryLookups === 1) return route.fulfill({ status: 503, json: { status: 503, code: 'CATALOG_UNAVAILABLE', detail: 'The published catalog is not ready for lookup.' } });
      return route.fulfill({ json: { status: 'NOT_FOUND', barcode: code } });
    }
    if (request.method() === 'POST' && path.endsWith('/kph')) {
      posts.push({ key: request.headers()['idempotency-key'], body: request.postDataBuffer()?.toString('utf8') || '' });
      return route.fulfill({ status: 201, json: replyRecord(submittedKind, submittedKind === 'TPCN' ? 1 : 3) });
    }
    if (path.includes('/photos/')) return route.fulfill({ contentType: 'image/png', body: png });
    return route.fulfill({ status: 404, json: { detail: 'Synthetic R2-02 route unavailable.' } });
  });

  try {
    await page.goto(baseURL);
    const shell = page.getByRole('region', { name: 'Store App' });
    await shell.waitFor();
    const pwaDismiss = page.getByRole('button', { name: 'Đóng thông báo PWA' });
    if (await pwaDismiss.isVisible()) await pwaDismiss.click();

    await shell.getByRole('button', { name: /Tạo phiếu TP khô/ }).click();
    let dialog = page.getByRole('dialog', { name: /Tạo phiếu KPH/ });
    await dialog.getByRole('button', { name: 'Quét mã barcode' }).click();
    await page.getByRole('button', { name: 'Nhập mã thủ công' }).click();
    await dialog.getByRole('textbox', { name: 'Mã SKU / UPC' }).fill('FOUND-CREATE');
    await dialog.getByRole('textbox', { name: 'Mã SKU / UPC' }).press('Tab');
    await dialog.getByText(/FOUND · Sản phẩm/).waitFor();
    assert.notEqual(await dialog.getByRole('textbox', { name: 'Tên hàng hóa' }).getAttribute('readonly'), null);
    await dialog.locator('input[type="file"]').last().setInputFiles({ name: 'first.png', mimeType: 'image/png', buffer: png });
    await dialog.getByText(/Đã xử lý 1\/3 ảnh/).waitFor();
    await dialog.getByRole('button', { name: 'Xem lại trước khi gửi' }).click();
    const foundReview = dialog.getByRole('region', { name: 'Xem lại trước khi gửi' });
    await foundReview.waitFor();
    assert.equal(posts.length, 0, 'review must not submit');
    assert.match(await foundReview.innerText(), /FOUND/);
    await foundReview.getByRole('button', { name: 'Xem lại ảnh 1: first.png' }).click();
    const foundViewer = page.getByRole('dialog', { name: 'Xem ảnh minh chứng' });
    await foundViewer.waitFor();
    assert.ok(await foundViewer.locator('img').evaluate(image => image.naturalWidth > 0));
    await foundViewer.getByRole('button', { name: 'Đóng' }).click();
    await foundViewer.waitFor({ state: 'hidden' });
    await page.screenshot({ path: `${output}/${name}-found-review.png`, fullPage: false });
    await dialog.getByRole('button', { name: 'Gửi phiếu' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(posts.length, 1);
    assert.ok(posts[0].key);
    assert.ok(posts[0].body.includes('first.png'));

    submittedKind = 'TPTS';
    await shell.getByRole('button', { name: /Tạo phiếu TP tươi/ }).click();
    dialog = page.getByRole('dialog', { name: /Tạo phiếu KPH/ });
    await dialog.getByRole('textbox', { name: 'Mã SKU / UPC' }).fill('RETRY-CREATE');
    await dialog.getByRole('textbox', { name: 'Mã SKU / UPC' }).press('Tab');
    await dialog.getByText(/CATALOG_UNAVAILABLE · Danh mục/).waitFor();
    assert.equal(await dialog.getByText(/NOT_FOUND · Nhập/).count(), 0);
    await dialog.getByRole('button', { name: 'Thử tra cứu lại' }).click();
    await dialog.getByText(/NOT_FOUND · Nhập/).waitFor();
    await dialog.getByRole('textbox', { name: 'Tên hàng hóa' }).fill('Rau kiểm thử R2-02');
    await dialog.getByRole('textbox', { name: 'Nhà cung cấp' }).fill('NCC nhập tay');
    await dialog.locator('input[type="file"]').last().setInputFiles(['second.png', 'third.png', 'fourth.png'].map(fileName => ({ name: fileName, mimeType: 'image/png', buffer: png })));
    await dialog.getByText(/Đã xử lý 3\/3 ảnh/).waitFor();
    await dialog.getByRole('button', { name: 'Xem lại trước khi gửi' }).click();
    const missReview = dialog.getByRole('region', { name: 'Xem lại trước khi gửi' });
    await missReview.waitFor();
    assert.equal(posts.length, 1);
    assert.match(await missReview.innerText(), /NOT_FOUND/);
    const order = await missReview.getByRole('button', { name: /Xem lại ảnh/ }).evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
    assert.deepEqual(order, ['Xem lại ảnh 1: second.png', 'Xem lại ảnh 2: third.png', 'Xem lại ảnh 3: fourth.png']);
    await missReview.getByRole('button', { name: 'Xem lại ảnh 2: third.png' }).click();
    const missViewer = page.getByRole('dialog', { name: 'Xem ảnh minh chứng' });
    await missViewer.waitFor();
    assert.ok(await missViewer.locator('img').evaluate(image => image.naturalWidth > 0));
    await missViewer.getByRole('button', { name: 'Đóng' }).click();
    await missViewer.waitFor({ state: 'hidden' });
    await page.screenshot({ path: `${output}/${name}-not-found-review.png`, fullPage: false });
    await dialog.getByRole('button', { name: 'Gửi phiếu' }).click();
    await dialog.waitFor({ state: 'hidden' });
    assert.equal(posts.length, 2);
    assert.ok(posts[1].key);
    assert.ok(posts[1].body.indexOf('second.png') < posts[1].body.indexOf('third.png'));
    assert.ok(posts[1].body.indexOf('third.png') < posts[1].body.indexOf('fourth.png'));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
    assert.deepEqual(pageErrors, []);
    console.log(`PASS ${name} ${width}×${height}: scan/manual, FOUND, unavailable recovery, NOT_FOUND, ordered photos, review and submit`);
  } finally {
    await page.close();
  }
}

(async () => {
  assert.equal(new URL(baseURL).hostname, '127.0.0.1');
  const browser = await chromium.launch();
  try {
    await runViewport(browser, 'phone', 390, 844);
    await runViewport(browser, 'desktop', 1440, 1000);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
