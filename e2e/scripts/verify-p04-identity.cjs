// Real-backend acceptance on the disposable P03/P04 seed only.
// Mutates region.p03; reset the isolated preview before handing it to the owner.
const { chromium, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const baseURL = process.env.P04_ACCEPTANCE_URL || 'http://127.0.0.1:4174';
assert.equal(new URL(baseURL).hostname, '127.0.0.1', 'Only the loopback synthetic preview is allowed');
const output = '.local/verification/p04-identity';
const regionId = '10000000-0000-4000-8000-000000000002';
async function login(page, username) {
  await page.goto(baseURL);
  await page.getByLabel(/Tên đăng nhập/).fill(username);
  await page.getByLabel(/^Mật khẩu/).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).waitFor();
}
function card(page, username) {
  return page.getByRole('article').filter({ has: page.getByText(username, { exact: true }) });
}
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    const adminContext = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await adminContext.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await login(page, 'chain.p03');
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('heading', { name: 'Tài khoản người dùng' }).waitFor();
    await expect(card(page, 'chain.p03').getByText('Tài khoản đang đăng nhập')).toBeVisible();
    await expect(card(page, 'chain.p03').getByRole('button', { name: 'Vô hiệu hóa', exact: true })).toHaveCount(0);
    for (const [name, width, height] of [['desktop', 1440, 1000], ['tablet', 768, 1024], ['mobile', 375, 812], ['landscape', 667, 375]]) {
      await page.setViewportSize({ width, height });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name + ': page overflow');
      await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
      const password = page.getByRole('dialog', { name: 'Đổi mật khẩu' });
      await expect(password.getByLabel(/Mật khẩu hiện tại/)).toBeVisible();
      await password.getByRole('button', { name: 'Quay lại', exact: true }).click();
      await card(page, 'manager.p03').getByRole('button', { name: 'Vô hiệu hóa', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Vô hiệu hóa tài khoản' });
      await expect(dialog.getByLabel(/Lý do/)).toBeFocused();
      const confirm = dialog.getByRole('button', { name: 'Xác nhận vô hiệu hóa' });
      await confirm.scrollIntoViewIfNeeded();
      await expect(confirm).toBeInViewport({ ratio: 1 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, name + ': dialog overflow');
      await page.screenshot({ path: `${output}/${name}.png` });
      await dialog.getByRole('button', { name: 'Quay lại', exact: true }).click();
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await card(page, 'manager.p03').getByRole('button', { name: 'Vô hiệu hóa', exact: true }).click();
    let dialog = page.getByRole('dialog', { name: 'Vô hiệu hóa tài khoản' });
    await dialog.getByRole('button', { name: 'Xác nhận vô hiệu hóa' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Hãy nhập lý do vô hiệu hóa tài khoản.');
    await dialog.getByLabel(/Lý do/).fill('Synthetic last-manager guard');
    const guardedResponse = page.waitForResponse(r => r.url().endsWith('/deactivate') && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Xác nhận vô hiệu hóa' }).click();
    assert.equal((await guardedResponse).status(), 409);
    await expect(dialog.getByRole('alert')).toContainText('quản lý');
    await dialog.getByRole('button', { name: 'Quay lại', exact: true }).click();
    await expect(card(page, 'manager.p03').getByText('Đang hoạt động', { exact: true })).toBeVisible();

    const regionContext = await browser.newContext();
    const region = await regionContext.newPage();
    await login(region, 'region.p03');
    await expect(region.getByRole('button', { name: 'Tài khoản', exact: true })).toHaveCount(0);
    assert.equal((await regionContext.request.get(baseURL + '/api/v1/admin/users')).status(), 403);
    await card(page, 'region.p03').getByRole('button', { name: 'Vô hiệu hóa', exact: true }).click();
    dialog = page.getByRole('dialog', { name: 'Vô hiệu hóa tài khoản' });
    await dialog.getByLabel(/Lý do/).fill('Synthetic P04 browser acceptance');
    const changedResponse = page.waitForResponse(r => r.url().endsWith(`/users/${regionId}/deactivate`) && r.request().method() === 'POST');
    await dialog.getByRole('button', { name: 'Xác nhận vô hiệu hóa' }).click();
    assert.equal((await changedResponse).status(), 200);
    await expect(card(page, 'region.p03').getByRole('button', { name: 'Đã vô hiệu hóa', exact: true })).toBeDisabled();
    await page.reload();
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await expect(card(page, 'region.p03').getByRole('button', { name: 'Đã vô hiệu hóa', exact: true })).toBeDisabled();
    await region.getByRole('button', { name: 'Tải lại lịch ngừng hoạt động' }).click();
    await expect(region.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
    assert.equal((await regionContext.request.get(baseURL + '/api/v1/auth/session')).status(), 401);
    assert.equal((await regionContext.request.post(baseURL + '/api/v1/auth/login', {
      data: { username: 'region.p03', password: 'admin-e2e-password' },
    })).status(), 401);
    assert.deepEqual(pageErrors, []);
    console.log('PASS P04: 4 viewports; identity password action; self/blank/last-manager guards; region deny; deactivate/reload; session and login revoked.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
