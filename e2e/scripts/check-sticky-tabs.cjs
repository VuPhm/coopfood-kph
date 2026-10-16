const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4215';
const output = '.local/sticky-tabs/check';
fs.mkdirSync(output, { recursive: true });
async function box(locator) {
  return locator.evaluate(el => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom }; });
}
async function pin(page, tabs, delta) {
  await page.mouse.move(300, Math.min(page.viewportSize().height - 130, 350));
  await page.mouse.wheel(0, delta);
  await expect.poll(async () => (await box(tabs)).y).toBeCloseTo(0, 0);
}
async function reveal(page, target, tabs) {
  const documentTop = await target.evaluate(el => el.getBoundingClientRect().y + scrollY);
  await page.evaluate(y => window.scrollTo({ top: y - 8, behavior: 'instant' }), documentTop);
  // Let native wheel/scroll anchoring finish before deliberately focusing behind the bar.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await target.evaluate(el => el.focus({ preventScroll: true }));
  await expect(target).toBeFocused();
  await expect.poll(async () => (await box(target)).y - (await box(tabs)).bottom).toBeGreaterThanOrEqual(7.5);
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      for (const screen of ['kph', 'date']) {
        const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.clock.setFixedTime(new Date('2026-10-12T05:00:00+07:00'));
        await page.goto(`${base}/#${screen}`);
        const root = page.locator(screen === 'kph' ? '.store-kph:not(.kph-loading-frame)' : '.store-date');
        await expect(root).toBeVisible();
        if (screen === 'date') await page.locator('.store-date-lot').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        const tabs = root.locator('.store-sticky-tabs');
        const initial = await box(tabs);
        expect(initial.y).toBeGreaterThan(100);
        await page.screenshot({ path: `${output}/${screen}-initial-${viewport.width}.png` });
        // The cover and tabs first move together, then the tab surface pins.
        await page.mouse.move(Math.min(viewport.width - 30, initial.x + initial.width / 2), Math.min(viewport.height - 130, initial.y + 140));
        await page.mouse.wheel(0, 70);
        await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(50);
        const midway = await box(tabs), scroll = await page.evaluate(() => scrollY);
        expect(midway.y).toBeCloseTo(initial.y - scroll, 0);
        await pin(page, tabs, initial.y + 100);
        const pinned = await box(tabs);
        expect(await tabs.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
        expect(await tabs.evaluate(el => {
          const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.bottom - 4));
        })).toBe(true);
        await pin(page, tabs, 160);
        expect((await box(tabs)).height).toBe(pinned.height);
        await page.screenshot({ path: `${output}/${screen}-pinned-${viewport.width}.png` });

        const selected = tabs.getByRole('button', { name: screen === 'kph' ? /^TP khô & khác/ : /^Theo dõi DATE/ });
        await selected.click(); await expect(selected).toHaveAttribute('aria-pressed', 'true');
        await expect.poll(async () => (await box(tabs)).y).toBeCloseTo(0, 0);
        const first = root.locator(screen === 'kph' ? (viewport.width >= 900 ? '.store-kph-row-open' : '.store-ticket-open') : '.store-date-lot').first();
        await reveal(page, first, tabs);
        const sort = root.locator('.store-quick-sort-trigger');
        await reveal(page, sort, tabs);
        await page.keyboard.press('Enter');
        const popup = page.getByRole('dialog', { name: screen === 'kph' ? 'Sắp xếp phiếu' : 'Sắp xếp lô DATE', exact: true });
        await expect(popup).toBeVisible();
        const popupBox = await box(popup);
        expect(popupBox.y).toBeGreaterThanOrEqual(0); expect(popupBox.bottom).toBeLessThanOrEqual(viewport.height + 1);
        await page.keyboard.press('Escape'); await expect(sort).toBeFocused();

        await page.evaluate(() => {
          const elements = [...document.querySelectorAll('.store-tabs button, .store-tabs small')]
            .map(el => ({ el, font: parseFloat(getComputedStyle(el).fontSize) * 1.5, line: parseFloat(getComputedStyle(el).lineHeight) * 1.5 }));
          for (const { el, font, line } of elements) { el.style.fontSize = `${font}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line}px`; }
        });
        await first.evaluate(el => el.blur());
        await reveal(page, first, tabs);
        const large = await box(tabs);
        expect(large.height).toBeGreaterThanOrEqual(pinned.height);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        for (const button of await tabs.getByRole('button').all()) {
          const r = await box(button); expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
          expect(r.y).toBeGreaterThanOrEqual(0); expect(r.bottom).toBeLessThanOrEqual(large.bottom);
        }
        await page.screenshot({ path: `${output}/${screen}-text150-${viewport.width}.png` });
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await expect.poll(async () => (await box(tabs)).y).toBeCloseTo(initial.y, 0);
        const account = page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true });
        await expect(account).toBeInViewport();
        expect(errors).toEqual([]);
        results.push({ viewport, screen, initial, pinned, large, focusReveal: true, tabSwitch: true, popup: true, returned: true });
        console.log(`PASS sticky ${screen} ${viewport.width}: slide/pin/switch/focus/popup/text150/return`);
        await page.close();
      }
    }
  } finally { fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
