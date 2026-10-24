// Compact item candidate: compare against the accepted COMPACT01 runtime.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4345';
const baseline = process.env.STORE_BASELINE_URL || 'http://127.0.0.1:4344';
const output = process.env.STORE_KPH_ITEMS_OUTPUT || '.local/compact02/browser';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
const widths = [390, 1440, 320, 900, 844];
async function ready(page) {
  await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
}
async function geometry(page) {
  return page.locator('[data-record-id]').evaluateAll(rows => rows.map(row => {
    const b = row.getBoundingClientRect();
    return { id: row.dataset.recordId, box: [b.x, b.y + scrollY, b.width, b.height],
      labels: [...row.querySelectorAll('[data-label-kind]')].map(el => el.title).sort() };
  }));
}
function parity(a, b) {
  expect(a.length).toBe(b.length);
  a.forEach((row, i) => {
    expect(row.id).toBe(b[i].id); expect(row.labels).toEqual(b[i].labels);
    row.box.forEach((n, j) => expect(Math.abs(n - b[i].box[j])).toBeLessThanOrEqual(1));
  });
}
async function bounds(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
async function grouping(page, enabled) {
  await page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Lọc & sắp xếp', exact: true });
  const toggle = dialog.getByRole('switch', { name: 'Nhóm theo ngày', exact: true });
  if (await toggle.getAttribute('aria-checked') !== String(enabled)) await toggle.click();
  await dialog.getByRole('button', { name: 'Xong', exact: true }).click();
}
async function density(page, compact) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).click();
  const toggle = page.getByRole('switch', { name: 'Chế độ gọn', exact: true });
  await toggle.focus(); await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-checked', String(compact));
  await page.keyboard.press('Escape'); await ready(page);
}
async function stress(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, hasTouch: true, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const condition = 'Khác: bao bì bị ảnh hưởng cần kiểm tra nội dung đầy đủ và giữ nguyên chữ';
  const resolution = 'Khác: chờ hướng dẫn xử lý từ quản lý cửa hàng';
  const name = 'Sản phẩm thử tên rất dài để kiểm tra phân cấp thông tin khi chọn phiếu và phóng lớn chữ';
  await page.addInitScript(() => localStorage.setItem('coopfood.store-ui.density.v1', 'compact'));
  let applied = false;
  await page.route('**/src/store-app-mock.ts', async route => {
    const response = await route.fetch(), body = await response.text();
    expect(body).toContain('const mockRecords'); applied = true;
    const patch = `\nconst itemBase = mockRecords[0];\nmockRecords.splice(0, mockRecords.length, ...Array.from({length: 54}, (_, i) => ({...itemBase, id: 'item-stress-' + i, productName: i === 0 ? ${JSON.stringify(name)} : 'Hàng thử ' + i, sku: i < 2 ? '' : '0000' + i, barcode: i === 0 ? '0000123456789' : '', quantity: '123456.75 kg', condition: ${JSON.stringify(condition)}, resolution: ${JSON.stringify(resolution)}, approvalStatus: i === 2 ? 'PENDING' : 'REJECTED', detectedDate: i < 30 ? '22/10/2026' : '21/10/2026'})));`;
    await route.fulfill({ response, body: body + patch });
  });
  await page.goto(`${base}/#kph`); await ready(page); expect(applied).toBe(true);
  const first = page.locator('[data-record-id="item-stress-0"]');
  await expect(first.locator('.store-ticket-sku')).toHaveText('UPC 0000123456789');
  await expect(page.locator('[data-record-id="item-stress-1"] .store-ticket-sku')).toHaveText('Nhập tay');
  await expect(first.locator('.store-ticket-open')).toHaveAccessibleDescription('Trạng thái duyệt: Không duyệt');
  await page.getByRole('button', { name: 'Chọn', exact: true }).click();
  const day = page.getByRole('checkbox', { name: 'Chọn ngày 22/10/2026', exact: true });
  await day.check(); await expect(page.getByText('25/30 phiếu đã hiện', { exact: true })).toBeVisible();
  await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
  await expect(first.locator('.store-ticket-approval')).toHaveClass(/is-icon-only/);
  await expect(first.locator('.store-ticket-open')).toHaveAccessibleDescription('Trạng thái duyệt: Không duyệt');
  const pending = page.locator('[data-record-id="item-stress-2"] .store-ticket-approval');
  await expect(pending).not.toHaveClass(/is-icon-only/); await expect(pending).toContainText('Chờ duyệt');
  const strip = first.locator('.store-ticket-tags');
  await expect(strip).toHaveAttribute('tabindex', '0'); await strip.scrollIntoViewIfNeeded();
  await strip.focus(); await page.keyboard.press('ArrowRight');
  await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await strip.evaluate(el => { el.scrollLeft = 0; });
  const box = await strip.boundingBox(), cdp = await page.context().newCDPSession(page);
  const y = box.y + box.height / 2, x = box.x + box.width - 16;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 6; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 20, y }] });
    await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await cdp.detach();
  await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(day).toBeChecked();
  // Approval remains outside the scrolled/masked strip, and OTHER keeps its full value.
  await expect(first.locator('.store-ticket-approval')).toBeVisible();
  await expect(first.locator('[data-label-kind="condition"]')).toHaveAttribute('title', `Tình trạng: ${condition}`);
  await first.locator('.store-ticket-open').click();
  const detail = page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true });
  await expect(detail).toContainText(name); await expect(detail).toContainText(condition); await expect(detail).toContainText(resolution);
  await page.keyboard.press('Escape'); await expect(first.locator('.store-ticket-open')).toBeFocused();
  await bounds(page); await page.screenshot({ path: `${output}/stress-selected-${width}.png` });
  await page.setViewportSize({ width: 844, height: 844 });
  await expect(first.locator('.store-ticket-approval')).not.toHaveClass(/is-icon-only/);
  await page.setViewportSize({ width, height: 844 });
  await expect(first.locator('.store-ticket-approval')).toHaveClass(/is-icon-only/);
  await page.getByRole('button', { name: /Hiển thị thêm/ }).click();
  await expect(page.locator('[data-record-id]')).toHaveCount(50);
  await expect(day).not.toBeChecked(); expect(await day.evaluate(el => el.indeterminate)).toBe(true);
  await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
  console.log(`PASS KPH item stress ${width}: long name/OTHER, UPC/manual, independent touch/keyboard strip, partial-day selection`);
  await page.close();
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const width of widths) {
      const viewport = { width, height: width === 1440 ? 1024 : width === 844 ? 390 : width === 900 ? 650 : 844 };
      const page = await browser.newPage({ viewport, hasTouch: width < 900, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const old = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      page.setDefaultTimeout(10000);
      await Promise.all([page.goto(`${base}/#kph`), old.goto(`${baseline}/#kph`)]);
      await Promise.all([ready(page), ready(old)]);
      parity(await geometry(page), await geometry(old)); // comfortable unchanged, all25 rows
      await density(page, true); await density(old, true);
      const prior = await geometry(old), compact = await geometry(page);
      expect(compact.map(r => [r.id, r.labels])).toEqual(prior.map(r => [r.id, r.labels]));
      expect(compact[0].box[3]).toBeLessThanOrEqual(prior[0].box[3]);
      const desktop = width >= 900;
      const rows = () => page.locator('[data-record-id]');
      const openers = () => page.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open');
      if (!desktop) {
        await expect(rows().first().locator('.store-ticket-tags [data-label-kind]')).toHaveCount(2);
        await expect(openers().first().locator('[data-label-kind="approval"]')).toHaveCount(1);
        await expect(openers().first()).toHaveAccessibleDescription('Trạng thái duyệt: Đã duyệt');
      }
      if (desktop) expect(await rows().locator('[data-label-kind="approval"] .ui-list-label-text').evaluateAll(labels => labels.every(el => el.clientWidth <= 1 || el.scrollWidth <= el.clientWidth + 1))).toBe(true);
      const contrast = await audit(page, '.store-kph-list', `compact-${width}`);
      await bounds(page);
      await page.screenshot({ path: `${output}/compact-${width}.png` });
      await grouping(page, false);
      await expect(page.locator('.store-kph-record-date, .store-ticket-date').first()).toContainText('15/08/2026');
      await grouping(page, true);
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      const day = page.getByRole('checkbox', { name: 'Chọn ngày 14/08/2026', exact: true });
      await day.locator('..').click({ position: { x: 4, y: 4 } });
      await expect(page.getByText('5 đã chọn', { exact: true })).toBeVisible();
      const collapse = page.getByRole('button', { name: 'Thu gọn ngày 14/08/2026', exact: true });
      await collapse.click(); await expect(rows()).toHaveCount(20); await expect(day).toBeChecked();
      await density(page, false); await expect(rows()).toHaveCount(20); await expect(day).toBeChecked();
      await density(page, true); await expect(rows()).toHaveCount(20); await expect(day).toBeChecked();
      await page.getByRole('button', { name: 'Mở rộng ngày 14/08/2026', exact: true }).click();
      await expect(rows()).toHaveCount(25);
      for (const selector of [openers(), page.locator('.store-kph-day-selector')]) {
        for (const el of await selector.all()) {
          const b = await el.boundingBox(); expect(b.width).toBeGreaterThanOrEqual(44); expect(b.height).toBeGreaterThanOrEqual(44);
        }
      }
      if (!desktop) for (const factor of [1.5, 2]) {
        await page.locator('.store-kph-list').evaluate((root, f) => {
          const nodes = [...root.querySelectorAll('.store-ticket-open > strong, .store-ticket-sku, .store-ticket-meta, .ui-list-label')];
          const sizes = nodes.map(el => ({ el, font: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) }));
          for (const { el, font, line } of sizes) { el.dataset.originalStyle = el.getAttribute('style') || ''; el.style.fontSize = `${font * f}px`; el.style.lineHeight = `${line * f}px`; }
        }, factor);
        await bounds(page);
        expect(await page.locator('.store-ticket-approval').evaluateAll(labels => labels.every(el => {
          const b = el.getBoundingClientRect(), p = el.parentElement.getBoundingClientRect();
          return b.x >= p.x - 1 && b.right <= p.right + 1 && el.scrollWidth <= el.clientWidth + 1;
        }))).toBe(true);
        await page.screenshot({ path: `${output}/selected-text-${factor * 100}-${width}.png` });
        await page.locator('[data-original-style]').evaluateAll(nodes => nodes.forEach(el => { el.setAttribute('style', el.dataset.originalStyle); delete el.dataset.originalStyle; }));
      }
      await page.getByRole('button', { name: 'Xong', exact: true }).click();
      await page.getByRole('button', { name: /Hiển thị thêm/ }).click();
      await expect(rows()).toHaveCount(29); await expect(openers().nth(25)).toBeFocused();
      expect(new Set(await rows().evaluateAll(elements => elements.map(el => el.dataset.recordId))).size).toBe(29);
      const custom = page.locator('[data-record-id="mock-generated-tpts-2"]');
      await custom.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open').click();
      await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true })).toContainText('Khác: chờ quản lý xác nhận hướng xử lý phù hợp');
      await page.keyboard.press('Escape');
      await expect(custom.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open')).toBeFocused();
      // Print uses the original three-label composition despite Compact screen preference.
      await page.reload(); await ready(page); await page.emulateMedia({ media: 'print' }); await ready(page);
      await old.emulateMedia({ media: 'print' }); await ready(old);
      parity(await geometry(page), await geometry(old));
      await page.emulateMedia({ media: 'screen' }); await ready(page);
      if (!desktop) await expect(rows().first().locator('.store-ticket-tags [data-label-kind]')).toHaveCount(2);
      expect(errors).toEqual([]);
      results.push({ viewport, beforeHeight: prior[0].box[3], afterHeight: compact[0].box[3], contrast });
      console.log(`PASS KPH item density ${width}: comfortable/print parity, labels, selection/collapse/toggle, append/focus, reflow`);
      await page.close(); await old.close();
    }
    if (process.env.STORE_KPH_ITEMS_SYNTHETIC_ROUTE === 'true') for (const width of [390, 320]) await stress(browser, width);
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
