const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const baseUrl = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = '.local/login-scroll-layer';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#login`);
      await expect(page.getByRole('heading', { name: 'Đăng nhập cửa hàng', exact: true })).toBeVisible();
      await expect(page.locator('.fresh-login-sheet')).toBeVisible();
      await page.screenshot({ path: `${output}/initial-${viewport.width}.png` });
      const username = page.getByLabel('Tên đăng nhập', { exact: true });
      const password = page.getByLabel('Mật khẩu', { exact: true });
      await username.fill('  sample  ');
      await page.keyboard.press('Tab');
      await expect(password).toBeFocused();
      await password.fill('sample-password');
      await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'text');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('chưa khả dụng');
      await expect(password).toHaveValue('sample-password');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (viewport.width === 390) {
        // A shorter viewport approximates keyboard space; focus must reveal the input.
        await page.setViewportSize({ width: 390, height: 480 });
        await username.focus();
        await page.keyboard.press('Tab');
        await expect(password).toBeFocused();
        const bounds = await password.boundingBox();
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(480);
      }
      await page.getByRole('button', { name: 'Vào bản dùng thử', exact: true }).click();
      await expect(page).toHaveURL(/#home$/);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: Fresh sign-in, keyboard/form/reveal/error, no overflow/errors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
