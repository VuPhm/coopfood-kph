// DATE adopts the KPH Fresh controls; synthetic data and scoped contrast only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
process.env.STORE_KPH_COLORS_OUTPUT ||= '.local/date-kph-reference';
const { audit } = require('./check-kph-colors.cjs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_KPH_COLORS_OUTPUT;
fs.mkdirSync(output, { recursive: true });
async function bounds(page, locator) {
  const r = await locator.boundingBox(), v = page.viewportSize();
  expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0);
  expect(r.x + r.width).toBeLessThanOrEqual(v.width + 1);
  expect(r.y + r.height).toBeLessThanOrEqual(v.height + 1);
  expect(await locator.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      page.setDefaultTimeout(8000); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.clock.setFixedTime(new Date("2026-10-12T05:00:00+07:00"));
      await page.goto(`${base}/#date`);
      await expect(page.getByRole('region', { name: 'Tra mã hàng', exact: true })).toBeVisible();
      const input = page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' });
      const trigger = page.getByRole('button', { name: /^Sắp xếp lô DATE:/ });
      const popup = page.getByRole('dialog', { name: 'Sắp xếp lô DATE', exact: true });
      const ids = () => page.locator('.store-date-lot-main > small:first-of-type').allTextContents();
      const defaultIds = await ids();
      async function tabGeometry() {
        const main = await page.locator('.store-date .store-tabs button').all();
        const states = await page.locator('.store-date-statuses button').all();
        for (const row of [main, states]) {
          const rects = await Promise.all(row.map(button => button.boundingBox()));
          for (const r of rects) { expect(r.height).toBe(44); expect(r.y).toBe(rects[0].y); }
        }
      }
      await tabGeometry();
      await trigger.click(); await expect(popup).toBeVisible(); await bounds(page, popup);
      await expect(popup.getByRole('button', { name: /^Mặc định/ })).toBeFocused();
      results.push(await audit(page, '.store-quick-sort-popup', `sort-${viewport.width}`));
      await page.screenshot({ path: `${output}/sort-${viewport.width}.png` });
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      await expect(popup).toHaveCount(0); await expect(trigger).toBeFocused(); await expect(trigger).toHaveText('HSD gần nhất');
      const dates = await page.locator('.store-date-lot-main > small:last-child').allTextContents();
      const expiry = dates.map(t => t.match(/HSD (\d{2})\/(\d{2})\/(\d{4})/).slice(1).reverse().join('-'));
      expect(expiry).toEqual([...expiry].sort());
      expect(await ids()).not.toEqual(defaultIds);
      await trigger.click(); await expect(popup).toBeVisible(); await page.keyboard.press('End'); await page.keyboard.press('Enter');
      await expect(trigger).toHaveText('Tên hàng');
      const names = await page.locator('.store-date-lot-main > strong').allTextContents();
      expect(names).toEqual([...names].sort(new Intl.Collator('vi').compare));
      await trigger.click(); await expect(popup).toBeVisible(); await page.keyboard.press('Escape'); await expect(trigger).toBeFocused();
      await trigger.click(); await expect(popup).toBeVisible(); await page.mouse.click(2, 2); await expect(popup).toHaveCount(0);
      const opener = page.getByRole('button', { name: 'Lọc DATE', exact: true });
      const filter = page.getByRole('dialog', { name: 'Lọc DATE', exact: true });
      await opener.click(); await bounds(page, filter); await bounds(page, filter.getByRole('button', { name: 'Xong', exact: true }));
      for (const button of await filter.getByRole('button').all()) {
        const r = await button.boundingBox(); expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
      }
      const status = filter.getByRole('group', { name: 'Trạng thái xử lý' });
      const sort = filter.getByRole('group', { name: 'Thứ tự lô' });
      await expect(sort.getByRole('button', { name: 'Tên hàng', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await status.getByRole('button', { name: 'Đã ghi nhận', exact: true }).click();
      await expect(page.locator('.store-date-lot')).toHaveCount(3);
      await sort.getByRole('button', { name: 'HSD gần nhất', exact: true }).click();
      results.push(await audit(page, '.store-date-filter', `filter-${viewport.width}`));
      await page.screenshot({ path: `${output}/filter-${viewport.width}.png` });
      await filter.getByRole('button', { name: 'Xong', exact: true }).click(); await expect(opener).toBeFocused();
      await expect(trigger).toHaveText('HSD gần nhất'); await expect(page.locator('.store-date .store-filter-count')).toHaveText('2');
      await tabGeometry();
      results.push(await audit(page, '.store-date', `selected-list-${viewport.width}`));
      await input.fill('0008421'); // Exact search switches to all processing states, as before.
      await expect(page.locator('.store-date-lot')).toHaveCount(3);
      await expect(page.locator('.store-date-product')).toContainText('SKU 0008421 · UPC 8936000123456');
      await opener.click(); await expect(status.getByRole('button', { name: 'Tất cả', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await filter.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
      await expect(status.getByRole('button', { name: 'Mở', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await expect(sort.getByRole('button', { name: 'Mặc định', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
      await expect(input).toHaveValue('0008421');
      await expect(page.locator('.store-date-lot')).toHaveCount(2); await expect(page.locator('.store-date .store-filter-count')).toHaveCount(0);
      await input.fill(''); await expect.poll(ids).toEqual(defaultIds);
      await page.getByRole('button', { name: /Theo dõi DATE/ }).click();
      await opener.click();
      const phase = filter.getByRole('group', { name: 'Tình trạng DATE' });
      await phase.getByRole('button', { name: 'Hết HSD', exact: true }).click();
      await filter.getByRole('button', { name: 'Xong', exact: true }).click();
      await expect(page.locator('.store-date-lot')).toHaveCount(2);
      for (const label of await page.locator('.store-date-lot [data-date-phase]').all()) await expect(label).toHaveAttribute('data-date-phase', 'EXPIRED');
      await expect(page.locator('.store-date .store-filter-count')).toHaveText('1');
      await opener.click();
      await filter.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
      await expect(phase.getByRole('button', { name: 'Tất cả tình trạng', exact: true })).toHaveAttribute('aria-pressed', 'true');
      await filter.getByRole('button', { name: 'Xong', exact: true }).click();
      await expect.poll(ids).toEqual(defaultIds);
      await page.screenshot({ path: `${output}/list-${viewport.width}.png`, fullPage: true });
      await page.locator('.store-date-lot').first().click();
      const detail = viewport.width >= 900 ? page.getByRole('region', { name: 'Chi tiết lô DATE' }) : page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
      await expect(detail.getByRole('button', { name: 'Ghi nhận', exact: true })).toBeEnabled();
      results.push(await audit(page, viewport.width >= 900 ? '.store-date-detail' : '.store-date-sheet', `actions-${viewport.width}`));
      await page.screenshot({ path: `${output}/detail-${viewport.width}.png` });
      if (viewport.width < 900) await page.keyboard.press('Escape');
      await trigger.click(); await page.setViewportSize({ width: viewport.width, height: 390 });
      await expect.poll(async () => { const r = await popup.boundingBox(); return r.y + r.height; }).toBeLessThanOrEqual(391);
      await bounds(page, popup); await page.keyboard.press('Escape');
      await opener.click(); await bounds(page, filter); await bounds(page, filter.getByRole('button', { name: 'Xong', exact: true }));
      await page.keyboard.press('Escape'); expect(errors).toEqual([]); await page.close();
      console.log(`PASS DATE ${viewport.width}: sort/filter sync, HSD/name ordering, default reset, search retained, keyboard/outside, touch/bounds/contrast`);
    }
    fs.writeFileSync(`${output}/contrast-results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
