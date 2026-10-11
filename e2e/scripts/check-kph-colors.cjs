// Runtime contrast gate for KPH text/inputs and orange/green CTA states.
// Synthetic preview only; this is scoped evidence, not a full WCAG certification.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_KPH_COLORS_OUTPUT || '.local/kph-fresh-colors';
fs.mkdirSync(output, { recursive: true });
async function audit(page, selector, state) {
  const result = await page.locator(selector).evaluateAll((roots) => {
    const rgba = value => { const n = value.match(/[\d.]+/g)?.map(Number); return n?.length >= 3 ? [...n.slice(0, 3), n[3] ?? 1] : [0, 0, 0, 0]; };
    const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
    const lum = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    function background(el, point) {
      if (!el) return [255, 255, 255];
      const s = getComputedStyle(el), base = blend(rgba(s.backgroundColor), background(el.parentElement, point));
      if (s.backgroundImage === 'none') return base;
      // KPH chrome uses the accepted two-color 115deg linear gradient.
      const match = s.backgroundImage.match(/^linear-gradient\(([\d.]+)deg,/);
      if (!match) throw new Error(`Unsupported background: ${s.backgroundImage}`);
      const stops = [...s.backgroundImage.matchAll(/rgba?\([^)]+\)(?:\s+[\d.]+%)?/g)].map(m => ({ color: rgba(m[0].match(/rgba?\([^)]+\)/)[0]), pos: m[0].match(/([\d.]+)%/)?.[1] }));
      stops.forEach((s, i) => s.pos = s.pos === undefined ? i / (stops.length - 1) : Number(s.pos) / 100);
      const r = el.getBoundingClientRect(), angle = Number(match[1]) * Math.PI / 180, dx = Math.sin(angle), dy = -Math.cos(angle);
      const t = Math.max(0, Math.min(1, .5 + ((point.x - r.x - r.width / 2) * dx + (point.y - r.y - r.height / 2) * dy) / (r.width * Math.abs(dx) + r.height * Math.abs(dy))));
      let left = stops[0], right = stops.at(-1);
      for (let i = 1; i < stops.length; i++) if (t <= stops[i].pos) { left = stops[i - 1]; right = stops[i]; break; }
      const f = right.pos === left.pos ? 0 : Math.max(0, Math.min(1, (t - left.pos) / (right.pos - left.pos)));
      return blend(left.color.map((v, i) => v + (right.color[i] - v) * f), base);
    }
    const samples = [], borders = [], indicators = [];
    function text(el, content, rects, pseudo) {
      if (el.closest('[disabled], [aria-hidden="true"], .sr-only')) return;
      const style = getComputedStyle(el, pseudo);
      if (style.visibility !== 'visible') return;
      for (const rect of rects) {
        if (rect.width < 1 || rect.height < 1) continue;
        const points = [{ x: rect.left, y: rect.top }, { x: rect.right, y: rect.bottom }];
        const checks = points.map(point => { const bg = background(el, point); return { ratio: ratio(blend(rgba(style.color), bg), bg), background: bg }; });
        const worst = checks.sort((a, b) => a.ratio - b.ratio)[0];
        samples.push({ text: content.trim().slice(0, 70), color: style.color, ...worst });
      }
    }
    for (const root of roots) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        text(node.parentElement, node.textContent, [...range.getClientRects()]);
      }
      for (const input of root.querySelectorAll('input:not([type="radio"]):not([type="checkbox"]):not([type="file"]), textarea, select')) {
        const rect = input.getBoundingClientRect(); if (!rect.width || input.disabled) continue;
        text(input, input.value || input.placeholder || input.tagName, [rect], input.value || !input.placeholder ? undefined : '::placeholder');
        const style = getComputedStyle(input), point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        borders.push({ name: input.id || input.getAttribute('aria-label'), ratio: ratio(rgba(style.borderTopColor), background(input.parentElement, point)) });
      }
    }
    for (const root of roots) for (const el of root.querySelectorAll(':focus-visible, .choice-card:has(input:checked), .store-choices .is-selected, .store-tabs [aria-pressed="true"]')) {
      const rect = el.getBoundingClientRect(); if (!rect.width || el.matches('.sr-only')) continue;
      const style = getComputedStyle(el), point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      const focus = el.matches(':focus-visible');
      if (el.matches('.store-tabs [aria-pressed="true"]')) {
        indicators.push({ name: el.textContent.trim(), kind: 'selected-tab-surface', ratio: ratio(background(el, point), background(el.parentElement, point)) });
        if (!focus) continue;
      }
      indicators.push({ name: el.textContent.trim().slice(0, 50) || el.id, kind: focus ? 'focus' : 'selected', ratio: ratio(rgba(focus ? style.outlineColor : style.borderTopColor), background(el.parentElement, point)) });
    }
    return { samples, borders, indicators };
  });
  expect(result.samples.length, `${state} has runtime samples`).toBeGreaterThan(0);
  const failures = result.samples.filter(s => !Number.isFinite(s.ratio) || s.ratio < 4.5);
  const indicatorFailures = result.indicators.filter(s => !Number.isFinite(s.ratio) || s.ratio < 3);
  const borderFailures = result.borders.filter(s => !Number.isFinite(s.ratio) || s.ratio < 3);
  fs.writeFileSync(`${output}/${state}.json`, JSON.stringify(result, null, 2));
  expect(failures, `${state} text >=4.5:1`).toEqual([]);
  expect(borderFailures, `${state} input boundaries >=3:1`).toEqual([]);
  expect(indicatorFailures, `${state} focus/selection indicators >=3:1`).toEqual([]);
  return { state, samples: result.samples.length, minimumText: Math.min(...result.samples.map(s => s.ratio)), minimumBorder: result.borders.length ? Math.min(...result.borders.map(s => s.ratio)) : null };
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      page.setDefaultTimeout(8000); await page.goto(`${base}/#kph`);
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      results.push(await audit(page, '.store-screen-kph .store-header, .store-kph', `list-${viewport.width}`));
      // Both kinds must expose a selected state distinguishable from the track/neighbor.
      const tabs = page.locator('.store-kph .store-tabs button');
      for (let i = 0; i < 2; i++) {
        await tabs.nth(i).click();
        await expect(tabs.nth(i)).toHaveAttribute('aria-pressed', 'true');
        await expect(tabs.nth(1 - i)).toHaveAttribute('aria-pressed', 'false');
        results.push(await audit(page, '.store-kph .store-tabs', `tab-${i}-${viewport.width}`));
        // The white underline is a shape cue in addition to the filled green state.
        expect(await tabs.nth(i).evaluate(el => {
          const s = getComputedStyle(el, '::after');
          return s.content !== 'none' && parseFloat(s.height) >= 3;
        })).toBe(true);
        await tabs.nth(i).hover();
        results.push(await audit(page, '.store-kph .store-tabs', `tab-hover-${i}-${viewport.width}`));
      }
      await tabs.first().focus(); await page.keyboard.press('Tab');
      await expect(tabs.last()).toBeFocused();
      results.push(await audit(page, '.store-kph .store-tabs', `tab-focus-${viewport.width}`));
      // Keyboard focus must be distinguishable; CTA hover keeps readable white labels.
      await page.locator('.create-tpcn').focus(); await page.keyboard.press('Tab');
      await expect(page.locator('.create-tpts')).toBeFocused();
      await expect(page.locator('.create-tpts')).toHaveCSS('outline-width', '3px');
      results.push(await audit(page, '.store-create-actions', `focus-${viewport.width}`));
      for (const kind of ['tpcn', 'tpts']) {
        const create = page.locator(`.store-create-actions .create-${kind}`);
        await create.hover();
        results.push(await audit(page, '.store-create-actions', `hover-${kind}-${viewport.width}`));
        await create.click(); await expect(page.locator('#product-name')).toBeVisible();
        results.push(await audit(page, '.store-create-screen', `form-${kind}-${viewport.width}`));
        for (const name of ['condition', 'resolution']) {
          for (const option of await page.locator(`.store-create-screen input[name="${name}"]`).all()) {
            await option.locator('..').click(); await expect(option).toBeChecked();
            results.push(await audit(page, '.store-create-screen', `selected-${kind}-${name}-${await option.getAttribute('value')}-${viewport.width}`));
          }
        }
        await page.locator('#note').hover();
        results.push(await audit(page, '.store-create-screen', `textarea-hover-${kind}-${viewport.width}`));
        await page.getByRole('button', { name: 'Xem lại', exact: true }).click();
        await expect(page.locator('.store-create-screen [role="alert"]').first()).toBeVisible();
        results.push(await audit(page, '.store-create-screen', `error-${kind}-${viewport.width}`));
        await page.getByRole('button', { name: 'Hủy', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }).click();
      results.push(await audit(page, '.store-kph-sheet', `filter-${viewport.width}`));
      await page.keyboard.press('Escape');
      await page.locator(viewport.width < 900 ? '.store-ticket-open' : '.store-kph-row-open').first().click();
      results.push(await audit(page, '.store-kph-sheet', `detail-${viewport.width}`));
      await page.keyboard.press('Escape');
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(`PASS KPH contrast: ${results.length} rendered states, text >=4.5, input boundaries >=3, CTA/tab focus and selected tab surface.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
