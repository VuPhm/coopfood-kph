const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const baseUrl = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = '.local/mobile-toolbar';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.setDefaultTimeout(10000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${baseUrl}/#kph`);
      const nav = page.locator('.store-mobile-toolbar');
      const fab = page.locator('.store-quick-fab');
      await expect(fab).toContainText('Tra hạn lùi');
      if (viewport.width >= 900) {
        await expect(nav).toBeHidden();
      } else {
        await expect(nav).toBeVisible();
        await expect(nav.getByRole('link')).toHaveCount(3);
        await expect(nav.getByRole('link', { name: 'KPH', exact: true })).toHaveAttribute('aria-current', 'page');
        const navBox = await nav.boundingBox();
        const fabBox = await fab.boundingBox();
        expect(navBox.y + navBox.height).toBeCloseTo(viewport.height, 0);
        expect(fabBox.y + fabBox.height).toBeLessThanOrEqual(navBox.y - 10);
        for (const link of await nav.getByRole('link').all()) {
          const box = await link.boundingBox();
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
          expect(await link.evaluate(el => {
            const r = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          })).toBe(true);
        }
        expect(await page.locator('#store-content').evaluate(el => parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThanOrEqual(156);
        await page.evaluate(() => window.scrollTo(0, 100000));
        const lastCard = await page.locator('.store-ticket-open').last().boundingBox();
        expect(lastCard.y + lastCard.height).toBeLessThanOrEqual(fabBox.y);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      await page.screenshot({ path: `${output}/kph-${viewport.width}.png` });
      await fab.click();
      await expect(fab).toHaveAttribute('aria-expanded', 'true');
      await expect(fab).toBeHidden();
      await expect(nav).toBeHidden();
      await expect(page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true })).toHaveCount(0);
      await expect(page.getByRole('navigation', { name: 'Điều hướng chính trên mobile' })).toHaveCount(0);
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
      await expect(quick).toBeFocused();
      const quickBox = await quick.boundingBox();
      expect(quickBox.y).toBeGreaterThanOrEqual(0);
      if (viewport.width < 900) {
        expect(quickBox.y + quickBox.height).toBeCloseTo(viewport.height, 0);
        expect(quickBox.height).toBeLessThanOrEqual(viewport.height - 24);
      } else {
        expect(quickBox.y + quickBox.height).toBeCloseTo(viewport.height - 24, 0);
      }
      await page.screenshot({ path: `${output}/quick-${viewport.width}.png` });
      await quick.getByRole('switch').click();
      await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('20/10/2026');
      await quick.getByRole('textbox', { name: 'HSD (Số ngày)', exact: true }).fill('10');
      await expect(quick.getByRole('region', { name: 'Kết quả tra hạn lùi' })).not.toHaveAttribute('data-status', 'EMPTY');
      await page.keyboard.press('Escape');
      await expect(quick).toHaveCount(0);
      await expect(fab).toBeFocused();
      await expect(fab).toBeVisible();
      await expect(fab).toHaveAttribute('aria-expanded', 'false');
      await fab.click();
      if (viewport.width < 900) {
        // Closing restores navigation; lookup state survives the route change.
        await quick.getByRole('button', { name: 'Đóng tiện ích', exact: true }).click();
        await expect(nav).toBeVisible();
        await nav.getByRole('link', { name: 'DATE', exact: true }).click();
        await expect(page).toHaveURL(/#date$/);
        await expect(quick).toHaveCount(0);
        await expect(nav.getByRole('link', { name: 'DATE', exact: true })).toHaveAttribute('aria-current', 'page');
        await fab.click();
        await expect(quick.getByRole('textbox', { name: 'HSD (Số ngày)', exact: true })).toHaveValue('10');
        await quick.getByRole('button', { name: 'Đóng tiện ích', exact: true }).click();
        await expect(fab).toBeFocused();
        for (const [label, route] of [['Trang chủ', 'home'], ['KPH', 'kph']]) {
          const link = nav.getByRole('link', { name: label, exact: true });
          await link.focus();
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(new RegExp(`#${route}$`));
          await expect(link).toHaveAttribute('aria-current', 'page');
          await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
        }
        // Modal dialogs must cover and block the underlying navigation.
        await page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).click();
        await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toBeVisible();
        expect(await page.locator('.store-mobile-toolbar').evaluate(el => {
          const r = el.getBoundingClientRect();
          return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + 30));
        })).toBe(false);
        await page.keyboard.press('Escape');
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.goto(`${baseUrl}/#login`);
      await expect(page.locator('.store-mobile-toolbar')).toHaveCount(0);
      await expect(fab).toHaveCount(0);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: navigation/active state, touch bounds, content clearance, quick lookup/focus/state, modal layering, login exclusion`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
