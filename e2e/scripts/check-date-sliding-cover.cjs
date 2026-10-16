const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4215';
const output = process.env.STORE_DATE_OUTPUT || '.local/date-sliding-cover/check';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
async function geometry(page) {
  return page.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
    return { scroll: scrollY, underlay: box('.store-date-search-panel'), cover: box('.store-date-workspace'), tabs: box('.store-date .store-tabs'), first: box('.store-date-lot') };
  });
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-12T05:00:00+07:00'));
      await page.goto(`${base}/#date`); await page.locator('.store-date-lot').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const initial = await geometry(page);
      const content = await page.locator('.store-date-lot').allTextContents();
      expect(initial.cover.height).toBeGreaterThanOrEqual(viewport.height);
      const search = page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' });
      const form = await page.locator('.store-date-search-form').boundingBox();
      expect(initial.cover.y - form.y - form.height).toBe(8);
      await audit(page, '.store-screen-date', `initial-${viewport.width}`);
      await page.screenshot({ path: `${output}/initial-${viewport.width}.png` });

      await page.mouse.move(viewport.width - 30, Math.min(viewport.height - 130, initial.cover.y + 100));
      await page.mouse.wheel(0, 100);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(80);
      const midway = await geometry(page);
      expect(midway.underlay.y).toBeCloseTo(0, 0);
      expect(midway.cover.y).toBeCloseTo(initial.cover.y - midway.scroll, 0);
      await page.screenshot({ path: `${output}/midway-${viewport.width}.png` });
      await page.mouse.wheel(0, 2000);
      await expect.poll(async () => (await geometry(page)).cover.y).toBeLessThanOrEqual(0);
      expect(await page.evaluate(() => {
        const cover = document.querySelector('.store-date-workspace'), rect = document.querySelector('.store-date-search-panel').getBoundingClientRect();
        return cover.contains(document.elementFromPoint(rect.x + rect.width / 2, Math.max(12, rect.y + rect.height / 2)));
      })).toBe(true);
      expect(await page.locator('.store-date-lot').allTextContents()).toEqual(content);
      await page.screenshot({ path: `${output}/raised-${viewport.width}.png` });

      await search.focus(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Quét mã để tìm lô DATE', exact: true })).toBeFocused();
      await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Tìm mã hàng', exact: true })).toBeFocused();
      await audit(page, '.store-date-search-panel', `focus-${viewport.width}`);
      await search.fill('0008421');
      const summary = page.locator('.store-date-product summary');
      expect(await summary.evaluate(el => !!el.closest('.store-date-workspace'))).toBe(true);
      await summary.focus(); await page.keyboard.press('Enter');
      await expect(page.locator('.store-date-product details')).toHaveAttribute('open', '');
      await expect(page.locator('.store-date-product')).toContainText('Nhà cung cấp');
      await page.screenshot({ path: `${output}/metadata-${viewport.width}.png` });
      await page.keyboard.press('Enter'); await search.fill('không có lô mẫu này');
      await expect(page.getByRole('heading', { name: 'Không có lô phù hợp', exact: true })).toBeVisible();
      await page.mouse.move(viewport.width - 30, viewport.height / 2); await page.mouse.wheel(0, 2000);
      await expect.poll(() => page.locator('.store-date-workspace').evaluate(el => el.getBoundingClientRect().y)).toBeLessThanOrEqual(0);
      const account = page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true });
      await account.focus(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await search.fill('');
      await page.getByRole('group', { name: 'Quản lý DATE' }).getByRole('button', { name: /^Cảnh báo/ }).click();
      await page.evaluate(() => {
        const elements = [...document.querySelectorAll('.store-date h2, .store-date button, .store-date input, .store-date span, .store-date small')]
          .map(el => ({ el, font: parseFloat(getComputedStyle(el).fontSize) * 1.5, line: parseFloat(getComputedStyle(el).lineHeight) * 1.5 }));
        for (const { el, font, line } of elements) { el.style.fontSize = `${font}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line}px`; }
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const clipped = await page.locator('.store-date .store-tabs button, .store-date-statuses button, .store-date-toolbar button:not(.store-filter), .store-date-list-heading')
        .evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1).map(el => el.className));
      expect(clipped).toEqual([]);
      await page.screenshot({ path: `${output}/text150-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
      await expect(page).toHaveURL(/#home$/);
      await expect(page.locator(viewport.width < 900 ? '.store-launcher-mobile' : '.store-launcher-desktop')).toBeVisible();
      if (viewport.width < 900) await page.getByRole('link', { name: 'DATE', exact: true }).click();
      else await page.locator('.store-desktop-rail').getByRole('button', { name: 'DATE', exact: true }).click();
      await expect(page.locator('.store-date-lot').first()).toBeVisible();
      // Chromium's native link focus can settle within two CSS pixels of the top.
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThanOrEqual(2);
      await expect(search).toBeInViewport();
      await expect(account).toBeInViewport();
      expect(errors).toEqual([]);
      results.push({ viewport, initial, midway, content, scroll: true, focus: true, metadata: true, emptyList: true, text150: true });
      console.log(`PASS DATE cover ${viewport.width}: native scroll/occlusion/focus/metadata/empty list/150%/route`);
      await page.close();
    }
  } finally { fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
