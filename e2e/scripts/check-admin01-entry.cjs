// Read-only walkthrough of the existing Admin UI on isolated synthetic P03 data.
const { chromium, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4174';
const output = '.local/verification/admin01-entry';
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['mobile', 390, 844], ['desktop', 1440, 1024]]) {
      for (const role of ['chain', 'region']) {
        const context = await browser.newContext({ viewport: { width, height }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(base);
        await page.getByLabel(/Tên đăng nhập/).fill(`${role}.p03`);
        await page.getByLabel(/^Mật khẩu/).fill('admin-e2e-password');
        await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Đặt lịch ngừng hoạt động', exact: true })).toBeVisible();
        await expect(page.locator('#target option')).toHaveCount(role === 'chain' ? 5 : 2);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: `${output}/${role}-${name}-lifecycle.png`, fullPage: true });
        if (role === 'chain') {
          await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
          await expect(page.getByRole('heading', { name: 'Tài khoản người dùng', exact: true })).toBeVisible();
          await expect(page.getByText('manager.p03', { exact: true })).toBeVisible();
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
          await page.screenshot({ path: `${output}/${role}-${name}-identity.png`, fullPage: true });
        } else {
          await expect(page.getByRole('button', { name: 'Tài khoản', exact: true })).toHaveCount(0);
          assert.equal((await context.request.get(`${base}/api/v1/admin/users`)).status(), 403);
        }
        await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
        await expect(page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true })).toBeVisible();
        await page.getByRole('button', { name: 'Quay lại', exact: true }).click();
        assert.deepEqual(errors, []);
        await context.close();
        console.log(`PASS ${role} ${width}x${height}: navigation, scope, password dialog, overflow, no page errors`);
      }
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
