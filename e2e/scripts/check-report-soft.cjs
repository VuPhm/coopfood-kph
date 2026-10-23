// Isolate the report material: preserve chart/print colors and unrelated consumers.
// Existing report gates cover selection, templates, snapshots, exports and keyboard flows.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4285';
const baseline = process.env.STORE_BASELINE_URL || 'http://127.0.0.1:4284';
const output = process.env.STORE_REPORT_OUTPUT || '.local/reports02/soft';
fs.mkdirSync(output, { recursive: true });
async function colors(scope) {
  return scope.evaluateAll(roots => roots.flatMap(root => [root, ...root.querySelectorAll('*')].flatMap(el => [null, '::before', '::after'].map(pseudo => {
    const style = getComputedStyle(el, pseudo);
    return { tag: el.tagName, cls: el.className, pseudo, color: style.color, fill: style.backgroundColor, image: style.backgroundImage, edge: style.borderColor, collapse: style.borderCollapse, radius: style.borderRadius, shadow: style.boxShadow };
  }))));
}
async function settle(page) {
  await page.locator('body').evaluate(async el => Promise.all(el.getAnimations({ subtree: true }).filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))));
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
      await page.goto(`${base}/#reports`);
      await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const tile = page.locator('.report-type-card').first();
      await expect(tile).not.toHaveCSS('background-image', 'none');
      await page.screenshot({ path: `${output}/menu-${viewport.width}.png` });
      await page.getByRole('button', { name: /^Báo cáo tổng hợp/ }).click();
      // Small surfaces only: no per-card, table, group or sheet backdrop filtering.
      expect(await page.locator('.report-composer').evaluate(root => [root, ...root.querySelectorAll('*')].filter(el => getComputedStyle(el).backdropFilter !== 'none' && !el.matches('.store-action-dock[data-floating="true"]')).length)).toBe(0);
      await page.getByRole('button', { name: 'Chi tiết lô A24-301', exact: true }).click();
      await settle(page);
      const timeline = page.locator('.date-report-sheet .store-timeline');
      await expect(timeline).toBeVisible();
      const chart = await colors(timeline);
      const old = await browser.newPage({ viewport, serviceWorkers: 'block' });
      await old.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
      await old.goto(`${baseline}/#reports`);
      await old.getByRole('button', { name: /^Báo cáo tổng hợp/ }).click();
      await old.getByRole('button', { name: 'Chi tiết lô A24-301', exact: true }).click();
      await settle(old);
      expect(await colors(old.locator('.date-report-sheet .store-timeline'))).toEqual(chart);
      await old.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true }).click();
      await page.getByRole('button', { name: 'Tạo và lưu lịch sử', exact: true }).click();
      await expect(page.locator('.date-report.is-document')).toBeVisible();
      await settle(page);
      await page.screenshot({ path: `${output}/document-${viewport.width}.png` });
      await page.emulateMedia({ media: 'print' });
      const document = page.locator('.date-report.is-document');
      await expect(document).toHaveAttribute('data-printing', 'true');
      await expect(document.locator('tbody tr')).toHaveCount(7);
      await expect(document.locator('.date-report-table')).toBeVisible();
      const print = await colors(document);
      // Baseline has the old inline-utility overlap; keyboard activates its snapshot for parity only.
      await old.getByRole('button', { name: 'Tạo bản báo cáo', exact: true }).focus();
      await old.keyboard.press('Enter');
      await old.getByRole('button', { name: 'Tạo và lưu lịch sử', exact: true }).click();
      await settle(old);
      await old.emulateMedia({ media: 'print' });
      await expect(old.locator('.date-report.is-document')).toHaveAttribute('data-printing', 'true');
      expect(await colors(old.locator('.date-report.is-document'))).toEqual(print);
      await old.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      await page.emulateMedia({ media: 'screen', reducedMotion: 'reduce' });
      for (const route of ['home', 'date', 'kph', 'shelf', 'notifications', 'login']) {
        await page.goto(`${base}/#${route}`);
        await expect(page.locator('.store-header')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await settle(page);
        const scope = page.locator('.store-page-layout');
        await old.goto(`${baseline}/#${route}`);
        await expect(old.locator('.store-header')).toBeVisible();
        await old.evaluate(() => document.fonts.ready);
        await settle(old);
        await page.mouse.move(0,0);
        await old.mouse.move(0,0);
        expect(await colors(scope), `No material leak to ${route}`).toEqual(await colors(old.locator('.store-page-layout')));
      }
      expect(errors).toEqual([]);
      await old.close();
      await page.close();
      console.log(`PASS report material ${viewport.width}: soft tiles present, chart/print parity, no extra blur, six other screens unchanged`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
