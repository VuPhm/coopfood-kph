const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.FRESH_STORE_MOCK_URL || 'http://127.0.0.1:4180';
const out = '.local/verification/compact-r5/kph';
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1024 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await page.goto(`${base}/#kph`);
      const rows = page.locator(width < 900 ? '.store-ticket' : '.store-kph-record-row');
      await expect(rows.first()).toBeVisible();
      const height = await rows.first().evaluate(e => e.getBoundingClientRect().height);
      if (width < 900) {
        await rows.first().locator('.store-tag-strip [data-label-kind]').first().click();
        await expect(page.getByRole('dialog')).toHaveCount(0);
        // Exercise an actually overflowing strip, rather than skipping the keyboard check.
        const strips = page.locator('.store-tag-strip');
        const index = await strips.evaluateAll(es => es.findIndex(e => e.scrollWidth > e.clientWidth + 1));
        expect(index).toBeGreaterThanOrEqual(0);
        const strip = strips.nth(index);
        await strip.scrollIntoViewIfNeeded();
        await expect(strip).toHaveAttribute('tabindex', '0');
        await strip.focus();
        await page.keyboard.press('End');
        await expect.poll(() => strip.evaluate(e => e.scrollLeft)).toBeGreaterThan(0);
        await page.keyboard.press('Home');
        await expect.poll(() => strip.evaluate(e => e.scrollLeft)).toBe(0);
      }
      await rows.first().locator(width < 900 ? '.store-ticket-open' : '.store-kph-row-open').click();
      await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH' })).toBeVisible();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      const choose = page.getByRole('button', { name: /^Chọn phiếu/ }).first();
      await choose.click();
      await expect(choose).toHaveAttribute('aria-pressed', 'true');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${out}/selection-${width}.png` });
      await page.close();

      const long = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 1024 }, reducedMotion: 'reduce' });
      const title = 'Cải thìa VietGAP 500 g sản phẩm tổng hợp tên dài cần giữ nguyên để kiểm tra xuống dòng';
      // Synthetic module fixture; no real record or API data is changed.
      await long.route('**/src/store-app-mock.ts*', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replaceAll('Cải thìa VietGAP 500 g', title) });
      });
      await long.goto(`${base}/#kph`);
      const opener = long.getByRole('button', { name: `Mở phiếu ${title}`, exact: true }).first();
      await expect(opener).toBeVisible();
      await expect(opener.locator('.store-product-name')).toHaveAttribute('data-wrapped', 'true');
      const row = opener.locator('xpath=ancestor::*[@data-record-id][1]');
      const normalHeight = await row.evaluate(e => e.getBoundingClientRect().height);
      // Double product-name text and line metrics explicitly; root rem scaling alone does not exercise this px-based text.
      await long.addStyleTag({ content: '.store-product-name { --product-name-size:28px!important; --product-name-line:40px!important; --product-name-compact-size:26px!important; --product-name-compact-line:36px!important; font-size:26px!important; line-height:36px!important; }' });
      expect(await row.evaluate(e => e.getBoundingClientRect().height)).toBeGreaterThanOrEqual(normalHeight);
      expect(await long.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await opener.click();
      await expect(long.getByRole('dialog', { name: 'Chi tiết phiếu KPH' })).toContainText(title);
      await long.screenshot({ path: `${out}/long-name-double-text-${width}.png` });
      results.push({ width, shortItemHeight: height, longItemHeight: normalHeight, result: 'PASS' });
      await long.close();
    }
    fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2));
    console.log(results);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
