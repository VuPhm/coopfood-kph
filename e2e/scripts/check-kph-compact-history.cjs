// UI gate for the Store mock candidate; network-injected data is synthetic and test-only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4261';
const output = process.env.STORE_KPH_COMPACT_OUTPUT || '.local/kph02/r5-browser';
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
async function touch(locator) {
  for (const element of await locator.all()) {
    const box = await element.boundingBox();
    if (box) { expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44); }
  }
}
async function noOverflow(page) {
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
async function grouping(page, enabled) {
  await page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }).click();
  const filter = page.getByRole('dialog', { name: 'Lọc & sắp xếp', exact: true });
  const toggle = filter.getByRole('switch', { name: 'Nhóm theo ngày', exact: true });
  if ((await toggle.getAttribute('aria-checked')) !== String(enabled)) await toggle.click();
  await filter.getByRole('button', { name: 'Xong', exact: true }).click();
}
const fixturePatch = `
const compactBase = mockRecords[0];
mockRecords.splice(0, mockRecords.length, ...Array.from({ length: 54 }, (_, i) => ({ ...compactBase,
  id: 'compact-' + String(i).padStart(2, '0'), sku: '000' + String(i).padStart(4, '0'),
  productName: 'Hàng thử ' + String(i).padStart(2, '0'),
  detectedDate: i < 30 ? '22/10/2026' : i < 52 ? '21/10/2026' : '18/10/2026',
  condition: i === 0 ? 'Khác: bao bì bị ảnh hưởng cần kiểm tra nội dung đầy đủ và giữ nguyên chữ' : compactBase.condition,
  resolution: i === 0 ? 'Khác: chờ hướng dẫn xử lý từ quản lý cửa hàng' : compactBase.resolution,
  approvalStatus: i % 2 ? 'PENDING' : 'APPROVED'
})));`;
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width < 900, reducedMotion: 'reduce', serviceWorkers: 'block' });
      page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#kph`);
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      const desktop = viewport.width >= 900;
      const rows = () => page.locator(desktop ? '.store-kph-table tr[data-record-id]' : '.store-ticket');
      const openers = () => page.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open');
      expect(await rows().count()).toBe(25);
      await noOverflow(page); await touch(openers());
      await expect(page.getByRole('checkbox', { name: /^Chọn ngày/ })).toHaveCount(0);
      await touch(page.locator('.store-kph-day-toggle'));
      expect(await page.getByRole('button', { name: /^Thu gọn ngày/ }).count()).toBeGreaterThan(0);
      await expect(page.locator('.store-kph-record-date, .store-ticket-date')).toHaveCount(0);
      await page.screenshot({ path: `${output}/default-grouped-${viewport.width}.png` });
      await grouping(page, false);
      await expect(page.getByRole('button', { name: /^Thu gọn ngày/ })).toHaveCount(0);
      await expect(page.locator('.store-kph-record-date, .store-ticket-date').first()).toContainText('15/08/2026');
      if (!desktop) {
        const alignment = await rows().first().evaluate(row => {
          const date = row.querySelector('.store-ticket-date').getBoundingClientRect();
          const quantity = row.querySelector('.store-ticket-meta').getBoundingClientRect();
          const sku = row.querySelector('.store-ticket-sku').getBoundingClientRect();
          return Math.abs(date.y - quantity.y) < 2 ? Math.abs(date.x - quantity.right - 12) : Math.abs(date.x - sku.x);
        });
        expect(alignment).toBeLessThanOrEqual(1);
      }
      await page.screenshot({ path: `${output}/flat-${viewport.width}.png` });
      if (!desktop) {
        const strip = page.locator('[data-record-id="mock-generated-tpts-2"] .store-ticket-tags');
        await strip.scrollIntoViewIfNeeded();
        await expect.poll(() => strip.evaluate(el => el.scrollWidth - el.clientWidth)).toBeGreaterThan(1);
        expect(await strip.evaluate(el => getComputedStyle(el).scrollbarWidth)).toBe('none');
        await strip.focus(); await page.keyboard.press('ArrowRight');
        await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
        await strip.evaluate(el => { el.scrollLeft = 0; });
        const box = await strip.boundingBox();
        const cdp = await page.context().newCDPSession(page);
        const y = box.y + box.height / 2, start = box.x + box.width - 16;
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
        for (let step = 1; step <= 6; step++) {
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start - step * 20, y }] });
          await page.waitForTimeout(20);
        }
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
        await expect(page.getByRole('dialog')).toHaveCount(0); await noOverflow(page);
        await page.screenshot({ path: `${output}/tag-scroll-${viewport.width}.png` });
        await cdp.detach();
      } else {
        const first = rows().first();
        await first.locator('.store-kph-quantity').click();
        await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true })).toContainText('Cải thìa VietGAP 500 g');
        await page.keyboard.press('Escape'); await expect(openers().first()).toBeFocused();
        await first.locator('.store-kph-row-chevron').click();
        await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        const custom = page.locator('[data-record-id="mock-generated-tpts-2"] [data-custom-detail]');
        await custom.hover(); await expect(custom).toHaveAttribute('title', 'Biện pháp: Khác: chờ quản lý xác nhận hướng xử lý phù hợp');
        expect(await custom.locator('.ui-list-label-text').evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis')).toBe(true);
        await expect(page.getByRole('dialog')).toHaveCount(0);
      }
      await grouping(page, true);
      const group = page.getByRole('button', { name: 'Thu gọn ngày 14/08/2026', exact: true });
      await expect(group).toContainText('5 phiếu');
      const alignment = await group.evaluate(el => {
        const date = el.querySelector('.store-kph-day-date').getBoundingClientRect();
        const icon = el.querySelector('svg').getBoundingClientRect();
        return Math.abs(date.y + date.height / 2 - icon.y - icon.height / 2);
      });
      expect(alignment).toBeLessThanOrEqual(1);
      await group.click(); await expect(rows()).toHaveCount(20);
      const collapsed = page.getByRole('button', { name: 'Mở rộng ngày 14/08/2026', exact: true });
      await expect(collapsed).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator(`[id="${await collapsed.getAttribute('aria-controls')}"]`)).toBeHidden();
      await page.screenshot({ path: `${output}/collapsed-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await expect(rows()).toHaveCount(20);
      await expect(collapsed).toHaveAttribute('aria-expanded', 'false');
      const dayCheckbox = page.getByRole('checkbox', { name: 'Chọn ngày 14/08/2026', exact: true });
      // Tap the label padding, not just the tiny input: only this 44px area selects.
      await dayCheckbox.locator('..').click({ position: { x: 4, y: 4 } });
      await expect(dayCheckbox).toBeChecked();
      await expect(page.getByText('5 đã chọn', { exact: true })).toBeVisible();
      await expect(rows()).toHaveCount(20); await expect(collapsed).toHaveAttribute('aria-expanded', 'false');
      await touch(page.locator('.store-kph-day-selector')); await touch(page.locator('.store-kph-day-toggle'));
      await page.screenshot({ path: `${output}/selection-collapsed-${viewport.width}.png` });
      await collapsed.locator('.store-kph-day-date').click();
      await expect(rows()).toHaveCount(25); await expect(dayCheckbox).toBeChecked();
      await expect(page.getByRole('checkbox', { name: 'Chọn Nông sản mẫu 01', exact: true })).toBeChecked();
      await group.locator('.store-kph-day-count').click();
      await expect(rows()).toHaveCount(20); await expect(dayCheckbox).toBeChecked();
      await collapsed.focus(); await page.keyboard.press('Enter');
      await expect(rows()).toHaveCount(25); await expect(group).toBeFocused();
      await page.screenshot({ path: `${output}/selection-${viewport.width}.png` });
      await page.keyboard.press('Space');
      await expect(rows()).toHaveCount(20); await expect(dayCheckbox).toBeChecked();
      await expect(page.getByText('5 đã chọn', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Xong', exact: true }).click();
      await expect(rows()).toHaveCount(20);
      await expect(page.getByRole('checkbox', { name: /^Chọn ngày/ })).toHaveCount(0);
      await collapsed.focus(); await page.keyboard.press('Enter');
      await expect(group).toBeFocused(); await expect(rows()).toHaveCount(25);
      const longRow = page.locator('[data-record-id="mock-generated-tpts-2"]');
      const longLabel = longRow.locator('[data-label-kind="resolution"]');
      await expect(longLabel).toHaveAttribute('title', 'Biện pháp: Khác: chờ quản lý xác nhận hướng xử lý phù hợp');
      if (!desktop) {
        expect(await longLabel.locator('.ui-list-label-text').evaluate(el => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis')).toBe(true);
        await longRow.locator('.store-ticket-open').click();
        await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true })).toContainText('Khác: chờ quản lý xác nhận hướng xử lý phù hợp');
        await page.keyboard.press('Escape');
      }
      await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
      const box = await rows().first().boundingBox();
      if (viewport.width === 390) { expect(box.height).toBeGreaterThanOrEqual(88); expect(box.height).toBeLessThanOrEqual(130); }
      if (desktop) {
        expect(box.height).toBeGreaterThanOrEqual(60);
        expect(await openers().first().evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
        expect(await page.locator('.ui-list-label').first().evaluate(el => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(26);
      }
      await page.screenshot({ path: `${output}/list-${viewport.width}.png` });
      results.push({ viewport, firstItem: box, contrast: await audit(page, '.store-kph-list, .store-kph-more', `list-${viewport.width}`) });
      const before = await rows().evaluateAll(elements => elements.map(el => el.dataset.recordId));
      await page.getByRole('button', { name: /Hiển thị thêm/ }).click();
      await expect(rows()).toHaveCount(29);
      const after = await rows().evaluateAll(elements => elements.map(el => el.dataset.recordId));
      expect(after.slice(0, 25)).toEqual(before); expect(new Set(after).size).toBe(29);
      await expect(openers().nth(25)).toBeFocused();
      await expect(page.getByRole('button', { name: /Hiển thị thêm/ })).toHaveCount(0);
      await openers().first().click();
      const detail = page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true });
      await expect(detail).toContainText('Cải thìa VietGAP 500 g'); await expect(detail).toContainText('0011730');
      await page.keyboard.press('Escape'); await expect(openers().first()).toBeFocused();
      if (process.env.STORE_KPH_SYNTHETIC_ROUTE === 'false') {
        expect(errors).toEqual([]); await page.close();
        console.log(`PASS build compact/history ${viewport.width}: density, append/unique IDs/focus, detail and touch`);
        continue;
      }
      // Load many same-day records to exercise a split batch and long OTHER labels.
      let applied = false;
      await page.route('**/src/store-app-mock.ts', async route => {
        const response = await route.fetch(); const body = await response.text();
        expect(body).toContain('const mockRecords'); applied = true;
        await route.fulfill({ response, body: body + fixturePatch });
      });
      await page.clock.setFixedTime(new Date('2026-10-22T04:00:00Z'));
      await page.reload(); await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      expect(applied).toBe(true); await expect(rows()).toHaveCount(25);
      await grouping(page, true);
      await expect(page.getByText('25/30 phiếu đã hiện')).toBeVisible();
      const today = () => page.getByRole('checkbox', { name: 'Chọn ngày 22/10/2026', exact: true });
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await today().check(); await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
      await touch(page.locator(desktop ? '.store-kph-table-selector' : '.store-ticket-selector'));
      await noOverflow(page);
      await page.screenshot({ path: `${output}/selected-long-labels-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Thu gọn ngày 22/10/2026', exact: true }).click();
      await expect(rows()).toHaveCount(0); await expect(today()).toBeChecked();
      await page.getByRole('button', { name: /Hiển thị thêm/ }).click();
      await expect(page.getByRole('button', { name: 'Thu gọn ngày 22/10/2026', exact: true })).toHaveAttribute('aria-expanded', 'true');
      await expect(rows()).toHaveCount(50);
      expect(await today().evaluate(el => el.indeterminate)).toBe(true);
      await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
      await today().check(); await expect(page.getByText('30 đã chọn', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
      const exportDialog = page.getByRole('dialog', { name: 'Xuất Excel', exact: true });
      await expect(exportDialog).toContainText('15 phiếu đã duyệt'); await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /Hiển thị thêm/ }).click(); await expect(rows()).toHaveCount(54);
      await page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }).click();
      const filter = page.getByRole('dialog', { name: 'Lọc & sắp xếp', exact: true });
      await touch(filter.locator('.store-kph-date-shortcuts button'));
      await filter.getByRole('button', { name: 'Hôm nay', exact: true }).click();
      await expect(filter.getByRole('textbox', { name: 'Từ ngày', exact: true })).toHaveValue('22/10/2026');
      await expect(filter.getByRole('textbox', { name: 'Đến ngày', exact: true })).toHaveValue('22/10/2026');
      await expect(rows()).toHaveCount(25); await expect(page.getByText('0 đã chọn', { exact: true })).toHaveCount(1);
      results.push({ viewport, quickFilterContrast: await audit(page, '.store-kph-date-shortcuts', `quick-${viewport.width}`) });
      await page.screenshot({ path: `${output}/quick-filter-${viewport.width}.png` });
      await filter.getByRole('button', { name: 'Hôm qua', exact: true }).click(); await expect(rows()).toHaveCount(22);
      await filter.getByRole('button', { name: 'Tuần này', exact: true }).click();
      await expect(filter.getByRole('textbox', { name: 'Từ ngày', exact: true })).toHaveValue('19/10/2026');
      await expect(page.locator('.store-result-count')).toHaveText('52 phiếu');
      await filter.getByRole('textbox', { name: 'Từ ngày', exact: true }).fill('20/10/2026');
      await expect(filter.getByRole('button', { name: 'Tuần này', exact: true })).toHaveAttribute('aria-pressed', 'false');
      await filter.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
      await filter.getByRole('button', { name: 'Xong', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true })).toBeFocused();
      await page.locator('.store-kph').evaluate(root => {
        const text = [...root.querySelectorAll('*')].filter(el => [...el.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()));
        const sizes = text.map(el => { const style = getComputedStyle(el); return { el, size: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) }; });
        for (const { el, size, line } of sizes) { el.style.fontSize = `${size * 1.5}px`; el.style.lineHeight = `${(Number.isFinite(line) ? line : size * 1.4) * 1.5}px`; }
      });
      await noOverflow(page); await touch(openers());
      await page.screenshot({ path: `${output}/large-text-${viewport.width}.png` });
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS compact/history ${viewport.width}: density, append/focus, day partial selection, export eligibility, quick filters, long labels/large text`);
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
