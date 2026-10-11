// Targeted Fresh presentation/interaction gate using only synthetic session fixtures.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = '.local/kph-fresh';
fs.mkdirSync(output, { recursive: true });
async function noOverflow(page, selector = 'html') {
  expect(await page.locator(selector).evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
async function touch(locator) {
  for (const el of await locator.all()) {
    const rect = await el.boundingBox();
    if (rect) { expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44); }
  }
}
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      page.setDefaultTimeout(8000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/#kph`);
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const desktop = viewport.width >= 900;
      expect(await page.locator('.store-ticket').count()).toBe(desktop ? 0 : 25);
      expect(await page.locator('.store-kph-table tbody tr').count()).toBe(desktop ? 25 : 0);
      await noOverflow(page);
      await touch(page.locator('.store-create-actions button, .store-kph .store-compact, .store-kph .store-filter, .store-kph .store-tabs button, .store-scan-trigger'));
      await page.screenshot({ path: `${output}/list-${viewport.width}.png` });

      // Newly visible mobile search retains identifier string behavior and selection reset.
      const search = page.getByRole('textbox', { name: 'Tìm tên hàng hoặc SKU', exact: true });
      await search.fill('0011730');
      await expect(page.locator('.store-result-count')).toHaveText('1 phiếu');
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Chọn Cải thìa VietGAP 500 g', exact: true }).check();
      await expect(page.getByText('1 đã chọn', { exact: true })).toBeVisible();
      await touch(page.locator(desktop ? '.store-kph-table-selector' : '.store-ticket-selector'));
      await search.fill('không có hàng mẫu này');
      await expect(page.getByText('0 đã chọn', { exact: true })).toBeVisible();
      await expect(page.getByText('Không có phiếu phù hợp bộ lọc.', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Xuất Excel', exact: true })).toBeDisabled();
      await search.fill('');
      await page.getByRole('button', { name: 'Xong', exact: true }).click();

      const filter = page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true });
      await filter.click();
      await page.screenshot({ path: `${output}/filter-${viewport.width}.png` });
      await page.keyboard.press('Escape');
      await expect(filter).toBeFocused();
      await page.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open').first().click();
      const detail = page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true });
      await expect(detail.getByText(/Ảnh minh chứng · \d\/3/)).toBeVisible();
      await page.screenshot({ path: `${output}/detail-${viewport.width}.png` });
      await page.keyboard.press('Escape');

      for (const kind of ['tpcn', 'tpts']) {
        const create = page.locator(`.store-create-actions .create-${kind}`);
        await create.click();
        await expect(page.locator('#product-name')).toBeVisible();
        await noOverflow(page, '.create-dialog-form');
        await expect(page.locator('#detected-date')).toHaveAttribute('readonly', '');
        await touch(page.locator('.store-create-screen .choice-card, .store-create-screen .unit-options label, .store-create-screen .photo-picker'));
        await page.screenshot({ path: `${output}/form-${kind}-${viewport.width}.png` });
        // Outside dismissal must preserve the unsaved form, including latest shared-dialog fix.
        await page.locator('#product-name').fill('Hàng mẫu kiểm tra Co.op Fresh');
        if (desktop) { await page.mouse.click(10, 10); await expect(page.locator('#product-name')).toHaveValue('Hàng mẫu kiểm tra Co.op Fresh'); }
        await page.getByRole('button', { name: 'Hủy', exact: true }).click();
        await expect(create).toBeFocused();
      }
      expect(errors).toEqual([]);
      results.push({ viewport, noOverflow: true, touch: true, searchSelectionReset: true, modalFocus: true, formRecovery: true, errors });
      console.log(`PASS Fresh ${viewport.width}×${viewport.height}: list/search/selection/touch/forms/modal focus`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
