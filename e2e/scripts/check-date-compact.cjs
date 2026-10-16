// Compact DATE: no repeated summaries, metadata on demand, CTAs without scrolling.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_DATE_OUTPUT || '.local/date-compact-20261012/compact';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
async function geometry(detail, viewport) {
  const r = await detail.evaluate(el => {
    const box = el.getBoundingClientRect();
    const action = el.querySelector('.store-sheet-actions').getBoundingClientRect();
    const heading = el.querySelector('.store-date-lot-heading').getBoundingClientRect();
    return { height: box.height, bottom: box.bottom, content: el.scrollHeight, client: el.clientHeight,
      actionTop: action.y, actionBottom: action.bottom, headingHeight: heading.height };
  });
  expect(r.actionBottom, 'actions are visible before any scroll').toBeLessThanOrEqual(viewport.height + 1);
  expect(r.actionTop).toBeGreaterThanOrEqual(0);
  expect(r.content - r.client, 'detail does not need vertical scrolling').toBeLessThanOrEqual(1);
  for (const name of ['Ghi nhận', 'Đã xử lý']) {
    const b = await detail.getByRole('button', { name, exact: true }).boundingBox();
    expect(b.height).toBeGreaterThanOrEqual(48); expect(b.width).toBeGreaterThanOrEqual(44);
  }
  return r;
}
async function noClipping(page, selector) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(selector).evaluate(root => [...root.querySelectorAll('h2, h3, summary, button, p, dd')].filter(el => {
    if (el.closest('.sr-only, [aria-hidden="true"]')) return false;
    const b = el.getBoundingClientRect(); return b.width && el.scrollWidth > el.clientWidth + 1;
  }).map(el => el.className))).toEqual([]);
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.clock.setFixedTime(new Date('2026-10-12T05:00:00+07:00'));
      await page.goto(`${base}/#date`); await page.evaluate(() => document.fonts.ready);
      const input = page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' });
      await input.fill('A24-255');
      const product = page.getByRole('region', { name: 'Thông tin mã hàng', exact: true });
      const disclosure = product.locator('details'), summary = product.locator('summary');
      await expect(disclosure).not.toHaveAttribute('open', '');
      await expect(product.getByText('Thực phẩm khô', { exact: true })).toBeHidden();
      const closed = await product.boundingBox(); expect(closed.height).toBeLessThanOrEqual(80);
      await summary.focus(); await page.keyboard.press('Enter');
      await expect(product.getByText('Thực phẩm khô', { exact: true })).toBeVisible();
      await expect(product).toContainText('NCC001');
      await audit(page, '.store-date', `product-open-${viewport.width}`);
      await page.screenshot({ path: `${output}/product-open-${viewport.width}.png` });
      await page.keyboard.press('Space');
      await expect(product.getByText('Thực phẩm khô', { exact: true })).toBeHidden();
      await page.screenshot({ path: `${output}/lookup-compact-${viewport.width}.png`, fullPage: true });
      for (const id of ['A24-255', 'C24-118', 'D24-090', 'A24-301']) {
        await input.fill(id);
        if (id === 'D24-090') await expect(product).toHaveCount(0);
        else await expect(disclosure).not.toHaveAttribute('open', '');
        await page.locator('.store-date-lot').click();
        const detail = viewport.width >= 900 ? page.getByRole('region', { name: 'Chi tiết lô DATE' }) : page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
        await expect(detail.locator('.store-date-lot-heading')).toContainText(`Lô ${id}`);
        await expect(detail.locator('.store-summary, .store-date-key-date, .store-date-resolution, .store-date-detail-note')).toHaveCount(0);
        await expect(detail).not.toContainText('Ghi nhận khi cửa hàng');
        const measurements = await geometry(detail, viewport);
        await noClipping(page, viewport.width >= 900 ? '.store-date-detail' : '.store-date-lot-sheet');
        await audit(page, viewport.width >= 900 ? '.store-date-detail' : '.store-date-lot-sheet', `detail-${id}-${viewport.width}`);
        await page.screenshot({ path: `${output}/detail-${id}-${viewport.width}.png`, fullPage: viewport.width >= 900 });
        results.push({ viewport, id, productHeight: id === 'D24-090' ? 0 : closed.height, detail: measurements });
        if (id === 'A24-301') {
          await detail.evaluate(root => {
            const styles = [...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
            for (const { el, font, line } of styles) { el.style.fontSize = `${font * 1.5}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`; }
          });
          await noClipping(page, viewport.width >= 900 ? '.store-date-detail' : '.store-date-lot-sheet');
          await geometry(detail, viewport);
          await page.screenshot({ path: `${output}/detail-text-150-${viewport.width}.png`, fullPage: viewport.width >= 900 });
        }
        if (viewport.width < 900) await page.keyboard.press('Escape');
      }
      await product.evaluate(root => {
        const styles = [...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
        for (const { el, font, line } of styles) { el.style.fontSize = `${font * 1.5}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`; }
      });
      await summary.click();
      await noClipping(page, '.store-date-product');
      await page.screenshot({ path: `${output}/product-text-150-${viewport.width}.png`, fullPage: true });
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS compact DATE ${viewport.width}: product disclosure/keyboard, 4 lot states, both actions without scrolling, contrast and 150% text`);
    }
    fs.writeFileSync(`${output}/geometry.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
