// DATE presentation: aligned controls/cards, readable dates, responsive detail and text enlargement.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_DATE_OUTPUT || '.local/date-recomposition';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      await page.clock.setFixedTime(new Date("2026-10-12T05:00:00+07:00"));
      await page.goto(`${base}/#date`);
      await page.locator('.store-date-lot').first().waitFor();
      await expect(page.getByRole('region', { name: 'Tra mã hàng', exact: true })).toBeVisible();
      await expect(page.locator('.store-date-intro, .store-date-search-help, .store-date-eyebrow')).toHaveCount(0);
      const searchControls = await Promise.all([
        page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' }),
        page.getByRole('button', { name: 'Quét mã để tìm lô DATE', exact: true }),
        page.getByRole('button', { name: 'Tìm mã hàng', exact: true }),
      ].map(control => control.boundingBox()));
      for (const box of searchControls) {
        expect(box.y, 'search actions share one row').toEqual(searchControls[0].y);
        expect(box.height).toEqual(48); expect(box.width).toBeGreaterThanOrEqual(44);
      }
      const headingStyle = await page.locator('.store-date-list-heading h2').evaluate(el => ({ size: getComputedStyle(el).fontSize, weight: getComputedStyle(el).fontWeight }));
      expect(headingStyle).toEqual({ size: '17px', weight: '650' });
      expect(await page.locator('.store-date-result-count').evaluate(el => getComputedStyle(el).fontWeight)).toEqual('400');
      const layout = await page.locator('.store-date').evaluate(root => {
        const rect = selector => { const r = root.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        return { search: rect('.store-date-search-panel'), browser: rect('.store-date-browser'), tabs: rect('.store-tabs'), controls: rect('.store-date-list-controls'), toolbar: rect('.store-date-toolbar'), states: rect('.store-date-statuses'), lots: rect('.store-date-lots'), detail: root.querySelector('.store-date-detail') ? rect('.store-date-detail') : null };
      });
      expect(layout.search.height, 'compact upper search area').toEqual(48);
      for (const name of ['tabs', 'controls', 'toolbar', 'states', 'lots']) {
        expect(Math.abs(layout[name].x - layout.browser.x), `${name} left aligned`).toBeLessThanOrEqual(1);
        expect(Math.abs(layout[name].right - layout.browser.right), `${name} right aligned`).toBeLessThanOrEqual(1);
      }
      expect(layout.browser.x).toEqual(layout.search.x);
      expect(layout.browser.y - layout.search.bottom, 'separate search from lot management').toBeGreaterThanOrEqual(16);
      expect(layout.browser.y - layout.search.bottom).toBeLessThanOrEqual(32);
      for (const gap of [layout.controls.y - layout.tabs.bottom, layout.lots.y - layout.controls.bottom]) {
        expect(gap, 'controls grouped with list').toBeGreaterThanOrEqual(8); expect(gap).toBeLessThanOrEqual(24);
      }
      const sort = await page.locator('.store-date-toolbar .store-quick-sort-trigger').boundingBox();
      const filter = await page.getByRole('button', { name: 'Lọc DATE', exact: true }).boundingBox();
      expect(sort.y).toEqual(filter.y); expect(sort.height).toEqual(filter.height);
      expect(filter.x - sort.x - sort.width).toBeGreaterThanOrEqual(8);
      expect(filter.x - sort.x - sort.width).toBeLessThanOrEqual(16);
      if (viewport.width >= 900) {
        expect(layout.detail.y).toEqual(layout.browser.y);
        expect(layout.detail.x - layout.browser.right).toBeGreaterThanOrEqual(16);
        expect(layout.detail.height, 'empty detail should not stretch with list').toBeLessThan(360);
      } else expect(layout.detail).toBeNull();
      for (const lot of await page.locator('.store-date-lot').all()) {
        const box = await lot.boundingBox(), dates = await lot.locator('.store-date-lot-dates').boundingBox();
        expect(dates.width, 'dates use full card row').toBeGreaterThan(box.width * .75);
        const facts = await lot.locator('.store-date-lot-dates > span').evaluateAll(nodes => nodes.map(node => { const r = node.getBoundingClientRect(); return { y: r.y, bottom: r.bottom, height: r.height }; }));
        for (const fact of facts) expect(fact.height, 'date facts retain readable line height').toBeGreaterThanOrEqual(20);
        expect(box.height, 'condition labels keep the card compact').toBeLessThanOrEqual(viewport.width < 360 ? 180 : 160);
        await expect(lot.locator('.store-date-life, .store-timeline, [role="meter"]')).toHaveCount(0);
        await expect(lot.locator('[data-date-phase]')).toHaveCount(1);
        await expect(lot.locator('[data-processing-status]')).toHaveCount(1);
        if (facts.length === 2) expect(facts[0].y).toEqual(facts[1].y);
      }
      const noOverflow = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const clipped = await page.locator('.store-date').evaluate(root => [...root.querySelectorAll('button, input, .store-date-lot-dates, .store-date-lot-identifiers, .store-date-lot-labels')].filter(el => {
          if (!el.getBoundingClientRect().width) return false;
          return el.scrollWidth > el.clientWidth + 1;
        }).map(el => el.className));
        expect(clipped, 'no clipped controls or dates').toEqual([]);
      };
      await noOverflow();
      await page.locator('.store-date-lot').first().click();
      const detail = viewport.width >= 900 ? page.getByRole('region', { name: 'Chi tiết lô DATE' }) : page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
      const ack = await detail.getByRole('button', { name: 'Ghi nhận', exact: true }).boundingBox();
      const resolved = await detail.getByRole('button', { name: 'Đã xử lý', exact: true }).boundingBox();
      expect(ack.y, 'CTA row aligned').toEqual(resolved.y);
      expect(ack.height).toEqual(48); expect(resolved.height).toEqual(48);
      expect(Math.abs(ack.width - resolved.width), 'CTA equal weight').toBeLessThanOrEqual(1);
      await page.screenshot({ path: `${output}/actions-layout-${viewport.width}.png` });
      await page.reload(); await page.locator('.store-date-lot').first().waitFor();
      await page.screenshot({ path: `${output}/overview-${viewport.width}.png`, fullPage: true });
      // Enlarge computed text, including px sizes, without altering container widths.
      await page.locator('.store-date').evaluate(root => {
        const styles = [...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
        for (const { el, font, line } of styles) {
          el.style.fontSize = `${font * 1.5}px`;
          if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`;
        }
      });
      await noOverflow();
      await page.screenshot({ path: `${output}/text-150-${viewport.width}.png`, fullPage: true });
      results.push({ viewport, layout });
      await page.close();
      console.log(`PASS DATE layout ${viewport.width}: shared gutters, grouped spacing, sort/filter alignment, full-width date facts, responsive detail, 150% text reflow`);
    }
    fs.writeFileSync(`${output}/layout-results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
