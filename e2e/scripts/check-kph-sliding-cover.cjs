const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4215';
const output = '.local/kph-sliding-cover/check';
fs.mkdirSync(output, { recursive: true });
async function geometry(page) {
  return page.evaluate(() => {
    const box = selector => {
      const { x, y, width, height } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height };
    };
    return { scroll: scrollY, underlay: box('.store-kph-underlay'), cover: box('.store-ticket-list'), tabs: box('.store-tabs') };
  });
}
async function covered(page) {
  return page.evaluate(() => {
    const underlay = document.querySelector('.store-kph-underlay');
    const cover = document.querySelector('.store-ticket-list');
    const box = underlay.getBoundingClientRect();
    return cover.contains(document.elementFromPoint(box.x + box.width / 2, Math.max(12, box.y + box.height / 2)));
  });
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#kph`);
      await page.locator('.store-kph:not(.kph-loading-frame)').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const initial = await geometry(page);
      expect(initial.tabs.y).toBeGreaterThan(initial.cover.y);
      const searchBox = await page.locator('.store-kph-search input').boundingBox();
      const createBox = await page.locator('.store-create-actions').boundingBox();
      expect(createBox.y - searchBox.y - searchBox.height).toBeGreaterThanOrEqual(8);
      expect(initial.cover.y - createBox.y - createBox.height).toBeGreaterThanOrEqual(8);
      const recordCopy = await page.locator('.store-kph-list').innerText();
      await page.screenshot({ path: `${output}/initial-${viewport.width}.png` });

      await page.mouse.move(viewport.width - 30, Math.min(viewport.height - 130, initial.cover.y + 120));
      await page.mouse.wheel(0, 100);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(80);
      const midway = await geometry(page);
      expect(midway.cover.y).toBeCloseTo(initial.cover.y - midway.scroll, 0);
      expect(midway.underlay.y).toBeCloseTo(0, 0);
      await page.screenshot({ path: `${output}/midway-${viewport.width}.png` });
      await page.mouse.wheel(0, 220);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(280);
      expect((await geometry(page)).underlay.y).toBeCloseTo(0, 0);
      expect(await covered(page)).toBe(true);
      expect(await page.locator('.store-kph-list').innerText()).toBe(recordCopy);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${output}/raised-${viewport.width}.png` });

      // Covered upper controls remain available to keyboard users.
      const create = page.locator('.store-create-actions .create-tpts');
      await create.focus(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.keyboard.press('Enter');
      await expect(page.locator('#product-name')).toBeVisible();
      await page.keyboard.press('Escape'); await expect(create).toBeFocused();
      await page.evaluate(() => window.scrollTo(0, 320));
      const search = page.getByRole('textbox', { name: 'Tìm tên hàng hoặc SKU', exact: true });
      await search.focus(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await search.fill('không có hàng mẫu này');
      await expect(page.getByText('Không có phiếu phù hợp bộ lọc.', { exact: true })).toBeVisible();
      expect((await geometry(page)).cover.height).toBeGreaterThanOrEqual(viewport.height);
      await page.mouse.wheel(0, 320);
      await expect.poll(() => covered(page)).toBe(true);
      await page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).focus();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await search.fill('');

      await page.evaluate(() => {
        [...document.querySelectorAll('.store-kph h2, .store-kph span, .store-kph button, .store-kph input, .store-create-actions strong, .store-create-actions small, .store-tabs small')]
          .map(el => ({ el, font: parseFloat(getComputedStyle(el).fontSize) * 1.5, line: parseFloat(getComputedStyle(el).lineHeight) * 1.5 }))
          .forEach(({ el, font, line }) => { el.style.fontSize = `${font}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line}px`; });
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${output}/text150-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
      await expect(page).toHaveURL(/#home$/);
      if (viewport.width < 900) await page.getByRole('link', { name: 'KPH', exact: true }).click();
      else await page.locator('.store-desktop-rail').getByRole('button', { name: 'KPH', exact: true }).click();
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(errors).toEqual([]);
      results.push({ viewport, initial, midway, nativeScroll: true, occlusion: true, focusReveal: true, emptyList: true, text150: true, routeReset: true });
      console.log(`PASS cover ${viewport.width}: scroll/occlusion/focus/create/empty list/text150/route`);
      await page.close();
    }
  } finally { fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
