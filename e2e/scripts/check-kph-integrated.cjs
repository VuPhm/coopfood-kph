// One synthetic, real-backend journey across Admin and Fresh. No DB reset or business API mock.
const { chromium, expect } = require('@playwright/test');
const ExcelJS = require('exceljs');
const assert = require('node:assert/strict');
const { randomUUID, createHash } = require('node:crypto');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const path = require('node:path');

assert.equal(process.env.KPH_SYNTHETIC_ACCEPTANCE, '1', 'Requires the existing synthetic KPHON02 acceptance runtime');
const storeBase = localOrigin(process.env.STORE_URL || 'http://127.0.0.1:4781');
const adminBase = localOrigin(process.env.ADMIN_URL || 'http://127.0.0.1:4780');
const storeId = '73000000-0000-4000-8000-000000000001';
const employeeId = '71000000-0000-4000-8000-000000000003';
const managerId = '71000000-0000-4000-8000-000000000004';
const password = 'admin-e2e-password'; // Synthetic fixture only.
const output = '.local/verification/chain01-integrated';
const exact = name => ({ name, exact: true });
const api = suffix => `${storeBase}/api/v1${suffix}`;
const options = { locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' };
const results = [];

function localOrigin(value) {
  const url = new URL(value);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.protocol === 'http:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password);
  return url.origin;
}
async function session(context) {
  const r = await context.request.get(api('/auth/session')); assert.equal(r.status(), 200);
  return r.json();
}
async function login(page, base, username) {
  await page.goto(base);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', exact('Đăng nhập')).click();
}
async function selectStore(page) {
  await expect(page.locator('.store-chooser, .store-online-shell')).toHaveCount(1, { timeout: 15000 });
  if (await page.locator('.store-chooser').count()) {
    await page.getByRole('button', { name: /^001 ·/ }).click();
  }
  await expect(page.locator('.store-online-shell')).toBeVisible({ timeout: 15000 });
}
async function goKph(page) {
  await page.evaluate(() => { location.hash = 'kph'; });
  await expect(page.locator('.store-online-kph[aria-label="Phiếu KPH"]')).toBeVisible();
}
async function refreshScope(page) {
  const refreshed = page.waitForResponse(r => r.url().endsWith('/api/v1/kph/stores'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  assert.equal((await refreshed).status(), 200);
  await expect(page.locator('.store-online-kph[aria-label="Phiếu KPH"]')).toBeVisible();
}
async function history(context) {
  const r = await context.request.get(api(`/stores/${storeId}/kph?type=TPTS&page=1&pageSize=25`));
  assert.equal(r.status(), 200); return r.json();
}
async function openDetail(page, title) {
  await page.getByRole('button', exact(`Mở phiếu ${title}`)).click();
  const sheet = page.getByRole('dialog', exact('Phiếu KPH'));
  await expect(sheet).toBeVisible(); return sheet;
}
async function closeDetail(page) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', exact('Phiếu KPH'))).toHaveCount(0);
}
async function layout(page, name) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: overflow`);
  await page.screenshot({ path: `${output}/${name}.png` });
}

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  const admin = await browser.newContext({ ...options, viewport: { width: 1440, height: 1024 }, acceptDownloads: true });
  const employee = await browser.newContext({ ...options, viewport: { width: 390, height: 844 } });
  const manager = await browser.newContext({ ...options, viewport: { width: 1440, height: 1024 }, acceptDownloads: true });
  const pages = [], errors = [];
  const track = page => { pages.push(page); page.on('pageerror', e => errors.push(e.message)); return page; };
  let restoreToken, employeeOriginal, employeeRevoked = false;
  try {
    const adminPage = track(await admin.newPage());
    await login(adminPage, adminBase, 'region.admin03');
    await expect(adminPage.getByRole('heading', exact('Tổng quan vận hành'))).toBeVisible();
    const adminIdentity = await session(admin); restoreToken = adminIdentity.csrfToken;
    assert.equal(adminIdentity.user.username, 'region.admin03');
    const members = await admin.request.get(api(`/admin/stores/${storeId}/memberships`));
    assert.equal(members.status(), 200);
    const memberships = await members.json();
    employeeOriginal = memberships.find(row => row.userId === employeeId);
    const dedicatedManager = memberships.find(row => row.userId === managerId);
    assert.ok(employeeOriginal?.active, 'CHAIN01 fixture must provide the active employee actor');
    assert.ok(dedicatedManager?.active && dedicatedManager.role === 'STORE_MANAGER', 'CHAIN01 fixture must provide the dedicated store manager actor');

    const page = track(await employee.newPage());
    await login(page, storeBase, 'employee.admin03'); await selectStore(page);
    const identity = await session(employee); assert.equal(identity.user.id, employeeId);
    await page.getByRole('button', exact('Quản lý DATE')).click();
    await page.getByRole('button', exact('Quét / tra mã hàng')).click();
    await page.getByLabel('Barcode', { exact: true }).fill('0890123456789');
    await page.getByRole('button', exact('Tra cứu')).click();
    await expect(page.getByRole('status').filter({ hasText: 'Đã tìm thấy sản phẩm.' })).toBeVisible();
    await expect(page.getByText('000042', { exact: true })).toBeVisible();
    await expect(page.getByText('000007', { exact: true })).toBeVisible();
    await goKph(page);
    await expect(page.getByRole('button', exact('Chọn'))).toHaveCount(0);
    results.push('PASS employee session and published lookup keep leading-zero identifiers; employee has no review/export controls');

    const before = (await history(employee)).totalItems;
    const title = `KPHQA01 ${randomUUID()}`;
    await page.getByRole('button', exact('Tạo phiếu TP tươi sống')).click();
    await expect(page.getByRole('textbox', exact('Ngày phát hiện'))).toHaveAttribute('readonly', '');
    await expect(page.getByRole('textbox', exact('Người phát hiện'))).toHaveValue(identity.user.displayName);
    await page.getByRole('textbox', exact('Mã SKU / UPC')).fill('0000000000000');
    await page.getByRole('textbox', exact('Tên hàng hóa')).focus();
    await expect(page.getByText(/Không tìm thấy barcode\. Có thể/)).toBeVisible();
    await page.getByRole('textbox', exact('Tên hàng hóa')).fill(title);
    const photos = (await page.evaluate(() => ['#aa2020', '#19854b', '#2452bd'].map((color, i) => {
      const c = document.createElement('canvas'); c.width = 640 + i * 20; c.height = 360;
      const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
      x.fillStyle = 'white'; x.font = '32px sans-serif'; x.fillText(`SYNTHETIC ${i + 1}`, 20, 60);
      return c.toDataURL('image/png').split(',')[1];
    }))).map((data, i) => ({ name: `synthetic-${i + 1}.png`, mimeType: 'image/png', buffer: Buffer.from(data, 'base64') }));
    await page.getByText('Chọn ảnh', { exact: true }).locator('..').locator('input').setInputFiles(photos);
    await expect(page.getByText(/Đã xử lý 3\/3 ảnh/)).toBeVisible();
    await refreshScope(page);
    await expect(page.getByRole('textbox', exact('Tên hàng hóa'))).toHaveValue(title);
    await expect(page.getByLabel('Ảnh đã chọn').locator('img')).toHaveCount(3);
    await layout(page, 'mobile-create');
    await page.getByRole('button', exact('Xem lại')).click();
    assert.equal((await history(employee)).totalItems, before, 'Review does not persist a record');
    const createUrl = api(`/stores/${storeId}/kph`), keys = [];
    let committed, release, first = true;
    const held = new Promise(resolve => { release = resolve; });
    const fault = async route => {
      if (route.request().method() !== 'POST' || !first) return route.continue();
      first = false;
      const response = await route.fetch(); assert.equal(response.status(), 201); committed = await response.json();
      await held; await route.abort('failed'); // Lose a real committed response, not a mocked success.
    };
    page.on('request', r => { if (r.method() === 'POST' && r.url() === createUrl) keys.push(r.headers()['idempotency-key']); });
    await page.route(createUrl, fault);
    try {
      await page.getByRole('button', exact('Gửi phiếu')).click();
      await expect.poll(() => Boolean(committed)).toBe(true);
      await expect(page.getByRole('button', exact('Đang gửi…'))).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', exact('Đang gửi…'))).toBeVisible();
    } finally { release(); }
    await expect(page.getByRole('alert').filter({ hasText: 'Chưa gửi được phiếu' })).toBeVisible();
    await expect(page.getByRole('alert').filter({ hasText: 'Chưa gửi được phiếu' })).toBeFocused();
    await expect(page.getByRole('alert').filter({ hasText: 'Chưa gửi được phiếu' })).toBeInViewport({ ratio: 1 });
    await expect(page.getByText('Đã gửi phiếu', { exact: true })).toHaveCount(0);
    await layout(page, 'mobile-retry');
    const savedResponse = page.waitForResponse(r => r.request().method() === 'POST' && r.url() === createUrl);
    await page.getByRole('button', exact('Gửi phiếu')).click();
    const retried = await savedResponse; assert.equal(retried.status(), 201); const saved = await retried.json();
    assert.equal(saved.id, committed.id); assert.equal(keys.length, 2); assert.ok(keys[0]); assert.equal(keys[0], keys[1]);
    await page.unroute(createUrl, fault);
    await expect(page.getByText('Đã gửi phiếu', { exact: true })).toBeVisible();
    assert.equal((await history(employee)).totalItems, before + 1);
    assert.equal(saved.detectedBy.id, employeeId); assert.equal(saved.lookupStatus, 'NOT_FOUND'); assert.equal(saved.barcode, '0000000000000');
    assert.deepEqual(saved.photos.map(photo => photo.ordinal), [1, 2, 3]);
    await openDetail(page, title); await closeDetail(page);
    results.push('PASS 3-photo draft survives focus; lost committed response retries same key/id with exactly one persisted record');

    // Temporarily grant the employee a real store-manager membership, then revoke it
    // while a review sheet is open to prove authorization is rechecked on the next request.
    await adminPage.getByRole('button', exact('Quyền cửa hàng')).click();
    await adminPage.getByLabel('Cửa hàng', { exact: true }).selectOption(storeId);
    await adminPage.getByRole('button', exact('Đổi vai trò của employee.admin03')).click();
    let membershipDialog = adminPage.getByRole('dialog', exact('Đổi vai trò cửa hàng'));
    await membershipDialog.getByLabel(/Vai trò tại cửa hàng/).selectOption('STORE_MANAGER');
    await membershipDialog.getByLabel(/^Lý do/).fill('CHAIN01 temporary synthetic manager capability check');
    await membershipDialog.getByRole('button', exact('Lưu quyền')).click();
    await expect(adminPage.getByText('Đã lưu quyền cho employee.admin03 tại 001.', { exact: true })).toBeVisible();
    await refreshScope(page);
    await expect(page.getByRole('button', exact('Chọn'))).toBeVisible();
    let pendingSheet = await openDetail(page, title);
    await expect(pendingSheet.getByRole('button', exact('Duyệt phiếu'))).toBeVisible();
    await adminPage.getByRole('button', exact('Thu hồi quyền của employee.admin03')).click();
    membershipDialog = adminPage.getByRole('dialog', exact('Thu hồi quyền cửa hàng'));
    await membershipDialog.getByLabel(/^Lý do/).fill('CHAIN01 synthetic next-request revocation');
    await membershipDialog.getByRole('button', exact('Xác nhận thu hồi')).click();
    await expect(adminPage.getByText('Đã thu hồi quyền của employee.admin03 tại 001.', { exact: true })).toBeVisible();
    employeeRevoked = true;
    const denied = page.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${saved.id}/approval`));
    await pendingSheet.getByRole('button', exact('Duyệt phiếu')).click();
    assert.equal((await denied).status(), 403);
    await expect(page.getByRole('heading', exact('Chọn cửa hàng'))).toBeVisible();
    await expect(page.getByRole('dialog', exact('Phiếu KPH'))).toHaveCount(0);
    assert.equal((await employee.request.get(storeBase + saved.photos[0].stampedContentPath)).status(), 403);
    results.push('PASS temporary active store-manager actor loses review capability immediately after Admin UI revocation; stale review is 403');

    const reviewer = track(await manager.newPage());
    await login(reviewer, storeBase, 'manager.admin03'); await selectStore(reviewer); await goKph(reviewer);
    const managerIdentity = await session(manager);
    assert.equal(managerIdentity.user.id, managerId);
    let sheet = await openDetail(reviewer, title);
    await expect(sheet.getByRole('button', exact('Xem ảnh 1')).locator('img')).toBeVisible();
    const approvedResponse = reviewer.waitForResponse(r => r.request().method() === 'PUT' && r.url().endsWith(`/${saved.id}/approval`));
    await sheet.getByRole('button', exact('Duyệt phiếu')).click();
    const reviewed = await approvedResponse; assert.equal(reviewed.status(), 200);
    const approved = await reviewed.json(); assert.equal(approved.approvalStatus, 'APPROVED');
    assert.equal(approved.reviewedBy.id, managerId);
    await expect(reviewer.getByText('Đã duyệt phiếu', { exact: true })).toBeVisible();
    if (await sheet.isVisible()) await closeDetail(reviewer);
    await reviewer.reload(); await selectStore(reviewer); await goKph(reviewer);
    const persisted = (await history(reviewer)).items.find(row => row.id === saved.id);
    assert.equal(persisted.approvalStatus, 'APPROVED'); assert.equal(persisted.reviewedBy.id, managerId);
    await adminPage.getByRole('button', exact('Phiếu KPH')).click();
    await expect(adminPage.getByRole('heading', exact('Phiếu KPH'))).toBeVisible();
    await expect(adminPage.getByRole('button', exact(title))).toBeVisible();
    await adminPage.getByRole('button', exact(title)).click();
    const monitored = adminPage.getByRole('dialog');
    await expect(monitored.getByText(saved.id, { exact: true })).toBeVisible();
    await expect(monitored.getByText(managerIdentity.user.displayName, { exact: true })).toBeVisible();
    await expect(monitored.getByRole('button', { name: /duyệt/i })).toHaveCount(0);
    await adminPage.keyboard.press('Escape');
    const regionalExport = track(await admin.newPage());
    await regionalExport.goto(storeBase); await selectStore(regionalExport); await goKph(regionalExport);
    await regionalExport.getByRole('button', exact('Chọn')).click();
    await regionalExport.getByRole('checkbox', exact(`Chọn ${title}`)).check();
    await regionalExport.getByRole('button', exact('Xuất Excel')).click();
    const exported = regionalExport.waitForResponse(r => r.request().method() === 'POST' && r.url().endsWith('/kph/exports'));
    const downloaded = regionalExport.waitForEvent('download');
    await regionalExport.getByRole('dialog', exact('Xuất Excel')).getByRole('button', exact('Tải xuống')).click();
    const bundleResponse = await exported; assert.equal(bundleResponse.status(), 200);
    assert.deepEqual(bundleResponse.request().postDataJSON().recordIds, [saved.id]);
    const bundle = await bundleResponse.json(); assert.deepEqual(bundle.records.map(row => row.id), [saved.id]);
    const file = path.resolve(output, 'integrated-three-photos.xlsx'); await (await downloaded).saveAs(file);
    const book = new ExcelJS.Workbook(); await book.xlsx.load(readFileSync(file));
    const ws = book.getWorksheet('Thực phẩm tươi sống');
    assert.equal(ws.getCell('D9').value, title); assert.equal(ws.getCell('R9').value, managerIdentity.user.displayName);
    assert.equal(ws.getCell('D10').value, null); assert.equal(ws.pageSetup.orientation, 'landscape');
    const images = ws.getImages().sort((a, b) => a.range.tl.col - b.range.tl.col);
    assert.equal(images.length, 3);
    for (const [i, image] of images.entries()) {
      const response = await admin.request.get(storeBase + saved.photos[i].stampedContentPath);
      assert.equal(response.status(), 200); assert.match(response.headers()['cache-control'], /private/);
      const embedded = book.getImage(image.imageId);
      const bytes = embedded.buffer ? Buffer.from(embedded.buffer) : Buffer.from(embedded.base64.split(',').pop(), 'base64');
      assert.equal(createHash('sha256').update(bytes).digest('hex'), createHash('sha256').update(await response.body()).digest('hex'));
    }
    await layout(regionalExport, 'desktop-region-exported');
    results.push('PASS store manager reviewed; region Admin read-only detail shows the real reviewer; region Store scope exported the same record with private stamped images matching workbook bytes');

    await layout(reviewer, 'desktop-manager-review'); await layout(adminPage, 'desktop-admin-monitor');
    assert.deepEqual(errors, []);
    writeFileSync(`${output}/integrated-results.json`, JSON.stringify({ result: 'PASS', recordId: saved.id, results }, null, 2) + '\n');
    console.log(JSON.stringify({ result: 'PASS', recordId: saved.id, results }));
  } catch (error) {
    for (const [i, page] of pages.entries()) if (!page.isClosed()) await page.screenshot({ path: `${output}/failure-${i}.png`, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    try {
      if (employeeOriginal && employeeRevoked) {
        const r = await admin.request.put(api(`/admin/stores/${storeId}/memberships/${employeeId}`), { headers: { 'X-CSRF-TOKEN': restoreToken }, data: { role: employeeOriginal.role, reason: 'Restore CHAIN01 synthetic employee membership' } });
        assert.equal(r.status(), 200, await r.text());
        if (!employeeOriginal.active) {
          const revoked = await admin.request.post(api(`/admin/stores/${storeId}/memberships/${employeeId}/revoke`), { headers: { 'X-CSRF-TOKEN': restoreToken }, data: { reason: 'Restore inactive CHAIN01 synthetic membership' } });
          assert.equal(revoked.status(), 200, await revoked.text());
        }
        const r2 = await admin.request.get(api(`/admin/stores/${storeId}/memberships`)); assert.equal(r2.status(), 200);
        const restored = (await r2.json()).find(row => row.userId === employeeId);
        assert.equal(restored.role, employeeOriginal.role); assert.equal(restored.active, employeeOriginal.active);
        console.log('RESTORED synthetic employee membership role/active');
      }
    } finally { await manager.close(); await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
