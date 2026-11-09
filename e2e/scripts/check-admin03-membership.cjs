// All API calls use the isolated real ADMIN03 backend; no intercepted/mock routes.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const adminUrl = 'http://127.0.0.1:4175';
const storeUrl = 'http://127.0.0.1:4173';
const storeId = '73000000-0000-4000-8000-000000000001';
const otherStore = '73000000-0000-4000-8000-000000000002';
const output = '.local/verification/admin03-membership';
const results = [];
async function login(page, url, username, admin = false) {
  await page.goto(url);
  await page.getByLabel(/Tên đăng nhập/).fill(username);
  await page.getByLabel(/^Mật khẩu/).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  if (admin) await expect(page.getByRole('heading', { name: 'Tổng quan vận hành', exact: true })).toBeVisible();
  else {
    await expect.poll(async () => (await page.request.get(`${url}/api/v1/auth/session`)).status()).toBe(200);
    await expect(page.locator('body')).toContainText(username);
  }
}
async function nav(page) {
  const menu = page.getByRole('button', { name: 'Mở điều hướng', exact: true });
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Quyền cửa hàng', exact: true }).click();
  } else await page.getByRole('button', { name: 'Quyền cửa hàng', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Quyền cửa hàng', exact: true })).toBeVisible();
  await page.getByLabel('Cửa hàng', { exact: true }).selectOption(storeId);
  await expect(page.getByRole('button', { name: 'Gán quyền', exact: true })).toBeEnabled();
}
async function grant(page, username) {
  await page.getByRole('button', { name: 'Gán quyền', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Gán quyền cửa hàng' });
  await expect(dialog.getByLabel(/Tên đăng nhập chính xác/)).toBeFocused();
  await dialog.getByLabel(/Tên đăng nhập chính xác/).fill(username.toUpperCase());
  await dialog.getByLabel(/Tên đăng nhập chính xác/).press('Enter');
  await expect(dialog.getByLabel(/Vai trò tại cửa hàng/)).toBeFocused();
  await dialog.getByLabel(/^Lý do/).fill('Phân công tổng hợp ADMIN03');
  await dialog.getByRole('button', { name: 'Lưu quyền', exact: true }).click();
  await expect(page.getByText(`Đã lưu quyền cho ${username} tại 001.`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: `Thu hồi quyền của ${username}`, exact: true })).toBeVisible();
}
async function revoke(page, username) {
  await page.getByRole('button', { name: `Thu hồi quyền của ${username}`, exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Thu hồi quyền cửa hàng' });
  await expect(dialog.getByLabel(/^Lý do/)).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Xác nhận thu hồi' })).toBeDisabled();
  await expect(dialog.getByText(/Quyền vùng hoặc toàn chuỗi hợp lệ vẫn được giữ/)).toBeVisible();
  await dialog.getByLabel(/^Lý do/).fill('Kết thúc phân công tổng hợp ADMIN03');
  await dialog.getByRole('button', { name: 'Xác nhận thu hồi' }).click();
  await expect(page.getByText(`Đã thu hồi quyền của ${username} tại 001.`, { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: `Cấp lại quyền cho ${username}`, exact: true })).toBeVisible();
}
async function kph(context, expected) {
  const response = await context.request.get(`${storeUrl}/api/v1/stores/${storeId}/kph`);
  assert.equal(response.status(), expected, await response.text());
  assert.equal((await context.request.get(`${storeUrl}/api/v1/auth/session`)).status(), 200);
}
async function layout(page, name) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: page overflow`);
  const tooSmall = await page.locator('.membership-workspace button, .membership-workspace select, .membership-dialog button, .membership-dialog input, .membership-dialog textarea, .membership-dialog select').evaluateAll(nodes => nodes.filter(node => {
    const r = node.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
  }).map(node => node.getAttribute('aria-label') || node.textContent));
  assert.deepEqual(tooSmall, [], `${name}: targets below44px`);
  const dialog = page.getByRole('dialog');
  if (await dialog.count()) assert.ok(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), `${name}: dialog overflow`);
}
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  const opts = { locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' };
  try {
    for (const [name, width, height] of [['desktop',1440,1024], ['mobile',390,844]]) {
      const admin = await browser.newContext({ ...opts, viewport: { width, height } });
      const employee = await browser.newContext({ ...opts, viewport: { width:390, height:844 } });
      const page = await admin.newPage(); const store = await employee.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      store.on('pageerror', error => errors.push(error.message));
      const first = await page.goto(adminUrl);
      assert.equal(first.headers()['cache-control'], 'no-store');
      await login(page, adminUrl, 'region.admin03', true);
      await nav(page);
      assert.equal(await page.getByLabel('Cửa hàng', { exact: true }).locator('option').count(), 2);
      assert.equal((await admin.request.get(`${adminUrl}/api/v1/admin/stores/${otherStore}/memberships`)).status(), 403);
      await page.getByRole('button', { name: 'Gán quyền', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Gán quyền', exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Gán quyền', exact: true }).click();
      let dialog = page.getByRole('dialog');
      await dialog.getByLabel(/Tên đăng nhập chính xác/).fill('employee');
      await dialog.getByLabel(/Tên đăng nhập chính xác/).press('Enter');
      await expect(dialog.getByRole('alert')).toContainText('Không tìm thấy tài khoản đang hoạt động');
      await expect(dialog.getByRole('button', { name: 'Lưu quyền' })).toHaveCount(0);
      await layout(page, `${name}-lookup`);
      await page.keyboard.press('Escape');
      await login(store, storeUrl, 'employee.admin03');
      await kph(employee, 403);
      await grant(page, 'employee.admin03');
      await kph(employee, 200);
      assert.equal((await employee.request.get(`${storeUrl}/api/v1/stores/${otherStore}/kph`)).status(), 403);
      await store.reload();
      await expect(store.locator('body')).toContainText('Cửa hàng An Phú mẫu');
      await expect(store.getByRole('button', { name: 'Đăng nhập', exact: true })).toHaveCount(0);
      await layout(page, name);
      await page.screenshot({ path: `${output}/${name}-members.png`, fullPage:true });
      await revoke(page, 'employee.admin03');
      await kph(employee, 403);
      await store.reload();
      await expect(store.locator('body')).toContainText('Chưa có cửa hàng trong phiên');
      await page.getByRole('button', { name: 'Đổi vai trò của manager.admin03', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Đổi vai trò cửa hàng' });
      await dialog.getByLabel(/Vai trò tại cửa hàng/).selectOption('EMPLOYEE');
      await dialog.getByLabel(/^Lý do/).fill('Kiểm tra bảo vệ quản lý cuối');
      await dialog.getByRole('button', { name: 'Lưu quyền', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('Hãy bổ sung quản lý thay thế trước');
      await expect(dialog.getByLabel(/^Lý do/)).toHaveValue('Kiểm tra bảo vệ quản lý cuối');
      await expect(dialog.getByLabel(/Vai trò tại cửa hàng/)).toHaveValue('EMPLOYEE');
      await layout(page, `${name}-guard`);
      await page.screenshot({ path: `${output}/${name}-last-manager.png`, fullPage:false });
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name:'Đổi vai trò của manager.admin03', exact:true })).toBeFocused();
      await page.reload();
      await expect(page.getByRole('heading', { name:'Quyền cửa hàng', exact:true })).toBeVisible();
      await expect(page.getByLabel('Cửa hàng', { exact:true })).toBeVisible();
      assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(items => items.length)),0);
      assert.deepEqual(errors, [], `${name}: page errors`);
      results.push(`PASS ${name} ${width}×${height}: exact lookup, keyboard/focus, grant/revoke two sessions, last manager, reload, layout`);
      console.log(results.at(-1));
      await admin.close(); await employee.close();
    }
    const chain = await browser.newContext({ ...opts, viewport:{width:1440,height:1024} });
    const page = await chain.newPage();
    await login(page, adminUrl, 'chain.admin03', true);
    await nav(page);
    assert.equal(await page.getByLabel('Cửa hàng', { exact:true }).locator('option').count(),3);
    await page.getByLabel('Cửa hàng', { exact:true }).selectOption(otherStore);
    await expect(page.getByRole('heading', { name:'Quản lý cửa hàng mẫu', exact:true })).toBeVisible();
    await expect(page.getByText('inactive.admin03', { exact:true })).toHaveCount(0);
    await page.getByLabel('Cửa hàng', { exact:true }).selectOption(storeId);
    await expect(page.getByText('inactive.admin03', { exact:true })).toBeVisible();
    for (const username of ['region.admin03','chain.admin03']) {
      const inherited = await browser.newContext(opts); const store = await inherited.newPage();
      await login(store, storeUrl, username);
      await kph(inherited,200);
      await grant(page,username); await revoke(page,username);
      await kph(inherited,200);
      await inherited.close();
    }
    for (const [name,width,height] of [['small',375,812], ['landscape',844,390]]) {
      await page.setViewportSize({width,height});
      await layout(page,name);
      await page.getByRole('button', {name:'Gán quyền',exact:true}).click();
      await layout(page,`${name}-dialog`);
      await page.keyboard.press('Escape');
      await page.screenshot({path:`${output}/${name}.png`,fullPage:true});
    }
    await page.setViewportSize({width:1440,height:1024});
    await page.emulateMedia({colorScheme:'dark'});
    await page.evaluate(() => document.documentElement.style.fontSize='20px');
    await layout(page,'large-text');
    await page.screenshot({path:`${output}/large-text.png`,fullPage:true});
    await page.getByRole('button',{name:'Menu tài khoản'}).click();
    await page.getByRole('menuitem',{name:'Đăng xuất',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Đăng nhập quản trị'})).toBeVisible();
    await login(page,adminUrl,'region.admin03',true); await nav(page);
    assert.equal(await page.getByLabel('Cửa hàng',{exact:true}).locator('option').count(),2);
    results.push('PASS chain scope/store switch, inherited region+chain permissions, small/landscape/large text, logout/login cache isolation');
    console.log(results.at(-1)); await chain.close();
    for (const username of ['employee.admin03','catalog.admin03']) {
      const c = await browser.newContext(opts); const p = await c.newPage();
      await login(p,adminUrl,username,true);
      await expect(p.getByRole('button',{name:'Quyền cửa hàng',exact:true})).toHaveCount(0);
      assert.equal((await c.request.get(`${adminUrl}/api/v1/admin/membership-stores`)).status(),403);
      await c.close();
    }
    results.push('PASS employee and catalog-only cannot discover/manage memberships'); console.log(results.at(-1));
    writeFileSync(`${output}/results.json`,JSON.stringify({results,realBackend:true,interceptedRoutes:0},null,2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
