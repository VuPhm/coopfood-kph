// Targeted geometry/interaction check for the marker gutter, using synthetic records.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4213';
const output = process.env.STORE_MARKER_OUTPUT || '.local/kph-marker-spacing/evidence';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const desktop = viewport.width >= 900;
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#kph`);
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      const rows = page.locator(desktop ? '.store-kph-table tbody tr' : '.store-ticket');
      const title = row => row.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open > strong');
      async function geometry(selected) {
        const data = [];
        for (const row of await rows.all()) {
          const marker = row.locator('.ui-list-item-marker');
          const cue = await marker.boundingBox(), box = await row.boundingBox(), name = await title(row).boundingBox();
          await expect(marker).toHaveAttribute('aria-hidden', 'true');
          expect(cue.width).toBe(3); expect(cue.height).toBe(desktop ? 24 : 36);
          expect(cue.x - box.x).toBeGreaterThanOrEqual(12);
          expect(cue.x - box.x).toBeLessThanOrEqual(14);
          expect(name.x - cue.x - cue.width).toBeGreaterThanOrEqual(12);
          expect(cue.y).toBeGreaterThan(box.y);
          expect(cue.y + cue.height).toBeLessThan(box.y + box.height);
          if (desktop) expect(Math.abs(cue.y + cue.height / 2 - box.y - box.height / 2)).toBeLessThanOrEqual(1);
          else expect(cue.y - name.y).toBe(4);
          if (selected) {
            const control = row.locator(desktop ? '.store-kph-table-selector' : '.store-ticket-selector');
            const rect = await control.boundingBox();
            expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
            expect(rect.x - cue.x - cue.width).toBeGreaterThanOrEqual(12);
            expect(name.x).toBeGreaterThanOrEqual(rect.x + rect.width + (desktop ? 0 : 8));
          }
          data.push({ cue, box, name });
        }
        expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        return data;
      }
      for (const [index, kind] of ['tpcn', 'tpts'].entries()) {
        await page.locator('.store-kph .store-tabs button').nth(index).click();
        await expect(rows).toHaveCount(25);
        const normal = await geometry(false);
        await page.screenshot({ path: `${output}/${kind}-${viewport.width}.png` });
        await page.getByRole('button', { name: 'Chọn', exact: true }).click();
        await rows.first().getByRole('checkbox').check();
        await expect(page.getByText('1 đã chọn', { exact: true })).toBeVisible();
        const selected = await geometry(true);
        for (let i = 0; i < normal.length; i++) expect(selected[i].cue.x).toBe(normal[i].cue.x);
        await page.screenshot({ path: `${output}/${kind}-selected-${viewport.width}.png` });
        await page.getByRole('button', { name: 'Xong', exact: true }).click();
        results.push({ viewport, kind, normal, selected });
      }
      // Reflow the first title while keeping its marker aligned to the identity block.
      const longName = 'Hàng mẫu kiểm tra tên dài để xác minh khoảng cách thanh nhãn và vùng nội dung';
      await title(rows.first()).locator('span').evaluate((el, value) => { el.textContent = value; el.style.fontSize = '24px'; el.style.lineHeight = '34.5px'; }, longName);
      await geometry(false);
      await page.screenshot({ path: `${output}/long-name-150-${viewport.width}.png` });
      const opener = rows.first().locator(desktop ? '.store-kph-row-open' : '.store-ticket-open');
      await opener.click();
      await expect(page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true })).toBeVisible();
      await page.keyboard.press('Escape'); await expect(opener).toBeFocused();
      expect(errors).toEqual([]);
      console.log(`PASS marker spacing ${viewport.width}: both types, gutter, fixed size, text/checkbox clearance, selection, long title 150%, open/focus`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
