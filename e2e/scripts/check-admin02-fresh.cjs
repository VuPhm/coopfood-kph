// UI verification: real synthetic backend login/read + explicitly mocked Catalog fixture context.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { mkdirSync, readFileSync } = require('node:fs');
const base = 'http://127.0.0.1:4175';
const output = '.local/verification/admin02-fresh';
const fixture = name => JSON.parse(readFileSync(`contracts/fixtures/api/${name}.json`, 'utf8'));
async function nav(page, label) {
  if (await page.getByRole('button', { name: 'Mở điều hướng', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Mở điều hướng', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  } else await page.getByRole('button', { name: label, exact: true }).click();
}
async function noOverflow(page, name) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} page overflow`);
}
async function login(page, username) {
  await page.goto(base);
  await page.getByLabel(/Tên đăng nhập/).fill(username);
  await page.getByLabel(/^Mật khẩu/).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tổng quan vận hành', exact: true })).toBeVisible();
}
(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['desktop',1440,1024],['laptop',1280,1024],['tablet',834,1112],['mobile',390,844]]) {
      const context = await browser.newContext({ viewport: { width, height }, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' });
      const page = await context.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await login(page, 'chain.p03');
      await expect(page.getByText('Chưa kết nối realtime', { exact: true })).toBeVisible();
      await noOverflow(page,name);
      await page.screenshot({ path: `${output}/${name}-overview.png`, fullPage: true });
      await page.getByLabel('Khoảng thời gian').selectOption('30');
      await expect(page.getByText('Trong 30 ngày được chọn', { exact: true })).toBeVisible();
      await page.getByLabel('Tìm cửa hàng mẫu').fill('DEMO-003');
      const table = page.getByRole('region', { name: 'Bảng cửa hàng minh họa' });
      await expect(table.getByRole('button', { name: 'Cửa hàng Tân Phong DEMO-003', exact: true })).toBeVisible();
      await expect(table.getByRole('button', { name: 'Cửa hàng An Phú DEMO-001', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Chờ duyệt', exact: true }).click();
      await expect(page.getByText(/Không có cửa hàng mẫu phù hợp/)).toBeVisible();
      await page.getByRole('button', { name: 'Chờ duyệt', exact: true }).click();
      await table.getByRole('button', { name: /Cửa hàng Tân Phong/ }).first().click();
      await expect(page.getByRole('dialog')).toContainText('Dữ liệu minh họa');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await nav(page,'Tài khoản');
      await expect(page.getByRole('heading', { name: 'Tài khoản người dùng', exact: true })).toBeVisible();
      await expect(page.getByText('manager.p03', { exact: true })).toBeVisible();
      await noOverflow(page,name+' identity');
      await page.screenshot({ path: `${output}/${name}-identity.png`, fullPage: true });
      await page.getByRole('article').filter({ has: page.getByText('manager.p03', { exact: true }) }).getByRole('button', { name: 'Vô hiệu hóa', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Xác nhận vô hiệu hóa', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('alert')).toContainText('Hãy nhập lý do');
      await page.getByRole('dialog').getByRole('button', { name: 'Quay lại', exact: true }).click();
      await nav(page,'Lifecycle');
      await expect(page.getByRole('heading', { name: 'Đặt lịch ngừng hoạt động', exact: true })).toBeVisible();
      await expect(page.locator('#target option')).toHaveCount(5);
      await noOverflow(page,name+' lifecycle');
      await page.screenshot({ path: `${output}/${name}-lifecycle.png`, fullPage: true });
      // Deep-link reload and browser history keep the current workspace.
      await page.goBack();
      await expect(page.getByRole('heading', { name: 'Tài khoản người dùng', exact: true })).toBeVisible();
      await page.goForward();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Đặt lịch ngừng hoạt động', exact: true })).toBeVisible();
      await page.locator('.admin-skip').focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#admin-main')).toBeFocused();
      await expect(page.getByRole('heading', { name: 'Đặt lịch ngừng hoạt động', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).focus();
      await page.keyboard.press('ArrowDown');
      await page.getByRole('menuitem', { name: 'Đổi mật khẩu', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true })).toBeVisible();
      await page.getByRole('dialog').getByRole('button', { name: 'Quay lại', exact: true }).click();
      if (width >= 1280) {
        await page.getByRole('button', { name: 'Thu gọn sidebar', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Mở rộng sidebar', exact: true })).toBeVisible();
        // Icon rail must retain accessible navigation names.
        await nav(page, 'Tổng quan');
        await expect(page.getByRole('heading', { name: 'Tổng quan vận hành' })).toBeVisible();
        await page.getByRole('button', { name: 'Mở rộng sidebar', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Menu tài khoản', exact: true }).click();
      await page.getByRole('menuitem', { name: 'Đăng xuất', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị', exact: true })).toBeVisible();
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`PASS real backend chain ${width}x${height}: overview filters/detail, identity reason guard, lifecycle/read, reload, account, logout, no overflow/errors`);
    }
    const region = await browser.newContext({ viewport: { width:1440,height:1024 } });
    const rp = await region.newPage(); await login(rp,'region.p03');
    await expect(rp.getByRole('button', { name:'Lifecycle',exact:true })).toBeVisible();
    await expect(rp.getByRole('button', { name:'Tài khoản',exact:true })).toHaveCount(0);
    await expect(rp.getByRole('button', { name:'Catalog',exact:true })).toHaveCount(0);
    assert.equal((await region.request.get(base+'/api/v1/admin/users')).status(),403);
    await nav(rp,'Lifecycle'); await expect(rp.locator('#target option')).toHaveCount(2);
    await rp.screenshot({path:`${output}/region-desktop-lifecycle.png`,fullPage:true});
    await region.close(); console.log('PASS real backend region scope and chain-only directory deny');
    for (const [name,width,height] of [['desktop',1440,1024],['laptop',1280,1024],['tablet',834,1112],['mobile',390,844]]) {
      const context = await browser.newContext({viewport:{width,height}, reducedMotion:'reduce'});
      const cp = await context.newPage();
      const session = fixture('session'); session.user.globalRoles=['CATALOG_ADMIN'];
      await cp.route('**/api/v1/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/auth/session')) return route.fulfill({json:session});
        if (path.endsWith('/lifecycle/targets')) return route.fulfill({status:403,json:{code:'LIFECYCLE_ADMIN_REQUIRED'}});
        if (path.endsWith('/catalog/imports')) return route.fulfill({json:fixture('catalog-imports')});
        if (path.includes('/catalog/imports/')) return route.fulfill({json:fixture('catalog-import-detail')});
        return route.fulfill({status:403,json:{code:'FORBIDDEN'}});
      });
      await cp.goto(base+'/#catalog');
      await expect(cp.getByRole('heading',{name:'Kiểm tra catalog CSV',exact:true})).toBeVisible();
      const conflict = cp.getByRole('button', { name: /catalog-conflict.csv/ });
      await conflict.click();
      await expect(conflict).toHaveAttribute('aria-pressed', 'true');
      await expect(cp.getByRole('heading', {name:'catalog-conflict.csv',exact:true})).toBeVisible();
      await noOverflow(cp,'catalog '+name);
      await cp.screenshot({path:`${output}/${name}-catalog-fixture.png`,fullPage:true});
      await context.close(); console.log(`PASS Catalog fixture ${width}x${height}`);
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
