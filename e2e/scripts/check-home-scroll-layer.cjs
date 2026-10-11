const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const baseUrl = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = '.local/home-scroll-layer';
fs.mkdirSync(output, { recursive: true });

async function geometry(page) {
  return page.evaluate(() => {
    const header = document.querySelector('.store-header').getBoundingClientRect();
    const content = document.querySelector('#store-content').getBoundingClientRect();
    return { headerTop: header.top, contentTop: content.top, contentHeight: content.height, scroll: scrollY };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#home`);
      await page.locator('.store-home-art').evaluate(image => image.decode());
      const initial = await geometry(page);
      expect(initial.contentTop).toBeGreaterThan(0);
      expect(initial.contentHeight).toBeGreaterThanOrEqual(viewport.height);
      await page.screenshot({ path: `${output}/initial-${viewport.width}.png` });

      // Native wheel scrolling moves the white surface, while the green header stays behind it.
      await page.mouse.move(viewport.width - 30, viewport.height / 2);
      await page.mouse.wheel(0, 90);
      await expect.poll(async () => (await geometry(page)).scroll).toBeGreaterThan(40);
      const midway = await geometry(page);
      expect(midway.headerTop).toBeCloseTo(initial.headerTop, 0);
      expect(midway.contentTop).toBeCloseTo(initial.contentTop - midway.scroll, 0);
      expect(await page.evaluate(() => {
        const main = document.querySelector('#store-content');
        const rect = main.getBoundingClientRect();
        return main.contains(document.elementFromPoint(rect.x + rect.width / 2, rect.top + 12));
      })).toBe(true);
      await page.screenshot({ path: `${output}/midway-${viewport.width}.png` });

      await page.evaluate(() => window.scrollTo(0, 100000));
      await expect.poll(async () => (await geometry(page)).contentTop).toBeLessThanOrEqual(1);
      expect((await geometry(page)).headerTop).toBeCloseTo(initial.headerTop, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${output}/raised-${viewport.width}.png` });

      // Focusing a covered header control reveals the header, including account focus return.
      const account = page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true });
      await account.focus();
      await expect.poll(async () => (await geometry(page)).scroll).toBe(0);
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(account).toBeFocused();

      // The skip link still takes keyboard users directly into the white surface.
      await page.getByRole('link', { name: 'Đến nội dung' }).focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('#store-content')).toBeFocused();
      const launcher = page.locator(viewport.width >= 900 ? '.store-launcher-desktop' : '.store-launcher-mobile');
      await launcher.getByRole('button').first().click();
      await expect(page).toHaveURL(viewport.width >= 900 ? /#lookup$/ : /#date$/);
      await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
      await expect(page).toHaveURL(/#home$/);
      await expect.poll(async () => (await geometry(page)).scroll).toBe(0);
      await expect.poll(async () => (await geometry(page)).contentTop).toBe(initial.contentTop);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: native scroll, stationary header, surface occlusion, keyboard/account, route reset, no overflow/errors`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
