const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4197';
const output = '.local/progressive-loading/check';
fs.mkdirSync(output, { recursive: true });
const delay = () => { let release; return { promise: new Promise(resolve => { release = resolve; }), release: () => release() }; };
async function boxes(page, selectors) {
  return page.evaluate(selectors => Object.fromEntries(selectors.map(selector => {
    const element = document.querySelector(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    const { x, y, width, height } = element.getBoundingClientRect();
    return [selector, { x, y, width, height }];
  })), selectors);
}
function stable(before, after) {
  for (const key of Object.keys(before)) for (const dimension of ['x', 'y', 'width', 'height'])
    expect(Math.abs(before[key][dimension] - after[key][dimension]), `${key} ${dimension}: ${before[key][dimension]} → ${after[key][dimension]}`).toBeLessThanOrEqual(1);
}
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      for (const screen of ['kph', 'home']) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 2, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error(error.message); });
        page.on('console', message => { if (message.type() === 'error') console.error(message.text()); });
        await page.addInitScript(() => {
          window.layoutShifts = [];
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.layoutShifts.push({
              value: entry.value, input: entry.hadRecentInput,
              sources: entry.sources.map(source => ({ node: source.node?.className, previous: source.previousRect.toJSON(), current: source.currentRect.toJSON() })),
            });
          }).observe({ type: 'layout-shift', buffered: true });
        });
        const entry = delay(), workspace = delay(), art = delay();
        await page.route(/\/assets\/store-app-[\w-]{8}\.js$/, async route => { await entry.promise; await route.continue(); });
        await page.route('**/assets/store-kph-workspace-*.js', async route => { await workspace.promise; await route.continue(); });
        await page.route('**/brand/coopfood-home-*.webp', async route => { await art.promise; await route.continue(); });
        await page.goto(`${base}/#${screen}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true })).toBeDisabled();
        const chrome = ['.store-header', '.store-account', '#store-content', viewport.width < 900 ? '.store-mobile-toolbar' : '.store-desktop-rail'];
        const selectors = screen === 'home'
          ? [...chrome, '.store-launcher-grid', '.store-home-attention', '.store-header-brand img']
          : [...chrome, '.store-create-actions', '.store-kph-toolbar', '.store-list-heading', '.store-kph-list-controls', '.store-kph-list-toolbar', '.store-sticky-tabs', '.store-tabs', '.store-kph-list', '.store-pagination', viewport.width < 900 ? '.store-ticket' : '.store-kph-table'];
        const before = await boxes(page, selectors);
        await page.screenshot({ path: `${output}/${screen}-frame-${viewport.width}.png` });
        // Delay exceeds the 500ms input grace period: reveal shifts are counted.
        await page.waitForTimeout(700);
        entry.release();
        await expect(page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true })).toBeEnabled();
        if (screen === 'kph') {
          await expect(page.locator('.kph-loading-frame')).toBeVisible();
          stable(before, await boxes(page, selectors));
          workspace.release();
          await expect(page.locator('.kph-loading-frame')).toHaveCount(0);
        } else workspace.release();
        stable(before, await boxes(page, selectors));
        art.release();
        if (screen === 'home') {
          await page.locator('.store-header-brand img').evaluate(image => image.decode());
          stable(before, await boxes(page, selectors));
        }
        const shifts = await page.evaluate(() => window.layoutShifts);
        expect(shifts.reduce((sum, shift) => sum + shift.value, 0)).toBeLessThanOrEqual(0.005);
        await page.screenshot({ path: `${output}/${screen}-ready-${viewport.width}.png` });
        if (screen === 'kph') {
          const form = delay();
          await page.route('**/assets/create-record-dialog-*.js', async route => { await form.promise; await route.continue(); });
          await page.locator(viewport.width < 900 ? '.store-create-actions .create-tpts' : '.store-create-actions .create-tpcn').click();
          await expect(page.locator('.store-form-skeleton')).toBeVisible();
          if (viewport.width < 900) await page.locator('.store-form-skeleton').evaluate(form => { form.scrollTop = 120; });
          if (viewport.width < 900) await expect.poll(() => page.locator('.store-form-skeleton').evaluate(form => form.scrollTop)).toBe(120);
          const formSelectors = ['.create-dialog-header', '.create-dialog-title', '.store-create-screen > [data-slot="dialog-close"]', ...[1, 2, 3, 4, 5].map(number => `.form-section:nth-of-type(${number})`), '.create-dialog-footer'];
          const formBefore = await boxes(page, formSelectors);
          await page.screenshot({ path: `${output}/form-frame-${viewport.width}.png` });
          await page.waitForTimeout(700);
          form.release();
          await expect(page.getByRole('textbox', { name: 'Mã SKU / UPC', exact: true })).toBeVisible();
          if (viewport.width < 900) await expect.poll(() => page.locator('.create-dialog-form').evaluate(form => form.scrollTop)).toBe(120);
          stable(formBefore, await boxes(page, formSelectors));
          await page.screenshot({ path: `${output}/form-ready-${viewport.width}.png` });
        }
        const finalShifts = await page.evaluate(() => window.layoutShifts);
        if (finalShifts.length) console.log('layout shifts', viewport, screen, JSON.stringify(finalShifts));
        expect(finalShifts.reduce((sum, shift) => sum + shift.value, 0)).toBeLessThanOrEqual(0.005);
        expect(errors).toEqual([]);
        results.push({ viewport, screen, before, after: screen === 'home' ? await boxes(page, selectors) : 'geometry assertions passed', shifts: finalShifts, errors });
        await page.close();
      }
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(results.map(result => ({ viewport: result.viewport, screen: result.screen, shifts: result.shifts, errors: result.errors })));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
