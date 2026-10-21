// Unified DATE: only synthetic in-memory catalog/lots; no OS camera permissions.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:5178';
const output = process.env.STORE_DATE_OUTPUT || '.local/date-fresh-r14';
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
      // Fresh chrome uses the accepted two-color 115deg linear gradient.
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
    for (const root of roots) for (const el of root.querySelectorAll(':focus-visible, .choice-card:has(input:checked), .store-choices .is-selected, .store-tabs [aria-pressed="true"], .store-date-statuses [aria-pressed="true"]')) {
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
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{width:390,height:844}, {width:1440,height:1024}, {width:320,height:844}]) {
      const page = await browser.newPage({viewport, reducedMotion:'reduce', serviceWorkers:'block'});
      page.setDefaultTimeout(8000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.__scanCode = '29123415005';
        Object.defineProperty(navigator, 'mediaDevices', {value:{
          getUserMedia: async () => {
            const canvas = document.createElement('canvas'); canvas.width=640; canvas.height=480;
            canvas.getContext('2d').fillRect(0,0,640,480);
            return canvas.captureStream(10);
          }, enumerateDevices: async () => []
        }});
        window.BarcodeDetector = class {
          static async getSupportedFormats() { return ['ean_13']; }
          async detect() { return [{rawValue: window.__scanCode}]; }
        };
      });
      const desktop = viewport.width >= 900;
      const overflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const shot = async name => { await overflow(); if (name !== 'home') await audit(page, await page.getByRole('dialog').count() ? '.store-date-sheet' : '.store-screen-date .store-header, .store-date', `${name}-${viewport.width}`); await page.screenshot({path:`${output}/${name}-${viewport.width}.png`,fullPage:await page.getByRole("dialog").count() === 0}); };
      await page.goto(`${base}/#lookup`);
      await expect(page).toHaveURL(/#date$/);
      await expect(page.getByRole('heading',{name:'DATE',exact:true})).toBeVisible();
      const nav = page.locator('.store-mobile-toolbar');
      if (!desktop) { await expect(nav.getByRole('link')).toHaveCount(4); await expect(nav.getByRole('link',{name:'DATE',exact:true})).toHaveAttribute('aria-current','page'); }
      await expect(page.locator('[href="#lookup"]')).toHaveCount(0);
      await expect(page.locator('.store-desktop-rail').getByRole('button',{name:'Tra cứu',exact:true})).toHaveCount(0);
      await shot('alerts');
      for (const control of await page.locator('.store-date-search-form button, .store-date .store-tabs button, .store-date .store-filter, .store-date-statuses button').all()) {
        const box = await control.boundingBox(); expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
      }
      const input=page.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'});
      await input.fill('8936000123456'); await input.press('Enter');
      await expect(page.getByRole('region',{name:'Thông tin mã hàng'})).toContainText('SKU 0008421 · UPC 8936000123456');
      await expect(page.locator('.store-date-lot')).toHaveCount(3);
      await page.locator('.store-date-product summary').click();
      await expect(page.locator('.store-date-product').getByText('Thực phẩm khô', { exact: true })).toBeVisible();
      await page.locator('.store-date-product summary').click();
      await shot('barcode');
      await input.fill('A24-198');
      await expect(page.locator('.store-date-lot')).toHaveCount(1);
      await input.fill('0008421');
      await expect(page.locator('.store-date-lot')).toHaveCount(3);
      await input.fill('C24-118');
      await page.locator('.store-date-product summary').click();
      await expect(page.locator('.store-date-product').getByText(/Nông sản Miền Đông/)).toBeVisible();
      await expect(page.locator('.store-date-product').getByText('kg', { exact: true })).toBeVisible();
      await page.locator('.store-date-product summary').click();
      await expect(page.locator('.store-date-product')).toContainText('kg');
      await expect(page.locator('.store-date-product')).not.toContainText('Thực phẩm khô');
      const lot=page.locator('.store-date-lot'); await lot.click();
      const detail = desktop ? page.getByRole('region',{name:'Chi tiết lô DATE'}) : page.getByRole('dialog',{name:'Chi tiết lô DATE'});
      await expect(detail).toContainText('0011730');
      if (!desktop) { const box = await detail.boundingBox(); expect(box.y).toBeGreaterThanOrEqual(24); expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1); }
      await shot('detail');
      await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
      if (!desktop) { await expect(detail).toBeHidden(); await lot.click(); }
      await expect(detail.getByRole('button',{name:'Ghi nhận',exact:true})).toBeDisabled();
      await detail.getByRole('button',{name:'Đã xử lý',exact:true}).click();
      if (!desktop) { await expect(detail).toBeHidden(); await lot.click(); }
      await expect(detail.getByRole('button',{name:'Ghi nhận',exact:true})).toBeDisabled();
      await expect(detail.getByRole('button',{name:'Đã xử lý',exact:true})).toBeDisabled();
      await shot('resolved');
      if (!desktop) await page.keyboard.press('Escape');
      await page.getByRole('button',{name:'Về trang chủ',exact:true}).click();
      await expect(page.locator('.store-home-panels')).toContainText('3 cảnh báo đang mở');
      await expect(page.locator('.store-launcher-grid button[aria-label="Tra cứu"]')).toHaveCount(0);
      await shot('home');
      if (desktop) await page.locator('.store-launcher-grid').getByRole('button',{name:'Quản lý DATE',exact:true}).click();
      else await nav.getByRole('link',{name:'DATE',exact:true}).click();
      await input.fill('C24-118'); await page.locator('.store-date-lot').click();
      await expect(detail.getByRole('button',{name:'Đã xử lý',exact:true})).toBeDisabled();
      if (!desktop) await page.keyboard.press('Escape');
      await input.fill('0000000000001'); await input.press('Enter');
      await expect(page.locator('.store-date-message')).toContainText('Không tìm thấy mã hàng');
      await expect(page.locator('.store-date-product')).toHaveCount(0);
      await expect(input).toHaveValue('0000000000001');
      await shot('miss');
      await input.fill('0000000000000'); await input.press('Enter');
      await expect(page.locator('.store-date-message')).toContainText('Chưa thể tra cứu danh mục');
      await expect(input).toHaveValue('0000000000000');
      await shot('recovery');
      await page.getByRole('button',{name:'Quét mã để tìm lô DATE'}).click();
      await expect(input).toHaveValue('29123415005');
      await expect(page.getByRole('dialog',{name:'Quét mã vạch'})).toHaveCount(0);
      await expect(page.locator('.store-date-product')).toContainText('0011730');
      await expect(page.locator('.store-date-lot')).toHaveCount(1);
      const filter=page.getByRole('button',{name:'Lọc DATE'}); await filter.click();
      const filterSheet=page.getByRole('dialog',{name:'Lọc DATE'});
      await filterSheet.getByRole('button',{name:'Đã xử lý',exact:true}).click();
      await shot('filter');
      await page.keyboard.press('Escape'); await expect(filter).toBeFocused();
      await expect(page.locator('.store-date-lot')).toHaveCount(1);
      await input.fill(''); await page.getByRole('button',{name:/^Theo dõi DATE/}).click();
      if (desktop) await expect(page.getByRole('button',{name:'Thêm theo dõi'})).toBeDisabled();
      await shot('tracking');
      // Keyboard focus is visible on the shared search and no client exception occurred.
      await input.focus();
      const outline=await input.evaluate(el => getComputedStyle(el).outlineWidth); expect(parseFloat(outline)).toBeGreaterThanOrEqual(3);
      expect(errors).toEqual([]);
      results.push({viewport,unifiedSearch:true,skuBarcodeDistinct:true,lotIdExact:true,scanSynthetic:true,missRecovery:true,sessionState:true,guards:true,filterFocus:true,noOverflow:true,errors});
      console.log(`PASS DATE Fresh ${viewport.width}×${viewport.height}: unified search/scan/miss/recovery, state/guards/navigation/touch/focus`);
      await page.close();
    }
    if (process.env.STORE_CHECK_OFFLINE === '1') {
      const page = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:'reduce'});
      await page.goto(`${base}/#date`);
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      await page.reload();
      await page.waitForFunction(() => !!navigator.serviceWorker.controller);
      await page.context().setOffline(true); await page.reload();
      await expect(page.getByRole('region',{name:'Tra mã hàng',exact:true})).toBeVisible();
      const input = page.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'});
      await input.fill('29123415005'); await input.press('Enter');
      await expect(page.locator('.store-date-product')).toContainText('0011730');
      await page.locator('.store-date-lot').click();
      const detail = page.getByRole('dialog',{name:'Chi tiết lô DATE'});
      await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
      await expect(detail).toBeHidden();
      await page.getByRole('button',{name:'Về trang chủ'}).click();
      await expect(page.locator('.store-home-panels')).toContainText('3 cảnh báo đang mở');
      results.push({offlineBuildReload:true,barcodeLookup:true,sessionUpdate:true});
      console.log('PASS offline build reload: DATE stylesheet/search/state available from precache; synthetic session only');
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
