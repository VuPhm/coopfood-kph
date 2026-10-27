// Compact notification rows: alignment, adaptive text, identity and bounded motion.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4386';
const output = process.env.STORE_NOTIFICATIONS_OUTPUT || '.local/notif01';
fs.mkdirSync(output, { recursive: true });
async function settle(p) { await p.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished)); }); }
async function overflow(p) {
  return p.evaluate(() => ({ page: document.documentElement.scrollWidth > innerWidth + 1, nodes: [...document.querySelectorAll('.store-notification-item,.store-notification-item-meta,.store-notification-item strong,.store-notification-item small,summary')].filter(el => el.getBoundingClientRect().width > 1 && !el.closest('.sr-only')).filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.className) }));
}
(async () => {
  const b = await chromium.launch(), results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
      const p = await b.newPage({ viewport, reducedMotion: 'no-preference', serviceWorkers: 'block' }); const errors = []; p.on('pageerror', e => errors.push(e.message));
      await p.goto(base + '/#home'); await p.locator('.store-home-page').first().waitFor(); await settle(p);
      const arrival = await p.evaluate(async () => {
        const samples = [], start = performance.now(); location.hash = 'notifications';
        await new Promise(resolve => { function sample(t) { samples.push(document.getAnimations().filter(a => a.effect?.target?.matches('.store-page-surface,.store-page-hero-content')).length); if (t - start < 330) requestAnimationFrame(sample); else resolve(); } requestAnimationFrame(sample); });
        return { peak: Math.max(...samples), remaining: document.querySelectorAll('[data-store-entering]').length };
      });
      await p.locator('.store-notification-item').first().waitFor(); await settle(p); expect(arrival.peak).toBeLessThanOrEqual(2); expect(arrival.remaining).toBe(0);
      const geometry = await p.locator('.store-notification-item').evaluateAll(nodes => nodes.map(el => {
        const name = el.querySelector('.store-notification-item-copy > strong'), meta = el.querySelector('.store-notification-item-meta'), end = el.querySelector('.store-notification-item-end'), percent = el.querySelector('.store-notification-percent strong');
        return { height: el.getBoundingClientRect().height, nameSize: getComputedStyle(name).fontSize, percentSize: percent ? getComputedStyle(percent).fontSize : null, nameY: name.getBoundingClientRect().top, endY: end.getBoundingClientRect().top, metaY: meta.getBoundingClientRect().top, hsd: el.querySelector('.store-notification-expiry').innerText, lotHidden: el.innerText.includes(' · Lô ') };
      }));
      for (const row of geometry) { expect(row.height).toBeGreaterThanOrEqual(44); expect(row.nameSize).toBe('14px'); if (row.percentSize) expect(row.percentSize).toBe('14px'); expect(Math.abs(row.nameY - row.endY)).toBeLessThan(1); expect(row.metaY).toBeGreaterThan(row.nameY); expect(row.hsd).toMatch(/^HSD \d{2}\/\d{2}\/\d{4}$/); expect(row.lotHidden).toBe(false); }
      const summaryHeights = await p.locator('.store-notification-section > summary').evaluateAll(es => es.map(e => e.getBoundingClientRect().height)); for (const h of summaryHeights) expect(h).toBeGreaterThanOrEqual(44);
      expect(await overflow(p)).toEqual({ page: false, nodes: [] }); await p.screenshot({ path: `${output}/normal-${viewport.width}.png`, fullPage: true });
      // Hover/press/focus feedback must not shift any row's dimensions.
      const item = p.locator('.store-notification-item').first(), before = await item.boundingBox(); await item.hover(); expect(await item.boundingBox()).toEqual(before); await item.focus(); expect(await item.boundingBox()).toEqual(before);
      const group = p.locator('.store-notification-section').first(); await group.locator('summary').focus(); await p.keyboard.press('Enter'); await expect(group.locator('.store-notification-item').first()).toBeHidden(); await p.keyboard.press('Enter'); await expect(group.locator('.store-notification-item').first()).toBeVisible();
      await p.locator('.store-notification-groups').evaluate(root => {
        root.querySelector('.store-notification-item-copy > strong').textContent = 'Sữa dinh dưỡng tên sản phẩm dài để kiểm tra bố cục và khả năng xuống dòng tự nhiên';
        const sizes = [root, ...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
        for (const { el, font, line } of sizes) { el.style.fontSize = `${font * 2}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 2}px`; }
      });
      expect(await overflow(p)).toEqual({ page: false, nodes: [] }); await p.screenshot({ path: `${output}/text200-${viewport.width}.png`, fullPage: true });
      await p.emulateMedia({ reducedMotion: 'reduce' }); await p.evaluate(() => { location.hash = 'home'; }); await p.waitForTimeout(50); await p.evaluate(() => { location.hash = 'notifications'; }); await p.locator('.store-notification-item').first().waitFor(); expect(await p.locator('[data-store-entering]').count()).toBe(0); await expect(p.locator('.store-notification-section > summary > svg').first()).toHaveCSS('transition-duration', '0s');
      expect(errors).toEqual([]); results.push({ viewport, arrival, geometry, text200: true, stableFeedback: true, reducedMotion: true }); console.log(`PASS compact notifications ${viewport.width}: geometry, hit targets, text200/long name, stable feedback, native group, bounded/reduced motion`); await p.close();
    }
  } finally { fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); await b.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
