// Dedicated localhost CHAIN01 runtime. Seed admin03-membership.sql then chain01-roles.sql.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const storeUrl = process.env.STORE_URL || 'http://127.0.0.1:4776';
const adminUrl = process.env.ADMIN_URL || 'http://127.0.0.1:4775';
for (const origin of [storeUrl, adminUrl]) {
  const url = new URL(origin);
  assert.ok(origin === url.origin && url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname), 'Expected a local synthetic runtime');
}
const storeA = '73000000-0000-4000-8000-000000000001';
const storeB = '73000000-0000-4000-8000-000000000002';
const storeRecords = id => storeUrl + '/api/v1/stores/' + id + '/kph';
const exact = name => ({ name, exact: true });
const reviewer = 'Quản lý cửa hàng mẫu';

async function login(browser, url, username, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' });
  await page.goto(url);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
  await page.getByRole('button', exact('Đăng nhập')).click();
  return page;
}

async function openStore(page) {
  await page.getByRole('button', { name: /^001 ·/ }).click();
  await expect(page.getByRole('button', exact('Tài khoản'))).toBeVisible();
  await page.evaluate(() => { location.hash = 'kph'; });
  await expect(page.getByRole('button', exact('Tạo phiếu TP tươi sống'))).toBeVisible();
}

async function storeDetail(page, record) {
  const row = page.locator('[data-record-id="' + record.id + '"]');
  await row.getByRole('button', exact('Mở phiếu ' + record.catalogSnapshot.productName)).click();
  return page.getByRole('dialog', exact('Phiếu KPH'));
}

async function sendEmployeeRecord(page, title, photo) {
  await page.getByRole('button', exact('Tạo phiếu TP tươi sống')).click();
  await page.getByLabel('Tên hàng hóa', { exact: true }).fill(title);
  await page.getByLabel('Chọn ảnh', { exact: true }).setInputFiles(photo);
  await expect(page.getByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
  await page.getByRole('button', exact('Xem lại')).click();
  const saved = page.waitForResponse(r => r.url() === storeRecords(storeA) && r.request().method() === 'POST');
  await page.getByRole('button', exact('Gửi phiếu')).click();
  const response = await saved;
  assert.equal(response.status(), 201);
  const record = await response.json();
  assert.equal(record.store.id, storeA);
  assert.equal(record.approvalStatus, 'PENDING');
  assert.equal(record.detectedBy.displayName, 'Nhân viên thử quyền');
  assert.equal(record.photos.length, 1);
  return record;
}

async function addStoreBRecord(managerB, token, date, title, photo) {
  const payload = { type: 'TPTS', detectedDate: date, quantity: 1, unit: 'EA',
    condition: 'BRUISED_WATERLOGGED', resolution: 'CANCEL', manualProductName: title };
  const response = await managerB.request.post(storeRecords(storeB), {
    headers: { 'Idempotency-Key': randomUUID(), 'X-CSRF-TOKEN': token },
    multipart: { payload: { name: 'payload.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(payload)) }, photos: photo },
  });
  assert.equal(response.status(), 201);
  return response.json();
}

async function checkMonitor(browser, username, record, outside, total) {
  const chain = username === 'chain.admin03';
  const page = await login(browser, adminUrl, username, chain ? 1440 : 390, chain ? 1024 : 844);
  if (!chain) await page.getByRole('button', exact('Mở điều hướng')).click();
  await page.getByRole('button', exact('Phiếu KPH')).click();
  await expect(page.getByText(total + ' phiếu', { exact: true })).toBeVisible();
  const filter = page.getByRole('combobox', exact('Cửa hàng'));
  await expect(filter.locator('option[value="' + storeA + '"]')).toHaveCount(1);
  await expect(filter.locator('option[value="' + storeB + '"]')).toHaveCount(chain ? 1 : 0);
  const outsideButton = page.getByRole('button', exact(outside.catalogSnapshot.productName));
  if (chain) await expect(outsideButton).toBeVisible();
  else await expect(outsideButton).toHaveCount(0);
  await page.getByRole('button', exact(record.catalogSnapshot.productName)).click();
  const detail = page.getByRole('dialog');
  await expect(detail.getByText(record.id, { exact: true })).toBeVisible();
  await expect(detail.getByText('Đã duyệt', { exact: true })).toBeVisible();
  await expect(detail.getByText(reviewer, { exact: true })).toBeVisible();
  await expect(detail.getByRole('button', { name: /duyệt/i })).toHaveCount(0);
  const image = detail.getByRole('img', exact('Ảnh minh chứng 1'));
  await expect.poll(() => image.evaluate(node => node.naturalWidth)).toBeGreaterThan(0);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.ok(await detail.evaluate(node => node.scrollWidth <= node.clientWidth));
  await page.close();
}

async function historyCount(request, storeId) {
  const response = await request.get(storeRecords(storeId));
  assert.equal(response.status(), 200);
  return (await response.json()).totalItems;
}

(async () => {
  const browser = await chromium.launch();
  try {
    const employee = await login(browser, storeUrl, 'employee.admin03', 390, 844);
    await openStore(employee);
    const manager = await login(browser, storeUrl, 'manager.admin03', 1440, 1024);
    await openStore(manager);
    const managerB = await browser.newContext();
    const loginB = await managerB.request.post(storeUrl + '/api/v1/auth/login', {
      data: { username: 'managerb.chain01', password: 'admin-e2e-password' },
    });
    assert.equal(loginB.status(), 200);
    const tokenB = (await loginB.json()).csrfToken;
    const [previousA, previousB] = await Promise.all([historyCount(employee.request, storeA), historyCount(managerB.request, storeB)]);
    const png = await employee.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 48;
      const context = canvas.getContext('2d');
      context.fillStyle = '#196237'; context.fillRect(0, 0, 64, 48);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const photo = { name: 'chain01-synthetic.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') };
    const title = 'CHAIN01 ' + randomUUID();
    const record = await sendEmployeeRecord(employee, title + ' A', photo);
    const outside = await addStoreBRecord(managerB, tokenB, record.detectedDate, title + ' B', photo);
    const denied = await managerB.request.put(storeRecords(storeA) + '/' + record.id + '/approval', {
      headers: { 'X-CSRF-TOKEN': tokenB }, data: { status: 'APPROVED' },
    });
    assert.equal(denied.status(), 403);
    await managerB.close();
    await manager.reload(); await openStore(manager);
    const detail = await storeDetail(manager, record);
    const review = manager.waitForResponse(r => r.url() === storeRecords(storeA) + '/' + record.id + '/approval' && r.request().method() === 'PUT');
    await detail.getByRole('button', exact('Duyệt phiếu')).click();
    const response = await review;
    assert.equal(response.status(), 200);
    const reviewed = await response.json();
    assert.equal(reviewed.id, record.id);
    assert.equal(reviewed.reviewedBy.displayName, reviewer);
    await employee.reload(); await openStore(employee);
    const result = await storeDetail(employee, record);
    await expect(result.getByText('Đã duyệt', { exact: true })).toBeVisible();
    await expect(result.getByText(reviewer, { exact: true })).toBeVisible();
    await expect(result.getByRole('button', { name: /duyệt/i })).toHaveCount(0);
    await checkMonitor(browser, 'region.admin03', record, outside, previousA + 1);
    await checkMonitor(browser, 'chain.admin03', record, outside, previousA + previousB + 2);
    console.log(JSON.stringify({ result: 'PASS', storeA: record.id, storeB: outside.id, status: reviewed.approvalStatus,
      managerBCrossStore: denied.status(), regionTotal: previousA + 1, chainTotal: previousA + previousB + 2 }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
