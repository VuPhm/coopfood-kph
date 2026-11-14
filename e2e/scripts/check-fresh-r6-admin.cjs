// Fixture-backed UI checks; does not claim backend authorization coverage.
const { chromium, expect } = require('@playwright/test');
const { readFileSync, mkdirSync, writeFileSync } = require('node:fs');
const base = process.env.FRESH_ADMIN_URL || 'http://127.0.0.1:4185';
const output = '.local/verification/fresh-r6-admin';
const fixture = name => JSON.parse(readFileSync(`contracts/fixtures/api/${name}.json`, 'utf8'));
const endpoints = {
  '/api/v1/admin/lifecycle/targets': 'lifecycle-targets',
  '/api/v1/admin/lifecycle/schedules': 'lifecycle-schedules',
  '/api/v1/admin/membership-stores': 'admin-membership-stores',
  '/api/v1/admin/users': 'admin-users',
  '/api/v1/admin/catalog/imports': 'catalog-imports',
};
const screens = [['overview', 'Tổng quan vận hành'], ['identity', 'Tài khoản người dùng'], ['memberships', 'Quyền cửa hàng'], ['lifecycle', 'Đặt lịch ngừng hoạt động'], ['catalog', 'Kiểm tra catalog CSV']];

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      for (const username of ['chain.admin03', 'region.admin03']) {
        const real = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        const actual = await real.newPage();
        await actual.goto(base);
        await actual.getByLabel('Tên đăng nhập', { exact: true }).fill(username);
        await actual.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
        const login = actual.waitForResponse(r => r.url().includes('/auth/login') && r.request().method() === 'POST');
        await actual.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
        expect((await login).status()).toBe(200);
        await expect(actual.getByRole('heading', { name: 'Tổng quan vận hành' })).toBeVisible();
        await actual.screenshot({ path: `${output}/real-${username.split('.')[0]}-overview-${viewport.width}.png` });
        await real.close();
        results.push(`PASS ${username.split('.')[0]} real login ${viewport.width}x${viewport.height}`);
      }
      for (const role of ['chain', 'region']) {
        const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        const session = fixture('session');
        session.user.globalRoles = role === 'chain' ? ['CHAIN_ADMIN', 'CATALOG_ADMIN'] : [];
        await page.route('**/api/v1/**', route => {
          const path = new URL(route.request().url()).pathname;
          if (path.endsWith('/auth/session')) return route.fulfill({ json: session });
          if (endpoints[path]) return route.fulfill({ json: fixture(endpoints[path]) });
          if (path.includes('/memberships')) return route.fulfill({ json: fixture('admin-store-memberships') });
          if (path.includes('/catalog/imports/')) return route.fulfill({ json: fixture('catalog-import-detail') });
          return route.fulfill({ status: 403, json: { code: 'FORBIDDEN' } });
        });
        for (const [screen, heading] of screens.filter(([name]) => role === 'chain' || ['overview', 'memberships', 'lifecycle'].includes(name))) {
          await page.goto(`${base}/#${screen}`);
          await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          const controls = await page.locator('main input:not([type=file]):not([type=checkbox]):not([type=radio]), main select, main textarea').evaluateAll(elements => elements.filter(e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden').map(e => ({ height: e.getBoundingClientRect().height, font: parseFloat(getComputedStyle(e).fontSize) })));
          for (const control of controls) { expect(control.height).toBeGreaterThanOrEqual(44); expect(control.font).toBeGreaterThanOrEqual(16); }
          await page.screenshot({ path: `${output}/${role}-${screen}-${viewport.width}.png` });
          if (screen === 'overview') {
            const search = page.getByLabel('Tìm cửa hàng mẫu');
            await search.focus();
            expect(await search.evaluate(e => getComputedStyle(e).outlineStyle)).not.toBe('none');
            await search.fill('không có dữ liệu phù hợp');
            await expect(page.getByText('Không có cửa hàng mẫu phù hợp.', { exact: false })).toBeVisible();
            const filter = page.getByRole('button', { name: 'Chờ duyệt' });
            expect((await filter.boundingBox()).height).toBeGreaterThanOrEqual(44);
          }
          if (screen === 'memberships') {
            const select = page.getByLabel('Cửa hàng', { exact: true });
            await select.selectOption({ index: 1 });
            const grant = page.getByRole('button', { name: 'Gán quyền' });
            await expect(grant).toBeVisible();
            await page.screenshot({ path: `${output}/${role}-memberships-selected-${viewport.width}.png` });
            expect((await grant.boundingBox()).height).toBeGreaterThanOrEqual(44);
            await grant.click();
            await expect(page.getByRole('dialog')).toBeVisible();
            await page.screenshot({ path: `${output}/${role}-membership-dialog-${viewport.width}.png` });
            await page.keyboard.press('Escape');
          }
          if (screen === 'identity') {
            await page.getByRole('button', { name: 'Vô hiệu hóa', exact: true }).first().click();
            const dialog = page.getByRole('dialog', { name: 'Vô hiệu hóa tài khoản' });
            await expect(dialog).toBeVisible();
            await dialog.getByRole('button', { name: 'Xác nhận vô hiệu hóa' }).click();
            await expect(dialog.getByRole('alert')).toContainText('Hãy nhập lý do');
            await page.screenshot({ path: `${output}/${role}-identity-error-${viewport.width}.png` });
            await page.keyboard.press('Escape');
          }
          if (screen === 'catalog') {
            const upload = page.getByRole('button', { name: 'Tải lên và kiểm tra' });
            await expect(upload).toBeDisabled();
            expect((await upload.boundingBox()).height).toBeGreaterThanOrEqual(44);
            await page.locator('input[type=file]').setInputFiles({ name: 'synthetic-too-large.csv', mimeType: 'text/csv', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
            await upload.click();
            await expect(page.getByRole('alert')).toContainText('không được vượt quá 5 MiB');
          }
          if (screen === 'lifecycle') {
            const submit = page.getByRole('button', { name: 'Tạo lịch ngừng hoạt động' });
            expect((await submit.boundingBox()).height).toBeGreaterThanOrEqual(44);
          }
        }
        expect(errors).toEqual([]);
        results.push(`PASS ${role} fixture ${viewport.width}x${viewport.height}`);
        await context.close();
      }
    }
  } finally { await browser.close(); }
  writeFileSync(`${output}/smoke.log`, results.join('\n') + '\n');
  console.log(results.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
