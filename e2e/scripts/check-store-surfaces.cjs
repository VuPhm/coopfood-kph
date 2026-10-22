// Visual roles: a white canvas, subtle holder edges, explicit selected colors.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4262';
const output = process.env.STORE_SURFACES_OUTPUT || '.local/kph02/r4-surfaces';
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      for (const screen of ['home', 'kph', 'date', 'reports', 'shelf']) {
        const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.goto(`${base}/#${screen}`);
        await expect(page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true })).toBeEnabled();
        await expect(page.locator('.store-page-surface')).toBeVisible();
        if (screen === 'kph') await expect(page.locator('.kph-loading-frame')).toHaveCount(0);
        if (screen === 'reports') await expect(page.locator('.report-type-card').first()).toBeVisible();
        if (screen === 'date') await expect(page.locator('.store-date-lot').first()).toBeVisible();
        expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        const colors = await page.locator('.store-page-surface').evaluate(el => ({ background: getComputedStyle(el).backgroundColor, image: getComputedStyle(el).backgroundImage }));
        expect(colors.image).toBe('none');
        expect(colors.background).toBe('rgb(255, 255, 255)');
        let holder;
        if (screen === 'home') holder = page.locator('.store-home-attention > button').first();
        if (screen === 'kph') holder = page.locator(viewport.width < 900 ? '.store-ticket' : '.store-kph-table-wrap').first();
        if (screen === 'date') holder = page.locator('.store-date-lot:not(.is-active)').first();
        if (screen === 'shelf') holder = page.locator('.store-shelf-result');
        if (holder && await holder.count()) {
          const edge = await holder.evaluate(el => {
            const style = getComputedStyle(el);
            return { border: style.borderTopColor, width: parseFloat(style.borderTopWidth), shadow: style.boxShadow };
          });
          // White holders need a painted edge or shadow on the white canvas.
          expect((edge.width > 0 && edge.border !== colors.background && edge.border !== 'rgba(0, 0, 0, 0)') || edge.shadow !== 'none').toBe(true);
        }
        // The shelf form/result retain the previously accepted multi-layer radial glow.
        // The scoped auditor does not model that gradient; audit history on the changed
        // canvas and retain full-page screenshots for form/result visual review.
        const contrastScope = screen === 'shelf' ? '.store-shelf-history' : '.store-page-surface';
        const contrast = await audit(page, contrastScope, `${screen}-${viewport.width}`);
        await page.screenshot({ path: `${output}/${screen}-${viewport.width}.png` });
        expect(errors).toEqual([]); results.push({ screen, viewport, colors, contrastScope, contrast });
        await page.close();
      }
      console.log(`PASS Store surfaces ${viewport.width}: Home/KPH/DATE/reports/shelf, white canvas, holder edges, scoped text contrast and no overflow`);
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
