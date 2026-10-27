// Whole-row feedback, notification rhythm and immediate readable navigation.
// Synthetic data only; this supplements the notification transaction gate.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4368';
const output = process.env.STORE_FEEDBACK_OUTPUT || '.local/fresh01/r4/feedback';
process.env.STORE_KPH_COLORS_OUTPUT = output + '/contrast';
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(requestAnimationFrame);
    await Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
  });
}
async function paint(locator) {
  return locator.evaluate(el => {
    const s = getComputedStyle(el), b = el.getBoundingClientRect();
    return { image: s.backgroundImage, shadow: s.boxShadow, color: s.color,
      box: { x: b.x, y: b.y, width: b.width, height: b.height } };
  });
}
async function feedback(page, locator, name, width, { summary = false } = {}) {
  await locator.scrollIntoViewIfNeeded(); await page.mouse.move(0, 0); await locator.blur(); await settle(page);
  const normal = await paint(locator);
  await locator.hover(); await settle(page); const hover = await paint(locator);
  expect(hover.image).toContain('radial-gradient');
  expect(hover.box).toEqual(normal.box);
  if (!summary) expect(hover.shadow).not.toBe(normal.shadow);
  await audit(page, '.store-page-surface', `${name}-hover-${width}`);
  const b = await locator.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await settle(page);
  const pressed = await paint(locator);
  expect(pressed.image).toBe('none'); expect(pressed.shadow).toContain('inset');
  expect(pressed.box).toEqual(normal.box);
  await audit(page, '.store-page-surface', `${name}-press-${width}`);
  await page.mouse.move(0, 0); await page.mouse.up();
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await locator.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(locator).toBeFocused(); await expect(locator).toHaveCSS('outline-style', 'solid');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  return { name, normal, hover, pressed };
}
async function noClip(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  expect(await page.locator('.store-notification-groups').evaluate(root =>
    [root, ...root.querySelectorAll('button,summary,strong,small,p,h2,h3')].filter(el =>
      !el.closest('.sr-only,[aria-hidden="true"]') && el.clientWidth && el.scrollWidth > el.clientWidth + 1
    ).map(el => el.className))).toEqual([]);
}

(async () => {
  const browser = await chromium.launch(), results = [];
  try {
    for (const width of [390, 1440, 320]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1024 : 844 }, serviceWorkers: 'block', reducedMotion: 'no-preference' });
      await page.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
      await page.goto(base + '/#home'); await page.locator('.store-module').first().waitFor(); await settle(page);
      // Sample the first rendered frame after navigation: foreground must switch with its solid background.
      await page.locator('a[href="#notifications"]').filter({ visible: true }).first().click();
      if (width < 900) {
        const selected = page.locator('.store-mobile-toolbar a[aria-current="page"]');
        await expect(selected).toHaveText('Thông báo');
        const nav = await selected.evaluate(n => ({ color: getComputedStyle(n).color, transition: getComputedStyle(n).transitionProperty }));
        expect(nav.color).toBe('rgb(255, 255, 255)'); expect(nav.transition).not.toContain('color,');
        expect(nav.transition.split(',').map(s => s.trim())).not.toContain('color');
      }
      const rows = page.locator('[data-notification-group="withdrawal"] .store-notification-item');
      await expect(rows).toHaveCount(3); await settle(page);
      const boxes = await rows.evaluateAll(ns => ns.map(n => { const b = n.getBoundingClientRect(); return { top: b.top, bottom: b.bottom }; }));
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].top - boxes[i - 1].bottom).toBeGreaterThanOrEqual(8);
      await noClip(page);
      const states = [];
      states.push(await feedback(page, rows.first(), 'notice', width));
      const summary = page.locator('[data-notification-group="withdrawal"] > summary');
      states.push(await feedback(page, summary, 'disclosure', width, { summary: true }));
      await page.keyboard.press('Enter'); await expect(rows.first()).toBeHidden();
      await page.keyboard.press('Enter'); await expect(rows.first()).toBeVisible();
      await page.mouse.move(0, 0); await summary.blur(); await settle(page);
      await page.screenshot({ path: `${output}/notifications-${width}.png`, fullPage: true });
      // Real row opening still resolves the exact lot and closes back to its native opener flow.
      await page.locator('[data-notification-lot="C24-118"]').click();
      const detail = page.getByRole('dialog', { name: 'Chi tiết lô DATE', exact: true });
      await expect(detail).toContainText('Lô C24-118'); await page.keyboard.press('Escape'); await expect(detail).toHaveCount(0);
      await page.goto(base + '/#reports'); await page.locator('.report-type-card').first().waitFor();
      states.push(await feedback(page, page.locator('.report-type-card').first(), 'report', width));
      if (width < 900) {
        await page.goto(base + '/#date'); const lot = page.locator('button.store-date-lot').first(); await lot.waitFor();
        states.push(await feedback(page, lot, 'date', width));
      }
      for (const scale of [1.5, 2]) {
        await page.goto(base + '/#notifications');
        // A same-fragment navigation can keep the previous inline scaling.
        // Reload the fixture so each sample starts at 100%, rather than compounding.
        await page.reload(); await rows.first().waitFor();
        await page.locator('.store-notification-groups').evaluate((root, scale) => {
          const entries = [root, ...root.querySelectorAll('*')].map(el => {
            const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) };
          });
          for (const { el, font, line } of entries) { el.style.fontSize = `${font * scale}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * scale}px`; }
        }, scale);
        await noClip(page);
        // Overflow alone misses a name squeezed into a few letters per line.
        expect(await rows.first().locator('.store-notification-item-copy > strong').evaluate(el =>
          el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize)
        )).toBeGreaterThanOrEqual(7);
        await audit(page, '.store-notifications-body', `text-${scale}-${width}`);
        await page.screenshot({ path: `${output}/notifications-${width}-text${scale * 100}.png`, fullPage: true });
      }
      await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
      await expect(rows.first()).toHaveCSS('background-image', 'none'); await rows.first().focus();
      await expect(rows.first()).toHaveCSS('outline-style', 'solid');
      await page.emulateMedia({ forcedColors: 'none' });
      await expect(summary.locator('svg')).toHaveCSS('transition-duration', '0s');
      results.push({ width, states, gap: 8, exactLot: true, text150and200: true, systemPreferences: true });
      console.log('PASS item/disclosure feedback, spacing, navigation, text200 and system preferences', width);
      await page.close();
    }
    fs.writeFileSync(output + '/results.json', JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
