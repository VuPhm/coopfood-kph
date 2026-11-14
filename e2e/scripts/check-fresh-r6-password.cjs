const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const out = '.local/verification/ui-finish-r6/password';
fs.mkdirSync(out, { recursive: true });
async function open(page, app) {
  await page.goto(`http://127.0.0.1:${app === 'Store' ? 4173 : 4175}`);
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('region.admin03');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  if (app === 'Store') {
    await page.getByRole('button', { name: /^001 ·/ }).click();
    await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
    await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
  } else {
    await page.getByRole('button', { name: 'Menu tài khoản' }).click();
    await page.getByRole('menuitem', { name: 'Đổi mật khẩu' }).click();
  }
  await expect(page.getByRole('dialog', { name: 'Đổi mật khẩu' })).toBeVisible();
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const metrics = [];
      for (const app of ['Store', 'Admin']) {
        const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1024 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        await open(page, app);
        const dialog = page.getByRole('dialog', { name: 'Đổi mật khẩu' });
        metrics.push(await dialog.getByLabel('Mật khẩu hiện tại').evaluate(e => { const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {height:r.height,font:s.fontSize,weight:s.fontWeight,line:s.lineHeight,radius:s.borderRadius,border:s.borderColor}; }));
        await expect(dialog.getByLabel('Mật khẩu mới', { exact: true })).toHaveAttribute('autocomplete', 'new-password');
        await dialog.getByLabel('Mật khẩu hiện tại').fill(' synthetic current ');
        await dialog.getByLabel('Mật khẩu mới', { exact: true }).fill('short');
        await dialog.getByLabel('Nhập lại mật khẩu mới').fill('short');
        await dialog.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
        await expect(dialog.getByRole('alert')).toContainText('15 đến 64');
        await dialog.getByRole('button', { name: 'Hiện mật khẩu' }).click();
        await expect(dialog.getByLabel('Mật khẩu hiện tại')).toHaveAttribute('type', 'text');
        await page.screenshot({ path: `${out}/${app}-${width}.png` });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const bounds = await dialog.boundingBox();
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(width === 390 ? 844 : 1024);
        // Closing clears the mounted draft without making a credential mutation.
        await dialog.getByRole('button', { name: 'Quay lại' }).click();
        await expect(dialog).toHaveCount(0);
        if (app === 'Store') {
          await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
          await page.getByRole('button', { name: 'Đổi mật khẩu', exact: true }).click();
        } else {
          await page.getByRole('button', { name: 'Menu tài khoản' }).click();
          await page.getByRole('menuitem', { name: 'Đổi mật khẩu' }).click();
        }
        await expect(dialog.getByLabel('Mật khẩu hiện tại')).toHaveValue('');
        await expect(dialog.getByLabel('Mật khẩu mới', { exact: true })).toHaveValue('');
        await expect(dialog.getByLabel('Mật khẩu mới', { exact: true })).toHaveAttribute('type', 'password');
        await context.close();
      }
      expect(metrics[0]).toEqual(metrics[1]);
      expect(metrics[0].height).toBe(50);
      expect(metrics[0].font).toBe('16px');
      expect(metrics[0].weight).toBe('400');
      console.log('PASS password form', width, metrics[0]);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
