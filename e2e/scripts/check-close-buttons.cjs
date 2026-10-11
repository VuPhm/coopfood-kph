// Targeted shared dismissal geometry, keyboard and focus gate; synthetic fixtures only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/close-buttons';
fs.mkdirSync(output, { recursive: true });
const storeUrl = process.env.STORE_APP_URL || 'http://127.0.0.1:5175';
const adminUrl = process.env.ADMIN_APP_URL || 'http://127.0.0.1:5178';
const onlineUrl = process.env.ONLINE_APP_URL || 'http://127.0.0.1:5177';
async function geometry(button, tone) {
  await expect(button).toBeVisible();
  await expect(button).toHaveAttribute('type', 'button');
  await expect(button).toHaveAttribute('data-close-tone', tone);
  await button.evaluate(async el => {
    await Promise.all(el.getAnimations({ subtree: true }).filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      await Promise.all(parent.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
    }
  });
  const dims = await button.evaluate(el => {
    const hit = el.getBoundingClientRect(), visual = el.firstElementChild.getBoundingClientRect();
    const icon = el.querySelector('svg'), glyph = icon.getBoundingClientRect();
    return { hit: [hit.width, hit.height], visual: [visual.width, visual.height], glyph: [glyph.width, glyph.height], radius: parseFloat(getComputedStyle(el.firstElementChild).borderRadius), stroke: getComputedStyle(icon).strokeWidth,
      centered: Math.abs((hit.left + hit.right) / 2 - (visual.left + visual.right) / 2) < .5 && Math.abs((hit.top + hit.bottom) / 2 - (visual.top + visual.bottom) / 2) < .5,
      inView: hit.left >= 0 && hit.right <= innerWidth && hit.top >= 0 && hit.bottom <= innerHeight };
  });
  expect(dims.hit).toEqual([44, 44]);
  expect(dims.visual).toEqual([36, 36]);
  expect(dims.glyph).toEqual([20, 20]);
  expect(dims.radius).toBeGreaterThanOrEqual(18);
  expect(dims.stroke).toBe('1.8px');
  expect(dims.centered && dims.inView).toBe(true);
}
async function keyboardDismiss(page, button) {
  await page.keyboard.press('Tab');
  await button.focus();
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.setDefaultTimeout(8000);
      page.setDefaultTimeout(8000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${storeUrl}/#home`);
      const accountTrigger = page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true });
      await accountTrigger.click();
      const account = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
      const accountClose = account.getByRole('button', { name: 'Đóng', exact: true });
      await geometry(accountClose, 'inverse');
      await page.screenshot({ path: `${output}/account-${viewport.width}.png` });
      await keyboardDismiss(page, accountClose);
      await expect(account).toHaveCount(0);
      await expect(accountTrigger).toBeFocused();
      await accountTrigger.click(); await page.keyboard.press('Escape');
      await expect(accountTrigger).toBeFocused();

      await page.evaluate(() => location.hash = 'kph');
      const quickTrigger = page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng' });
      await quickTrigger.click();
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
      const quickClose = quick.getByRole('button', { name: 'Đóng tiện ích' });
      await geometry(quickClose, 'inverse');
      await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
      await page.screenshot({ path: `${output}/quick-${viewport.width}.png` });
      // The outer four pixels also dismiss, outside the smaller visual circle.
      await quickClose.click({ position: { x: 2, y: 22 } });
      await expect(quick).toHaveCount(0); await expect(quickTrigger).toBeFocused();
      await quickTrigger.click();
      await expect(quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true })).toHaveValue('01/10/2026');
      await keyboardDismiss(page, quickClose);
      await expect(quickTrigger).toBeFocused();

      await page.locator('.store-create-actions .create-tpts').click();
      const scanTrigger = page.getByRole('button', { name: 'Quét mã barcode', exact: true });
      await scanTrigger.click();
      const scanClose = page.getByRole('button', { name: 'Đóng quét mã', exact: true });
      await geometry(scanClose, 'inverse');
      const scanHeader = page.locator('.store-scanner-screen .barcode-scanner-header');
      const headerBox = await scanHeader.boundingBox();
      const descriptionBox = await scanHeader.locator('[data-slot="dialog-description"]').boundingBox();
      expect(descriptionBox.y + descriptionBox.height).toBeLessThanOrEqual(headerBox.y + headerBox.height);
      await page.screenshot({ path: `${output}/scanner-${viewport.width}.png` });
      await keyboardDismiss(page, scanClose); await expect(scanClose).toHaveCount(0);
      await expect(scanTrigger).toBeFocused();
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=', 'base64');
      await page.locator('input[type=file][multiple]').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: png });
      const imageTrigger = page.getByRole('button', { name: 'Xem ảnh minh chứng 1', exact: true });
      await imageTrigger.click();
      const imageClose = page.getByRole('button', { name: 'Đóng ảnh minh chứng', exact: true });
      await geometry(imageClose, 'inverse');
      await expect(page.getByRole('button', { name: 'Xóa ảnh đang xem', exact: true })).toBeVisible();
      await page.screenshot({ path: `${output}/viewer-${viewport.width}.png` });
      await keyboardDismiss(page, imageClose); await expect(imageClose).toHaveCount(0);
      await expect(imageTrigger).toBeFocused();
      await expect(imageTrigger).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.store-create-screen')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS Store close controls ${viewport.width}x${viewport.height}`);
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const session = JSON.parse(fs.readFileSync('contracts/fixtures/api/session.json'));
      session.user.globalRoles = ['CHAIN_ADMIN'];
      await page.route('**/api/**', async route => {
        const path = new URL(route.request().url()).pathname;
        if (!path.startsWith('/api/')) return route.continue();
        const fixture = path.endsWith('/auth/session') ? session : path.endsWith('/lifecycle/targets') ? JSON.parse(fs.readFileSync('contracts/fixtures/api/lifecycle-targets.json')) : path.endsWith('/lifecycle/schedules') ? JSON.parse(fs.readFileSync('contracts/fixtures/api/lifecycle-schedules.json')) : [];
        await route.fulfill({ json: fixture });
      });
      await page.goto(adminUrl);
      const trigger = page.getByRole('button', { name: 'Đổi mật khẩu', exact: true });
      await trigger.click();
      const dialog = page.getByRole('dialog', { name: 'Đổi mật khẩu', exact: true });
      const close = dialog.getByRole('button', { name: 'Đóng', exact: true });
      await geometry(close, 'inverse');
      await page.screenshot({ path: `${output}/admin-${viewport.width}.png` });
      await keyboardDismiss(page, close); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
      await trigger.click(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
      await page.close(); console.log(`PASS Admin shared dialog ${viewport.width}x${viewport.height}`);

      const online = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      await online.route('**/api/**', route => new URL(route.request().url()).pathname.startsWith('/api/')
        ? route.fulfill({ status: 401, json: { code: 'AUTHENTICATION_REQUIRED', status: 401 } }) : route.continue());
      await online.goto(onlineUrl);
      await expect(online.getByRole('button', { name: 'Tra cứu lùi hàng', exact: true })).toBeVisible();
      await online.evaluate(() => window.dispatchEvent(new Event('offline')));
      const toastClose = online.getByRole('button', { name: 'Đóng thông báo PWA' });
      await geometry(toastClose, 'neutral');
      await toastClose.click(); await expect(toastClose).toHaveCount(0);
      const workbenchTrigger = online.getByRole('button', { name: 'Tra cứu lùi hàng', exact: true });
      if (await workbenchTrigger.count()) await workbenchTrigger.click();
      const workbenchClose = online.getByRole('button', { name: 'Đóng tra cứu lùi hàng', exact: true });
      await geometry(workbenchClose, 'neutral');
      await keyboardDismiss(online, workbenchClose);
      await expect(workbenchClose).toHaveCount(0); await expect(workbenchTrigger).toBeFocused();
      await online.close(); console.log(`PASS PWA dismiss ${viewport.width}x${viewport.height}`);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
