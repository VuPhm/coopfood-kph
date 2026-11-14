// Current shared desktop chrome. Both entries use the real synthetic backend.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const out = '.local/verification/desktop-r7'; fs.mkdirSync(out, { recursive: true });
async function login(browser, app, width) {
  const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1024 : 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  await page.goto(`http://127.0.0.1:${app === 'store' ? 4173 : 4175}`);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('region.admin03');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  if (app === 'store') await page.getByRole('button', { name: /^001 ·/ }).click();
  await expect(page.locator('.fresh-desktop-header')).toBeVisible();
  return page;
}
async function metrics(locator) {
  return locator.evaluate(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { x: r.x, y: r.y, width: r.width, height: r.height, font: s.fontSize, weight: s.fontWeight, color: s.color, background: s.backgroundColor, image: s.backgroundImage, radius: s.borderRadius, position: s.position }; });
}
async function parity(store, admin, collapsed) {
  for (const page of [store, admin]) await page.mouse.move(1, 1);
  for (const selector of ['.fresh-desktop-sidebar', '.fresh-desktop-header', '.fresh-sidebar-brand', '.fresh-sidebar-logo', '.fresh-sidebar-navigation nav .fresh-sidebar-item', '.fresh-sidebar-footer button', '.fresh-desktop-account', '.fresh-desktop-avatar']) {
    expect(await metrics(store.locator(selector).first()), selector).toEqual(await metrics(admin.locator(selector).first()));
  }
  const header = await store.locator('.fresh-desktop-header').boundingBox();
  expect(header.x).toBe(collapsed ? 80 : 248); expect(header.y).toBe(0); expect(header.height).toBe(72);
  for (const page of [store, admin]) expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 900, 834, 390]) {
      const store = await login(browser, 'store', width), admin = await login(browser, 'admin', width);
      if (width >= 900) {
        await parity(store, admin, false);
        for (const page of [store, admin]) await page.getByRole('button', { name: 'Thu gọn sidebar', exact: true }).click();
        await parity(store, admin, true);
        // Accessible names and navigation remain usable after labels are visually hidden.
        await store.locator('.fresh-desktop-sidebar').getByRole('link', { name: 'KPH', exact: true }).click();
        await expect(store.getByRole('button', { name: 'Tạo phiếu TP tươi sống', exact: true })).toBeVisible();
        await expect(store.locator('.fresh-desktop-sidebar').getByRole('link', { name: 'KPH', exact: true })).toHaveAttribute('aria-current', 'page');
        await store.evaluate(() => window.scrollTo(0, 300));
        await admin.evaluate(() => window.scrollTo(0, 200));
        await expect.poll(() => store.locator(".store-sticky-tabs").evaluate(e => e.getBoundingClientRect().top)).toBe(72);
        for (const page of [store, admin]) {
          await expect.poll(() => page.locator('.fresh-desktop-header').evaluate(e => e.getBoundingClientRect().top)).toBe(0);
          expect(await page.locator('.fresh-desktop-sidebar').evaluate(e => e.getBoundingClientRect().top)).toBe(0);
          await page.getByRole('button', { name: 'Mở rộng sidebar', exact: true }).click();
        }
        await store.evaluate(() => { location.hash = 'home'; window.scrollTo(0, 0); });
        await expect(store.getByRole('heading', { name: 'Công việc cửa hàng' })).toBeVisible();
        await admin.evaluate(() => window.scrollTo(0, 0));
        await parity(store, admin, false);
        await store.getByRole('button', { name: 'Tài khoản', exact: true }).click();
        await expect(store.getByRole('dialog', { name: 'Tài khoản' })).toBeVisible();
        await store.keyboard.press('Escape');
        await expect(store.getByRole('button', { name: 'Tài khoản', exact: true })).toBeFocused();
        await admin.getByRole('button', { name: 'Menu tài khoản' }).click();
        await expect(admin.getByRole('menuitem', { name: 'Đổi mật khẩu' })).toBeVisible();
        await admin.keyboard.press('Escape');
        if (width === 900) {
          for (const page of [store, admin]) await page.getByRole('button', { name: 'Thu gọn sidebar', exact: true }).click();
          await store.setViewportSize({ width: 834, height: 844 }); await admin.setViewportSize({ width: 834, height: 844 });
          await admin.getByRole('button', { name: 'Mở điều hướng' }).click();
          await expect(admin.getByRole('dialog').getByRole('button', { name: 'Quyền cửa hàng', exact: true })).toBeVisible();
          await admin.keyboard.press('Escape');
          await store.setViewportSize({ width: 900, height: 844 }); await admin.setViewportSize({ width: 900, height: 844 });
          await parity(store, admin, true);
          for (const page of [store, admin]) await page.getByRole('button', { name: 'Mở rộng sidebar', exact: true }).click();
        }
      } else {
        for (const page of [store, admin]) await expect(page.locator('.fresh-desktop-sidebar')).toBeHidden();
        await expect(store.locator('.store-mobile-toolbar')).toBeVisible();
        await expect(store.locator('.fresh-desktop-context')).toBeHidden();
        await store.evaluate(() => window.scrollTo(0, 180));
        await expect.poll(() => store.locator('.store-page-hero').evaluate(e => e.getBoundingClientRect().top)).toBe(0);
        await admin.getByRole('button', { name: 'Mở điều hướng' }).click();
        await expect(admin.getByRole('dialog')).toBeVisible(); await admin.keyboard.press('Escape');
      }
      await store.screenshot({ path: `${out}/store-${width}.png` });
      await admin.screenshot({ path: `${out}/admin-${width}.png` });
      console.log('PASS shared chrome', width);
      if (width === 1440) {
        for (const page of [store, admin]) {
          await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
          await expect(page.locator('.fresh-desktop-sidebar [aria-current="page"]')).toBeVisible();
        }
      }
      await store.close(); await admin.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
