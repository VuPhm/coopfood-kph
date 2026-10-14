// Stable KPH creation surface across lazy loading, review, resize, cancellation and submit.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_CREATE_OUTPUT || '.local/kph-create-panel';
fs.mkdirSync(output, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=', 'base64');
const settled = surface => expect.poll(() => surface.evaluate(el => el.getAnimations().every(a => a.playState !== 'running'))).toBe(true);
async function bounded(page, surface) {
  const v = page.viewportSize();
  await expect.poll(() => page.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual(v);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const r = await surface.boundingBox();
  expect(r.x).toBeGreaterThanOrEqual(-1); expect(r.y).toBeGreaterThanOrEqual(-1);
  expect(r.x + r.width).toBeLessThanOrEqual(v.width + 1); expect(r.y + r.height).toBeLessThanOrEqual(v.height + 1);
  if (v.width < 900) { expect(Math.abs(r.y + r.height - v.height)).toBeLessThanOrEqual(1); expect(r.y).toBeGreaterThanOrEqual(23); }
  else { expect(Math.abs(r.x + r.width / 2 - v.width / 2)).toBeLessThanOrEqual(1); expect(Math.abs(r.y + r.height / 2 - v.height / 2)).toBeLessThanOrEqual(1); }
  expect(await surface.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const close = surface.getByRole('button', { name: 'Đóng', exact: true });
  const c = await close.boundingBox(); expect(c.width).toBe(44); expect(c.height).toBe(44);
}
async function sameSurface(page) {
  expect(await page.evaluate(() => window.createSurface.isConnected && document.querySelector('.store-create-screen') === window.createSurface && window.createOverlay.isConnected)).toBe(true);
}
(async () => {
  const browser = await chromium.launch(), results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        const page = await browser.newPage({ viewport, reducedMotion, serviceWorkers: 'block' });
        page.setDefaultTimeout(12000); const errors = []; page.on('pageerror', e => errors.push(e.message));
        const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
        let release; const gate = new Promise(resolve => { release = resolve; });
        await page.route('**/assets/create-record-dialog-*.js', async route => { await gate; await route.continue(); });
        await page.goto(`${base}/#kph`); await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => {
          window.createAnimations = [];
          document.addEventListener('animationstart', event => {
            if (event.target.matches('.store-create-screen')) window.createAnimations.push({ name: event.animationName, state: event.target.dataset.state });
          });
        });
        await page.screenshot({ path: `${output}/ctas-${viewport.width}-${reducedMotion}.png` });
        const first = page.locator('.create-tpcn'); await first.click();
        const surface = page.locator('.store-create-screen'); await expect(surface.locator('.store-form-skeleton')).toBeVisible(); await settled(surface);
        await bounded(page, surface);
        const initialBounds = await surface.boundingBox();
        await expect(surface.getByRole('button', { name: 'Đóng', exact: true })).toBeFocused();
        await surface.locator('.store-form-skeleton').evaluate(el => { el.scrollTop = 180; });
        await page.evaluate(() => { window.createSurface = document.querySelector('.store-create-screen'); window.createOverlay = document.querySelector('[data-slot="dialog-overlay"]'); });
        await page.screenshot({ path: `${output}/loading-${viewport.width}-${reducedMotion}.png` });
        const sectionBounds = await surface.locator('.form-section').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().toJSON()));
        release(); await expect(surface.locator('#product-name')).toBeAttached(); await expect(surface.locator('.store-form-skeleton')).toHaveCount(0);
        await sameSurface(page); expect(await surface.boundingBox()).toEqual(initialBounds);
        expect(await surface.locator('.create-dialog-form').evaluate(el => el.scrollTop)).toBe(180);
        const readyBounds = await surface.locator('.form-section').evaluateAll(nodes => nodes.map(el => el.getBoundingClientRect().toJSON()));
        for (let i = 0; i < sectionBounds.length; i++) for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(sectionBounds[i][key] - readyBounds[i][key]), `loading section ${i + 1} ${key}`).toBeLessThanOrEqual(1);
        const initialAnimations = await page.evaluate(() => window.createAnimations.filter(a => a.state === 'open').length);
        expect(initialAnimations, 'one opening animation, no second pop after lazy load').toBe(reducedMotion === 'reduce' ? 0 : 1);
        await page.screenshot({ path: `${output}/ready-${viewport.width}-${reducedMotion}.png` });
        await surface.locator('.create-dialog-form').evaluate(el => { el.scrollTop = 0; });
        await surface.locator('#product-name').fill('Bản nháp sẽ hủy');
        await surface.getByRole('button', { name: 'Đóng', exact: true }).click();
        if (reducedMotion !== 'reduce') await expect(surface.locator('#product-name')).toHaveValue('Bản nháp sẽ hủy');
        await expect(surface).toHaveCount(0); await expect(first).toBeFocused();
        for (const kind of ['tpcn', 'tpts']) {
          const opener = page.locator(`.create-${kind}`); await opener.click(); await expect(surface.locator('#product-name')).toBeAttached(); await settled(surface);
          await expect(surface.locator('#product-name')).toHaveValue(''); await expect(surface).toHaveAttribute('data-kind', kind);
          await expect(surface.locator('#detected-date')).toHaveAttribute('readonly', '');
          await page.evaluate(() => { window.createSurface = document.querySelector('.store-create-screen'); window.createOverlay = document.querySelector('[data-slot="dialog-overlay"]'); });
          const beforeReview = await surface.boundingBox(), beforeAnimation = await page.evaluate(() => window.createAnimations.length);
          await surface.locator('#barcode').fill('8936000123456'); await surface.locator('#product-name').focus();
          await expect(surface.getByText('Đã tìm thấy 0008421.', { exact: true })).toBeVisible();
          await expect(surface.locator('#product-name')).toHaveValue('Bánh quy bơ hộp 300 g');
          await surface.locator('input[type=file][multiple]').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: png });
          await expect(surface.getByRole('button', { name: 'Xem ảnh minh chứng 1', exact: true })).toBeVisible();
          await surface.getByRole('button', { name: 'Xem lại', exact: true }).click();
          await expect(surface.getByRole('heading', { name: /Xem lại phiếu KPH/ })).toBeVisible();
          await sameSurface(page); expect(await surface.boundingBox()).toEqual(beforeReview);
          expect(await page.evaluate(() => window.createAnimations.length)).toEqual(beforeAnimation);
          await page.screenshot({ path: `${output}/review-${kind}-${viewport.width}-${reducedMotion}.png` });
          await page.setViewportSize({ width: viewport.width >= 900 ? 390 : 1440, height: 844 }); await bounded(page, surface); await sameSurface(page);
          await page.setViewportSize({ width: viewport.width, height: 390 }); await bounded(page, surface);
          const submit = await surface.getByRole('button', { name: 'Gửi phiếu', exact: true }).boundingBox(); expect(submit.y + submit.height).toBeLessThanOrEqual(391);
          await page.setViewportSize(viewport); await bounded(page, surface);
          expect(await page.evaluate(() => window.createAnimations.length), 'resize must not restart opening motion').toEqual(beforeAnimation);
          await surface.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
          await expect(surface.locator('#barcode')).toBeFocused(); await expect(surface.locator('#product-name')).toHaveValue('Bánh quy bơ hộp 300 g');
          await expect(surface.getByRole('button', { name: 'Xem ảnh minh chứng 1', exact: true })).toBeVisible();
          await sameSurface(page);
          await surface.getByRole('button', { name: 'Xem lại', exact: true }).click();
          await surface.getByRole('button', { name: 'Gửi phiếu', exact: true }).click(); await expect(surface).toHaveCount(0); await expect(opener).toBeFocused();
        }
        expect(errors).toEqual([]); results.push({ viewport, reducedMotion, cpu: 6, stableSurface: true, lazyOpeningAnimations: initialAnimations, sectionGeometryWithin1px: true, reviewResizeDraftPhotos: true, cancelFreshSession: true, submit: true });
        await page.close(); console.log(`PASS create ${viewport.width} ${reducedMotion}: stable portal/overlay, one animation, skeleton/scroll, review/resize/photos/submit, fresh reopen/focus, CPU 6x`);
      }
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
