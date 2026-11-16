// Real Fresh + Spring/PostgreSQL acceptance runtime. No business API mocks or DB reset.
const { chromium, expect } = require('@playwright/test');
const ExcelJS = require('exceljs');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { randomUUID, createHash } = require('node:crypto');
const path = require('node:path');

const base = (process.env.STORE_URL || 'http://127.0.0.1:4176').replace(/\/$/, '');
const store = '73000000-0000-4000-8000-000000000001';
const outside = '73000000-0000-4000-8000-000000000002';
const employee = '71000000-0000-4000-8000-000000000003';
const password = 'admin-e2e-password'; // Synthetic acceptance account only.
const output = '.local/verification/kphon04-review-export';
const contextOptions = { locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' };
const results = [];
const api = suffix => `${base}/api/v1${suffix}`;
const exact = name => ({ name, exact: true });

async function apiSession(context, username) {
  const response = await context.request.post(api('/auth/login'), { data: { username, password } });
  assert.equal(response.status(), 200, `Login ${username}: ${await response.text()}`);
  return response.json();
}
async function session(context) {
  const response = await context.request.get(api('/auth/session'));
  assert.equal(response.status(), 200);
  return response.json();
}
async function selectStore(page) {
  await page.getByRole('button', { name: /^001 ·/ }).click();
  await expect(page.getByRole('button', exact('Tài khoản'))).toBeVisible();
  await page.evaluate(() => { location.hash = 'kph'; });
  await expect(page.locator('.store-online-kph[aria-label="Phiếu KPH"]')).toBeVisible();
}
async function login(page, username = 'region.admin03') {
  await page.goto(base);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', exact('Đăng nhập')).click();
  await selectStore(page);
}
async function history(context, query = '') {
  const response = await context.request.get(api(`/stores/${store}/kph?type=TPTS&page=1&pageSize=25${query}`));
  assert.equal(response.status(), 200);
  return response.json();
}
async function refresh(page) {
  const response = page.waitForResponse(r => r.url().endsWith('/api/v1/kph/stores'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await response;
  await expect(page.locator('.store-online-kph[aria-label="Phiếu KPH"]')).toBeVisible();
}
async function create(context, title, date, png) {
  const identity = await session(context);
  const response = await context.request.post(api(`/stores/${store}/kph`), {
    headers: { 'X-CSRF-TOKEN': identity.csrfToken, 'Idempotency-Key': `kphon04-${randomUUID()}` },
    multipart: {
      payload: { name: 'payload.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({
        type: 'TPTS', detectedDate: date, quantity: 1, unit: 'EA', condition: 'BRUISED_WATERLOGGED', resolution: 'CANCEL',
        manualProductName: title, manualSkuCode: '000004', manualSupplierName: 'NCC tổng hợp',
      })) },
      photos: { name: 'synthetic-evidence.png', mimeType: 'image/png', buffer: png },
    },
  });
  assert.equal(response.status(), 201, await response.text());
  return response.json();
}
async function detail(page, title) {
  await page.getByRole('button', exact(`Mở phiếu ${title}`)).click();
  return page.getByRole('dialog', exact('Phiếu KPH'));
}
async function closeDetail(page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', exact('Phiếu KPH'))).toHaveCount(0);
}
async function review(page, record, label, status) {
  const sheet = await detail(page, record.catalogSnapshot.productName);
  const response = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${record.id}/approval`));
  await sheet.getByRole('button', exact(label)).click();
  const result = await response;
  assert.equal(result.status(), 200, await result.text());
  const updated = await result.json();
  assert.equal(updated.approvalStatus, status);
  assert.equal(updated.reviewedBy.displayName, 'Quản lý vùng Nam mẫu');
  await expect(page.getByText(status === 'APPROVED' ? 'Đã duyệt phiếu' : 'Đã ghi nhận không duyệt', { exact: true })).toBeVisible();
  if (await sheet.isVisible()) await closeDetail(page);
  return updated;
}
async function selection(page, titles) {
  const choose = page.getByRole('button', exact('Chọn'));
  if (await choose.count()) await choose.click();
  for (const title of titles) await page.getByRole('checkbox', exact(`Chọn ${title}`)).check();
}
async function checkedRecordCount(page) {
  return page.getByRole('checkbox', { name: /^Chọn (?!tất cả)/ }).evaluateAll(inputs => inputs.filter(i => i.checked).length);
}
async function noSelection(page) {
  await expect.poll(() => checkedRecordCount(page)).toBe(0);
}
async function layout(page, name, width) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: horizontal overflow`);
  // Assert access to the responsive workspace; visual composition belongs to owner review.
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('button', exact('Tạo phiếu TP tươi sống'))).toBeVisible();
  await expect(page.getByRole('button', exact('Xuất Excel'))).toBeVisible();
  if (width >= 900) {
    await expect(page.locator('.fresh-desktop-sidebar')).toBeVisible();
    await expect(page.locator('.store-desktop-page-heading h1')).toBeVisible();
  }
  await page.screenshot({ path: `${output}/${name}.png` });
}
async function workbook(download, approved, stampedBytes, name) {
  const file = path.resolve(output, `${name}.xlsx`);
  await download.saveAs(file);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(readFileSync(file));
  const sheet = book.getWorksheet('Thực phẩm tươi sống');
  assert.ok(sheet); assert.equal(sheet.pageSetup.orientation, 'landscape');
  assert.equal(sheet.getCell('D9').value, approved.catalogSnapshot.productName);
  assert.equal(sheet.getCell('R9').value, 'Quản lý vùng Nam mẫu');
  assert.equal(sheet.getCell('D10').value, null, 'Only the selected approved record enters workbook');
  const images = sheet.getImages(); assert.equal(images.length, 1);
  const embedded = book.getImage(images[0].imageId);
  const bytes = embedded.buffer ? Buffer.from(embedded.buffer) : Buffer.from(embedded.base64.split(',').pop(), 'base64');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), createHash('sha256').update(stampedBytes).digest('hex'));
}

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  let activePage;
  try {
    for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1024]]) {
      const context = await browser.newContext({ ...contextOptions, viewport: { width, height }, acceptDownloads: true });
      const page = await context.newPage(); activePage = page;
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await login(page);
      // Read the actual business date shown by the create flow, without altering its draft or submitting it.
      await page.getByRole('button', exact('Tạo phiếu TP tươi sống')).click();
      const displayDate = await page.getByRole('textbox', exact('Ngày phát hiện')).inputValue();
      const date = displayDate.split('/').reverse().join('-');
      await page.keyboard.press('Escape');
      const png = Buffer.from(await page.evaluate(() => {
        const canvas = document.createElement('canvas'); canvas.width = 320; canvas.height = 180;
        const drawing = canvas.getContext('2d'); drawing.fillStyle = '#17854a'; drawing.fillRect(0, 0, 320, 180);
        drawing.fillStyle = 'white'; drawing.font = '24px sans-serif'; drawing.fillText('SYNTHETIC KPHON04', 12, 55);
        return canvas.toDataURL('image/png').split(',')[1];
      }), 'base64');
      const prefix = `KPHON04 ${name} ${Date.now()}`;
      const approved = await create(context, `${prefix} approved`, date, png);
      const rejected = await create(context, `${prefix} rejected`, date, png);
      const pending = await create(context, `${prefix} pending`, date, png);
      await page.reload(); await selectStore(page);
      await review(page, approved, 'Duyệt phiếu', 'APPROVED');
      await review(page, rejected, 'Không duyệt', 'REJECTED');
      await page.reload(); await selectStore(page);
      const persisted = await history(context);
      assert.equal(persisted.items.find(r => r.id === approved.id).approvalStatus, 'APPROVED');
      assert.equal(persisted.items.find(r => r.id === rejected.id).approvalStatus, 'REJECTED');
      assert.equal(persisted.items.find(r => r.id === approved.id).reviewedBy.displayName, 'Quản lý vùng Nam mẫu');
      const sheet = await detail(page, approved.catalogSnapshot.productName);
      await expect(sheet.getByText('Quản lý vùng Nam mẫu', { exact: true }).last()).toBeVisible();
      await page.screenshot({ path: `${output}/${name}-reviewed.png` }); await closeDetail(page);
      await selection(page, [approved.catalogSnapshot.productName, pending.catalogSnapshot.productName]);
      await page.getByRole('button', exact('Xuất Excel')).click();
      const exportResponse = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/kph/exports'));
      const downloadPromise = page.waitForEvent('download');
      await page.getByRole('dialog', exact('Xuất Excel')).getByRole('button', exact('Tải xuống')).click();
      const response = await exportResponse; assert.equal(response.status(), 200, await response.text());
      assert.deepEqual(response.request().postDataJSON().recordIds, [approved.id]);
      const bundle = await response.json(); assert.deepEqual(bundle.records.map(r => r.id), [approved.id]);
      const stampedResponse = await context.request.get(base + bundle.records[0].photos[0].stampedContentPath);
      assert.equal(stampedResponse.status(), 200); assert.match(stampedResponse.headers()['cache-control'], /private/);
      await workbook(await downloadPromise, approved, await stampedResponse.body(), name);
      if (await page.getByRole('dialog', exact('Xuất Excel')).isVisible()) await page.keyboard.press('Escape');
      await layout(page, `${name}-exported`, width);
      // Owner17/11: append keeps selection; changing type/filter still clears it.
      await selection(page, [pending.catalogSnapshot.productName]);
      assert.ok(persisted.totalPages >= 2, 'Acceptance fixture must contain at least 26 TPTS records for D01 page gate');
      const loaded = await page.locator('[data-record-id]').count();
      await page.getByRole('button', { name: /Hiển thị thêm/ }).click();
      await expect.poll(() => page.locator('[data-record-id]').count()).toBeGreaterThan(loaded);
      await expect(page.getByRole('checkbox', exact(`Chọn ${pending.catalogSnapshot.productName}`))).toBeChecked();
      await selection(page, [pending.catalogSnapshot.productName]);
      await page.getByRole('button', { name: /TP khô & khác/ }).filter({ has: page.locator('small') }).click(); await noSelection(page);
      await page.getByRole('button', { name: /TP tươi sống/ }).filter({ has: page.locator('small') }).click(); await noSelection(page);
      await selection(page, [pending.catalogSnapshot.productName]);
      await page.getByRole('button', exact('Lọc phiếu KPH')).click();
      await page.getByLabel('Trạng thái', { exact: true }).selectOption('APPROVED');
      await page.getByRole('dialog', exact('Lọc & sắp xếp')).getByRole('button', exact('Xong')).click();
      await noSelection(page);
      // These HTTP guards do not depend on viewport. Keep them once, against real API/media.
      if (name === 'desktop') {
        assert.equal((await context.request.put(api(`/stores/${outside}/kph/${approved.id}/approval`), {
          headers: { 'X-CSRF-TOKEN': (await session(context)).csrfToken }, data: { status: 'APPROVED' },
        })).status(), 403);
        assert.equal((await context.request.post(api(`/stores/${outside}/kph/exports`), {
          headers: { 'X-CSRF-TOKEN': (await session(context)).csrfToken }, data: { type: 'TPTS', recordIds: [approved.id] },
        })).status(), 403);
        const anon = await browser.newContext();
        assert.equal((await anon.request.get(base + approved.photos[0].stampedContentPath)).status(), 401); await anon.close();
        results.push({ scenario: 'http-scope-and-private-media', result: 'PASS',
          checks: ['cross-region review403', 'cross-region export403', 'anonymous stamped media401'] });
      }
      assert.deepEqual(errors, []);
      results.push({ viewport: name, result: 'PASS', approved: approved.id, rejected: rejected.id,
        checks: ['APPROVED/REJECTED persisted with inherited reviewer', 'append preserves selection; tab/filter selection reset', 'only selected approved record exported', 'BM-331.CF approver R and private stamped image bytes', 'responsive workspace controls', 'no overflow/pageerror'] });
      await context.close(); activePage = undefined;
    }

    // A real two-session downgrade rejects stale privileged controls at the next business request.
    const admin = await browser.newContext(contextOptions);
    const adminSession = await apiSession(admin, 'chain.admin03');
    const members = await admin.request.get(api(`/admin/stores/${store}/memberships`)); assert.equal(members.status(), 200);
    const original = (await members.json()).find(row => row.userId === employee);
    assert.ok(original, 'Synthetic employee membership must already exist so its state can be restored');
    const membershipUrl = api(`/admin/stores/${store}/memberships/${employee}`);
    const changeRole = async role => {
      const response = await admin.request.put(membershipUrl, { headers: { 'X-CSRF-TOKEN': adminSession.csrfToken }, data: { role, reason: 'KPHON04 synthetic downgrade verification' } });
      assert.equal(response.status(), 200, await response.text());
    };
    const context = await browser.newContext({ ...contextOptions, viewport: { width: 390, height: 844 }, acceptDownloads: true });
    const page = await context.newPage(); activePage = page;
    try {
      await changeRole('EMPLOYEE'); await login(page, 'employee.admin03');
      await expect(page.getByRole('button', exact('Chọn'))).toHaveCount(0);
      const first = (await history(context)).items[0];
      const sheet = await detail(page, first.catalogSnapshot.productName);
      await expect(sheet.getByRole('button', exact('Duyệt phiếu'))).toHaveCount(0);
      await expect(sheet.getByRole('button', exact('Không duyệt'))).toHaveCount(0);
      const employeeSession = await session(context);
      assert.equal((await context.request.put(api(`/stores/${store}/kph/${first.id}/approval`), { headers: { 'X-CSRF-TOKEN': employeeSession.csrfToken }, data: { status: 'APPROVED' } })).status(), 403);
      assert.equal((await context.request.post(api(`/stores/${store}/kph/exports`), { headers: { 'X-CSRF-TOKEN': employeeSession.csrfToken }, data: { type: 'TPTS', recordIds: [first.id] } })).status(), 403);
      await closeDetail(page);
      await changeRole('STORE_MANAGER'); await refresh(page);
      const stale = await detail(page, first.catalogSnapshot.productName);
      await expect(stale.getByRole('button', exact('Duyệt phiếu'))).toBeVisible();
      await changeRole('EMPLOYEE');
      const denied = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${first.id}/approval`));
      await stale.getByRole('button', exact('Duyệt phiếu')).click(); assert.equal((await denied).status(), 403);
      await expect(page.getByRole('button', exact('Duyệt phiếu'))).toHaveCount(0);
      await expect(page.getByRole('button', exact('Chọn'))).toHaveCount(0);
      await page.screenshot({ path: `${output}/employee-downgraded.png` });
      if (await page.getByRole('dialog', exact('Phiếu KPH')).isVisible()) await closeDetail(page);
      await changeRole('STORE_MANAGER'); await refresh(page);
      const approved = (await history(context)).items.find(record => record.approvalStatus === 'APPROVED');
      assert.ok(approved, 'An approved fixture created above must be present on the current page');
      await selection(page, [approved.catalogSnapshot.productName]);
      await page.getByRole('button', exact('Xuất Excel')).click();
      await changeRole('EMPLOYEE');
      const downloads = []; page.on('download', file => downloads.push(file));
      const deniedExport = page.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/kph/exports'));
      await page.getByRole('dialog', exact('Xuất Excel')).getByRole('button', exact('Tải xuống')).click();
      assert.equal((await deniedExport).status(), 403);
      await expect(page.getByRole('button', exact('Chọn'))).toHaveCount(0);
      await expect(page.getByRole('dialog', exact('Xuất Excel'))).toHaveCount(0);
      assert.equal(downloads.length, 0, 'A stale export must not download a workbook');
      await refresh(page); // Finish the 403-triggered scope revalidation before expiring its session.
      const identity = await session(context);
      assert.equal((await context.request.post(api('/auth/logout'), { headers: { 'X-CSRF-TOKEN': identity.csrfToken } })).status(), 204);
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toBeVisible();
      await expect(page.getByRole('dialog', exact('Phiếu KPH'))).toHaveCount(0);
      results.push({ scenario: 'employee-and-next-request-downgrade', result: 'PASS', checks: ['employee has no review/export controls', 'forged employee review/export403', 'stale manager review/export403 after downgrade', 'no stale export download', 'privileged controls removed', 'expired session clears detail'] });
    } finally {
      await changeRole(original.role);
      if (!original.active) {
        const restored = await admin.request.post(membershipUrl + '/revoke', { headers: { 'X-CSRF-TOKEN': adminSession.csrfToken }, data: { reason: 'Restore synthetic membership after KPHON04 verification' } });
        assert.equal(restored.status(), 200, await restored.text());
      }
      await context.close(); await admin.close(); activePage = undefined;
    }
    writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
    console.log(JSON.stringify(results));
  } catch (error) {
    if (activePage && !activePage.isClosed()) await activePage.screenshot({ path: `${output}/failure.png`, fullPage: true }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
