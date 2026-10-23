// DATE03 list hierarchy and selection. Synthetic fixtures only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4280';
const output = process.env.STORE_DATE_OUTPUT || '.local/date03/list';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });

async function noClip(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.store-date-lot').evaluateAll(lots => lots.flatMap(lot =>
    [lot, ...lot.querySelectorAll('strong,small,span')].filter(el => {
      if (el.closest('.sr-only,[aria-hidden="true"],.ui-list-label-category')) return false;
      return el.clientWidth && el.scrollWidth > el.clientWidth + 1;
    }).map(el => el.className)
  ))).toEqual([]);
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
      await page.goto(`${base}/#date`);
      await page.getByRole('button', { name: /Theo dõi DATE/ }).click();
      const lots = page.locator('.store-date-lot');
      await expect(lots).toHaveCount(7);
      await expect(page.locator('.store-date-lot[aria-pressed="true"]')).toHaveCount(0);
      const lot = page.locator('[data-date-lot-id="A24-301"]');
      await expect(lot.locator('.store-date-percent')).toHaveText('Còn 38% HSD');
      await expect(lot.locator('.store-date-percent-value')).toHaveCSS('font-size', '24px');
      await expect(lot.locator('.store-date-percent')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      await expect(lot.locator('.store-date-lot-dates')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
      expect(await lot.locator('.store-date-lot-dates').evaluate(el => getComputedStyle(el).fontWeight)).toBe('400');
      for (const card of await lots.all()) {
        await expect(card).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(card).toHaveAttribute('aria-pressed', 'false');
      }
      await lot.hover();
      await expect(lot).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      await lot.focus(); await page.keyboard.press('Enter');
      await expect(lot).toHaveAttribute('aria-pressed', 'true');
      await expect(lot).toHaveCSS('background-color', 'rgb(230, 247, 242)');
      await expect(page.locator('.store-date-lot[aria-pressed="true"]')).toHaveCount(1);
      const detail = viewport.width < 900 ? page.locator('.store-date-lot-sheet') : page.locator('.store-date-detail');
      await expect(detail).toBeVisible();
      await detail.evaluate(async root => Promise.all(root.getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
      // Audit the painted content: the absolute close control overlays the sibling green header.
      await audit(page, viewport.width < 900 ? '.store-date-lot-sheet .store-modal-body' : '.store-date', `selected-${viewport.width}`);
      await page.screenshot({ path: `${output}/selected-${viewport.width}.png`, fullPage: true });
      if (viewport.width < 900) {
        await page.keyboard.press('Escape'); await expect(lot).toBeFocused();
        await expect(lot).toHaveAttribute('aria-pressed', 'false');
        await expect(lot).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      } else {
        const other = page.locator('[data-date-lot-id="C24-118"]'); await other.click();
        await expect(lot).toHaveAttribute('aria-pressed', 'false');
        await expect(lot).toHaveCSS('background-color', 'rgb(255, 255, 255)');
      }
      await page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' }).fill('không có lô');
      await expect(page.locator('.store-date-lot[aria-pressed="true"]')).toHaveCount(0);
      await page.getByRole('button', { name: 'Xem tất cả lô' }).click();
      await expect(lots).toHaveCount(7);
      await noClip(page);
      await audit(page, '.store-date', `list-${viewport.width}`);
      await page.screenshot({ path: `${output}/list-${viewport.width}.png`, fullPage: true });
      await lots.evaluateAll(roots => {
        for (const root of roots) {
          const styles = [root, ...root.querySelectorAll('*')].map(el => {
            const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) };
          });
          for (const { el, font, line } of styles) {
            el.style.fontSize = `${font * 1.5}px`;
            if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`;
          }
        }
      });
      await noClip(page);
      await page.screenshot({ path: `${output}/text150-${viewport.width}.png`, fullPage: true });
      expect(errors).toEqual([]);
      results.push({ viewport, selection: true, whiteRestAndHover: true, percentPrimary: true, text150: true });
      console.log(`PASS DATE list ${viewport.width}: hierarchy, neutral surface, keyboard selection/reset, text150, contrast`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
