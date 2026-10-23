// Headless Chromium normally hides scrollbars. Keep native bars visible in this gate.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4294';
const output = process.env.STORE_SCROLLBARS_OUTPUT || '.local/ui02-scrollbars/browser';
fs.mkdirSync(output, { recursive: true });
async function ready(page, screen) {
  await page.goto(`${base}/#${screen}`);
  if (screen === 'login') await expect(page.locator('.store-login-form')).toBeVisible();
  else await expect(page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true })).toBeEnabled();
  if (screen === 'kph') await expect(page.locator('.kph-loading-frame')).toHaveCount(0);
  if (screen === 'reports') await expect(page.locator('.report-type-card').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function fits(page) {
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
}
async function scrollBody(page, dialog, selector, desktop) {
  const body = dialog.locator(selector);
  await expect(body).toBeVisible();
  const header = dialog.locator('[data-slot="dialog-header"], .store-account-hero').first();
  const heading = await header.boundingBox();
  const before = await body.evaluate(el => ({ top: el.scrollTop, range: el.scrollHeight - el.clientHeight }));
  if (before.range > 1) {
    if (desktop) {
      // Drag the actual scrollbar thumb; no application scroll simulation.
      const box = await body.boundingBox();
      await page.mouse.move(box.x + box.width - 3, box.y + 20);
      await page.mouse.down(); await page.mouse.move(box.x + box.width - 3, box.y + Math.min(140, box.height - 20), { steps: 8 }); await page.mouse.up();
      await expect.poll(() => body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
      expect(Math.abs((await header.boundingBox()).y - heading.y)).toBeLessThanOrEqual(1);
      expect(await dialog.evaluate(el => el.scrollTop)).toBe(0);
    }
    await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
    await expect.poll(() => body.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
  }
  if (desktop) {
    expect(await body.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await expect(dialog.locator('[data-slot="dialog-close"]')).toBeVisible();
  }
  return { range: before.range, scrolled: await body.evaluate(el => el.scrollTop) };
}
(async () => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 1280, height: 720 }, { width: 900, height: 650 }, { width: 1440, height: 500 }]) {
      const desktop = viewport.width >= 900;
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      page.setDefaultTimeout(10000); const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      for (const screen of ['home', 'kph', 'date', 'notifications', 'reports', 'shelf', 'login']) {
        await ready(page, screen); await fits(page);
        if (desktop && screen === 'kph') expect(await page.locator('.store-kph-table-wrap').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        const root = await page.evaluate(() => ({ bar: innerWidth - document.documentElement.clientWidth, height: document.documentElement.scrollHeight }));
        if (desktop) { expect(root.bar).toBeGreaterThan(0); expect(root.bar).toBeLessThanOrEqual(12); }
        const box = await page.locator(desktop && screen !== 'login' ? '.store-main-column' : '.store-page-layout').boundingBox();
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
        await page.mouse.move(viewport.width - 30, viewport.height / 2); await page.mouse.wheel(0, 500);
        await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
        results.push({ viewport, screen, root });
      }
      await ready(page, 'kph');
      if (desktop) {
        const rail = page.locator('.store-desktop-rail');
        const range = await rail.evaluate(el => el.scrollHeight - el.clientHeight);
        if (range > 1) {
          await rail.hover(); await page.mouse.wheel(0, 500);
          await expect.poll(() => rail.evaluate(el => el.scrollTop)).toBeGreaterThan(0);
          await expect(rail.locator('.store-rail-store')).toBeInViewport();
          await rail.evaluate(el => { el.scrollTop = 0; });
        }
        // Hash navigation can retain scroll position; start with the thumb at the top.
        // Let any preceding wheel/scroll anchoring finish before placing the thumb.
        let previousTop;
        await expect.poll(async () => {
          const top = await page.evaluate(() => scrollY);
          const settled = top === previousTop; previousTop = top; return settled;
        }).toBe(true);
        await page.evaluate(() => scrollTo(0, 0));
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
        await page.mouse.move(viewport.width - 3, 20); await page.mouse.down();
        await page.mouse.move(viewport.width - 3, 160, { steps: 8 }); await page.mouse.up();
        await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
        await page.evaluate(() => scrollTo(0, 0));
      }
      for (const [name, trigger, bodySelector] of [
        ['filter', 'Lọc phiếu KPH', '.store-modal-body'],
        ['account', 'Tài khoản và cửa hàng', '.store-account-body'],
        ['detail', 'Mở phiếu Cải thìa VietGAP 500 g', '.store-modal-body'],
        ['create', 'Tạo phiếu TP tươi sống', '.create-dialog-form:not(.store-form-skeleton)'],
        ['quick', 'Mở tiện ích tra cứu lùi hàng', '.store-modal-body'],
      ]) {
        const button = page.getByRole('button', { name: trigger, exact: true }).first();
        await button.scrollIntoViewIfNeeded();
        const surface = page.locator('.store-page-surface'); const before = await surface.boundingBox();
        const fab = page.locator('.store-quick-fab'); const fabBefore = await fab.boundingBox();
        await button.click(); const dialog = page.getByRole('dialog'); await expect(dialog).toBeVisible();
        if (name === 'create') await expect(dialog.locator(bodySelector)).toBeVisible();
        if (desktop) {
          const after = await surface.boundingBox();
          expect(Math.abs(after.x - before.x)).toBeLessThanOrEqual(1);
          expect(Math.abs(after.width - before.width)).toBeLessThanOrEqual(1);
          if (name !== 'quick') expect(Math.abs((await fab.boundingBox()).x - fabBefore.x)).toBeLessThanOrEqual(1);
          const scroll = await scrollBody(page, dialog, bodySelector, true);
          results.push({ viewport, dialog: name, scroll });
          const pos = await page.evaluate(() => scrollY);
          await page.mouse.move(260, viewport.height - 30); await page.mouse.wheel(0, 250);
          expect(await page.evaluate(() => scrollY)).toBe(pos);
          if (name === 'detail') {
            const footer = await dialog.locator('.store-sheet-actions').boundingBox();
            const bounds = await dialog.boundingBox();
            expect(Math.abs(footer.y + footer.height - bounds.y - bounds.height)).toBeLessThanOrEqual(1);
          }
        }
        await page.screenshot({ path: `${output}/${name}-${viewport.width}x${viewport.height}.png` });
        await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
        await expect.poll(() => page.locator('body').getAttribute('data-scroll-locked')).toBeNull();
        await expect(button).toBeFocused(); await fits(page);
      }
      // Report choice sheet keeps search and actions fixed; only results scroll.
      await ready(page, 'reports');
      await page.getByRole('button', { name: /^Báo cáo tổng hợp/ }).click();
      await page.getByRole('button', { name: /Đổi mẫu/ }).click();
      const picker = page.getByRole('dialog'); await expect(picker.locator('.store-choice-results')).toBeVisible();
      if (desktop) { await expect(picker).toHaveCSS('overflow-y', 'hidden'); await expect(picker.locator('.store-modal-body')).toHaveCSS('overflow-y', 'hidden'); await scrollBody(page, picker, '.store-choice-results', true); }
      await page.screenshot({ path: `${output}/report-picker-${viewport.width}x${viewport.height}.png` }); await page.keyboard.press('Escape');
      await ready(page, 'date'); await page.getByRole('button', { name: 'Lọc DATE', exact: true }).click();
      const filter = page.getByRole('dialog', { name: 'Lọc DATE', exact: true });
      if (desktop) await scrollBody(page, filter, '.store-modal-body', true);
      await page.screenshot({ path: `${output}/date-filter-${viewport.width}x${viewport.height}.png` }); await page.keyboard.press('Escape');
      if (desktop) {
        await page.emulateMedia({ forcedColors: 'active' });
        await expect(page.locator('html')).toHaveCSS('scrollbar-width', 'auto');
        await expect(page.locator('html')).toHaveCSS('scrollbar-color', 'auto');
        expect(await page.evaluate(() => innerWidth - document.documentElement.clientWidth)).toBeGreaterThanOrEqual(12);
        await fits(page); await page.emulateMedia({ forcedColors: 'none' });
      } else {
        await ready(page, 'kph');
        await expect(page.locator('.store-ticket-tags').first()).toHaveCSS('scrollbar-width', 'none');
      }
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS visible native scrollbars ${viewport.width}x${viewport.height}: 7 screens, dialogs, drag, lock/restore, no horizontal overflow`);
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
