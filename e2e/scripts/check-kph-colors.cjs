// Runtime contrast gate for KPH text/inputs and orange/green CTA states.
// Synthetic preview only; this is scoped evidence, not a full WCAG certification.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_KPH_COLORS_OUTPUT || '.local/kph-fresh-colors';
fs.mkdirSync(output, { recursive: true });
async function audit(page, selector, state) {
  const result = await page.locator(selector).evaluateAll((roots) => {
    const colorCache = new Map();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const rgba = value => {
      const n = value.match(/[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)?.map(Number);
      // Chromium returns color(srgb ...) for Tailwind color-mix hover backgrounds.
      if (value.startsWith('color(srgb ')) return [...n.slice(0, 3).map(v => v * 255), n[3] ?? 1];
      if (value.startsWith('rgb')) return [...n.slice(0, 3), n[3] ?? 1];
      if (colorCache.has(value)) return colorCache.get(value);
      if (!context || !CSS.supports('color', value)) throw new Error(`Unsupported color: ${value}`);
      // Resolve modern CSS colors (including oklab color-mix) with the same browser renderer.
      context.clearRect(0, 0, 1, 1);
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      const pixel = context.getImageData(0, 0, 1, 1).data;
      const color = [...pixel.slice(0, 3), pixel[3] / 255];
      colorCache.set(value, color);
      return color;
    };
    const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
    const lum = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
    // Conservative stop envelope: every layer/alpha combination must pass.
    // This supports static linear/radial stacks without silently skipping complex paint.
    const backgroundCache = new WeakMap();
    const unique = colors => [...new Map(colors.map(c => [c.map(v => Math.round(v * 1000)).join(','), c])).values()];
    function layers(value) {
      const list=[]; let depth=0, start=0;
      for(let i=0;i<value.length;i++){if(value[i]==='(')depth++;else if(value[i]===')')depth--;else if(value[i]===','&&depth===0){list.push(value.slice(start,i).trim());start=i+1;}}
      list.push(value.slice(start).trim());return list;
    }
    function backgrounds(el) {
      if (!el) return [[255, 255, 255]];
      if (backgroundCache.has(el)) return backgroundCache.get(el);
      const style=getComputedStyle(el);let colors=unique(backgrounds(el.parentElement).map(bg=>blend(rgba(style.backgroundColor),bg)));
      if(style.backgroundImage!=='none')for(const layer of layers(style.backgroundImage).reverse()){
        if(!/^(linear|radial)-gradient\(/.test(layer))throw new Error(`Unsupported background: ${style.backgroundImage}`);
        const stops=[...layer.matchAll(/rgba?\([^)]+\)|color\([^)]+\)/g)].map(m=>rgba(m[0]));
        if(stops.length<2)throw new Error(`Unresolved gradient stops: ${layer}`);
        colors=unique(colors.flatMap(bg=>stops.map(color=>blend(color,bg))));
      }
      backgroundCache.set(el,colors);return colors;
    }
    const minimum = values => Math.min(...values);
    const samples = [], borders = [], indicators = [];
    function text(el, content, rects, pseudo) {
      if (el.closest('[disabled], [aria-hidden="true"], .sr-only')) return;
      const style = getComputedStyle(el, pseudo);
      if (style.visibility !== 'visible') return;
      for (const rect of rects) {
        if (rect.width < 1 || rect.height < 1) continue;
        const checks = backgrounds(el).map(bg => ({ ratio: ratio(blend(rgba(style.color), bg), bg), background: bg }));
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
        // Modal background fields are inert/aria-hidden, outside the active UI.
        const rect = input.getBoundingClientRect(); if (!rect.width || input.disabled || input.closest('[aria-hidden="true"], [inert]')) continue;
        text(input, input.value || input.placeholder || input.tagName, [rect], input.value || !input.placeholder ? undefined : '::placeholder');
        const style = getComputedStyle(input), point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        // Compose a translucent edge over the field fill before measuring it;
        // the identifying-cue check below distinguishes decoration from a boundary.
        const contours = backgrounds(input).map(bg => blend(rgba(style.borderTopColor), bg));
        const visible = el => {
          const r = el.getBoundingClientRect(), s = getComputedStyle(el);
          return r.width > 1 && r.height > 1 && s.visibility === 'visible' && s.display !== 'none' && !el.closest('.sr-only, [hidden], [aria-hidden="true"]');
        };
        const labels = [...(input.labels || [])];
        const visibleLabel = labels.some(label => visible(label) && label.textContent.trim());
        const content = (input.tagName === 'SELECT' ? input.selectedOptions[0]?.textContent : input.value || input.placeholder || '').trim();
        const named = labels.some(label => label.textContent.trim()) || !!input.getAttribute('aria-label')?.trim() || !!input.getAttribute('aria-labelledby')?.trim();
        const icon = input.closest('label')?.querySelector('svg');
        const visibleIcon = icon && visible(icon) && minimum(backgrounds(icon).map(bg => ratio(blend(rgba(getComputedStyle(icon).color), bg), bg))) >= 3;
        // Quiet decoration need not be the sole identifying cue. Require a named
        // field, contrasting content and a visible label or meaningful search icon.
        // Empty/unlabeled fields still need a contrasting boundary. Focus and
        // selection are independently required to meet 3:1 below (WCAG 1.4.11).
        borders.push({ name: input.id || input.getAttribute('aria-label'), ratio: minimum(contours.flatMap(contour => backgrounds(input.parentElement).map(bg => ratio(contour, bg)))), visibleLabel, visibleIcon: !!visibleIcon, visibleContent: !!content, identifiedByText: !!named && (visibleLabel || !!visibleIcon) && !!content });
      }
    }
    for (const root of roots) for (const el of root.querySelectorAll(':focus-visible, .choice-card:has(input:checked), .store-choices .is-selected, .store-tabs [aria-pressed="true"], .store-quick-sort-options [aria-pressed="true"], .store-date-statuses [aria-pressed="true"]')) {
      const rect = el.getBoundingClientRect(); if (!rect.width || el.matches('.sr-only')) continue;
      const style = getComputedStyle(el), point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      const focus = el.matches(':focus-visible');
      if (el.matches('.store-tabs [aria-pressed="true"], .store-quick-sort-options [aria-pressed="true"], .store-date-statuses [aria-pressed="true"]')) {
        indicators.push({ name: el.textContent.trim(), kind: el.closest('.store-tabs') ? 'selected-tab-surface' : el.closest('.store-date-statuses') ? 'selected-status-surface' : 'selected-sort-surface', ratio: minimum(backgrounds(el).flatMap(color => backgrounds(el.parentElement).map(bg => ratio(color, bg)))) });
        if (!focus) continue;
      }
      indicators.push({ name: el.textContent.trim().slice(0, 50) || el.id, kind: focus ? 'focus' : 'selected', ratio: minimum(backgrounds(el.parentElement).map(bg => ratio(rgba(focus ? style.outlineColor : style.borderTopColor), bg))) });
    }
    return { samples, borders, indicators };
  });
  expect(result.samples.length, `${state} has runtime samples`).toBeGreaterThan(0);
  const failures = result.samples.filter(s => !Number.isFinite(s.ratio) || s.ratio < 4.5);
  const indicatorFailures = result.indicators.filter(s => !Number.isFinite(s.ratio) || s.ratio < 3);
  const borderFailures = result.borders.filter(s => !Number.isFinite(s.ratio) || (s.ratio < 3 && !s.identifiedByText));
  fs.writeFileSync(`${output}/${state}.json`, JSON.stringify(result, null, 2));
  expect(failures, `${state} text >=4.5:1`).toEqual([]);
  expect(borderFailures, `${state} input boundary >=3:1 or visible label + contrasting field content`).toEqual([]);
  expect(indicatorFailures, `${state} focus/selection indicators >=3:1`).toEqual([]);
  return { state, samples: result.samples.length, minimumText: Math.min(...result.samples.map(s => s.ratio)), minimumBorder: result.borders.length ? Math.min(...result.borders.map(s => s.ratio)) : null };
}
module.exports = { audit };
if (require.main === module) (async () => {
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
    console.log(`PASS KPH contrast: ${results.length} rendered states, text >=4.5, input affordances and CTA/tab focus and selected tab surface.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
