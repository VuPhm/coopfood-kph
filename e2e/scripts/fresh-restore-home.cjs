const { chromium, expect } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');
const output = '.local/verification/fresh-restore';

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const context = await browser.newContext({ viewport, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('http://127.0.0.1:4173');
      await page.getByLabel('Tên đăng nhập', { exact: true }).fill('region.admin03');
      await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await page.getByRole('button', { name: /^001 ·/ }).click();
      await expect(page.getByRole('heading', { name: 'Công việc cửa hàng' })).toBeVisible();
      await page.screenshot({ path: `${output}/home-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Tài khoản', exact: true }).click();
      const account = page.getByRole('dialog', { name: 'Tài khoản' });
      await expect(account.getByRole('heading', { name: 'Cửa hàng đang sử dụng' })).toBeVisible();
      await page.screenshot({ path: `${output}/account-${viewport.width}.png` });
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Tra cứu lùi hàng', exact: true }).first().click();
      await page.getByLabel('Ngày sản xuất', { exact: true }).fill('01/01/2027');
      await page.getByLabel('Hạn sử dụng (HSD)', { exact: true }).fill('30/01/2027');
      await page.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await expect(page.getByLabel('Kết quả tra hạn lùi')).toContainText('24/01/2027');
      await page.screenshot({ path: `${output}/shelf-${viewport.width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
      results.push(`PASS ${viewport.width}x${viewport.height}: real session, home, account and 30-day shelf calculation`);
      await context.close();
    }
  } finally { await browser.close(); }
  writeFileSync(`${output}/home-smoke.log`, results.join('\n') + '\n');
  console.log(results.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
