// Synthetic preview: ordering/filter state, keyboard, popup bounds and runtime contrast.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
process.env.STORE_KPH_COLORS_OUTPUT ||= '.local/kph-filter-sort';
const { audit } = require('./check-kph-colors.cjs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_KPH_COLORS_OUTPUT;
fs.mkdirSync(output, { recursive: true });
async function bounds(page, locator) {
  const rect = await locator.boundingBox(), v = page.viewportSize();
  expect(rect.x).toBeGreaterThanOrEqual(0); expect(rect.y).toBeGreaterThanOrEqual(0);
  expect(rect.x + rect.width).toBeLessThanOrEqual(v.width + 1);
  expect(rect.y + rect.height).toBeLessThanOrEqual(v.height + 1);
  expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
async function touch(locator) {
  for (const el of await locator.all()) {
    const r = await el.boundingBox(); if (!r) continue;
    expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
  }
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/#kph`); await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      const sort = page.getByRole('button', { name: /^Sắp xếp phiếu:/ });
      const popup = page.getByRole('dialog', { name: 'Sắp xếp phiếu', exact: true });
      await sort.click(); await expect(popup).toBeVisible();
      await bounds(page, popup); await touch(popup.getByRole('button'));
      await expect(popup.getByRole('button', { name: /^Mới nhất/ })).toBeFocused();
      results.push(await audit(page, '.store-quick-sort-popup', `sort-open-${viewport.width}`));
      await page.screenshot({ path: `${output}/sort-${viewport.width}.png` });
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await expect(popup).toHaveCount(0); await expect(sort).toBeFocused();
      await expect(sort).toHaveText('Cũ nhất');
      const rows = page.locator(viewport.width < 900 ? '.store-ticket-open' : '.store-kph-row-open');
      await expect(rows.first()).toContainText('Nông sản mẫu 28');
      await sort.click(); await expect(popup).toBeVisible(); await expect(popup.getByRole('button', { name: /^Cũ nhất/ })).toBeFocused(); await page.keyboard.press('Escape'); await expect(popup).toHaveCount(0); await expect(sort).toBeFocused();
      await sort.click(); await expect(popup).toBeVisible(); await page.mouse.click(2, 2); await expect(popup).toHaveCount(0);
      await sort.click(); await popup.getByRole('button', { name: /^Tên hàng/ }).click();
      const names = await (viewport.width < 900 ? rows.locator('strong') : rows).allTextContents();
      expect(names).toEqual([...names].sort(new Intl.Collator('vi').compare));

      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Chọn Cải thìa VietGAP 500 g', exact: true }).check();
      await expect(page.getByText('1 đã chọn', { exact: true })).toBeVisible();
      const opener = page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true });
      await opener.click();
      const filter = page.getByRole('dialog', { name: 'Lọc & sắp xếp', exact: true });
      await bounds(page, filter); await touch(filter.locator('.store-choices button, .store-kph-filter-footer button, .field-input-action'));
      await bounds(page, filter.getByRole('button', { name: 'Xong', exact: true }));
      expect(await filter.locator('#filter-from').evaluate(el => {
        const style = getComputedStyle(el), context = document.createElement('canvas').getContext('2d');
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        return context.measureText(el.placeholder).width <= el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      })).toBe(true);
      await filter.getByRole('group', { name: 'Trạng thái duyệt', exact: true }).getByRole('button', { name: 'Đã duyệt', exact: true }).click();
      await filter.getByRole('group', { name: 'Thứ tự phiếu', exact: true }).getByRole('button', { name: 'Cũ nhất', exact: true }).click();
      results.push(await audit(page, '.store-kph-filter', `filter-selected-${viewport.width}`));
      await page.screenshot({ path: `${output}/filter-${viewport.width}.png` });
      await filter.getByRole('button', { name: 'Xong', exact: true }).click();
      await expect(opener).toBeFocused(); await expect(sort).toHaveText('Cũ nhất');
      await expect(page.getByText('0 đã chọn', { exact: true })).toBeVisible();
      const count = viewport.width < 900 ? page.locator('.store-ticket') : page.locator('.store-kph-table tbody tr');
      expect(await page.locator('.store-kph .chip-safe').count()).toBe(await count.count());
      await opener.click();
      await filter.locator('#filter-from').fill('15/08/2026'); await filter.locator('#filter-to').fill('15/08/2026');
      await expect(page.locator('.store-result-count')).toHaveText('1 phiếu');
      await filter.locator('#filter-from').fill('16/08/2026');
      await expect(filter.getByRole('alert')).toHaveText('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
      results.push(await audit(page, '.store-kph-filter', `filter-error-${viewport.width}`));
      const picker = filter.getByRole('button', { name: 'Chọn từ ngày', exact: true });
      await picker.click(); await expect(page.getByRole('dialog', { name: 'Lịch chọn ngày', exact: true })).toBeVisible();
      await page.keyboard.press('Escape'); await expect(filter).toBeVisible(); await expect(picker).toBeFocused();
      await filter.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
      await expect(filter.locator('#filter-from')).toHaveValue(''); await expect(filter.locator('#filter-to')).toHaveValue('');
      await expect(filter.getByRole('button', { name: 'Tất cả', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(filter.getByRole('button', { name: 'Mới nhất', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
      await expect(sort).toHaveText('Mới nhất'); await expect(page.locator('.store-result-count')).toHaveText('29 phiếu');
      await expect(page.locator('.store-filter-count')).toHaveCount(0);
      await sort.click(); await page.setViewportSize({ width: viewport.width, height: 390 });
      await expect.poll(async () => { const r = await popup.boundingBox(); return r.y + r.height; }).toBeLessThanOrEqual(391);
      await bounds(page, popup); await page.keyboard.press('Escape');
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS ${viewport.width}: ordering/sync/reset/date guard, selection reset, keyboard/picker, contrast/bounds/touch`);
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
