// Synthetic Fresh forms and item markers; no API or business state changes.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = process.env.STORE_CHOICE_OUTPUT || '.local/kph-choice-items/evidence';
process.env.STORE_KPH_COLORS_OUTPUT ||= output;
const { audit } = require('./check-kph-colors.cjs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4213';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(8000);
      await page.goto(`${base}/#kph`);
      await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      const rows = page.locator(viewport.width >= 900 ? '.store-kph-table tbody tr' : '.store-ticket');
      for (const tab of [0, 1]) {
        await page.locator('.store-kph .store-tabs button').nth(tab).click();
        await expect(rows).toHaveCount(25);
        for (const row of await rows.all()) {
          const marker = row.locator('.ui-list-item-marker');
          await expect(marker).toHaveCount(1);
          await expect(marker).toHaveAttribute('aria-hidden', 'true');
          await expect(marker).toHaveAttribute('data-variant', 'bar');
          const cue = await marker.boundingBox(), rect = await row.boundingBox();
          expect(cue.width).toBe(3); expect(cue.height).toBe(viewport.width >= 900 ? 24 : 36);
          expect(cue.x - rect.x).toBeGreaterThanOrEqual(12);
          expect(cue.x - rect.x).toBeLessThanOrEqual(14);
          expect(cue.x).toBeGreaterThanOrEqual(rect.x);
          const ratio = await marker.evaluate(el => {
            const rgb = color => color.match(/[\d.]+/g).slice(0, 3).map(Number);
            const lum = color => rgb(color).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((s, v, i) => s + v * [.2126, .7152, .0722][i], 0);
            let surface = el.parentElement;
            while (getComputedStyle(surface).backgroundColor === 'rgba(0, 0, 0, 0)') surface = surface.parentElement;
            const a = lum(getComputedStyle(el).backgroundColor), b = lum(getComputedStyle(surface).backgroundColor);
            return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          });
          expect(ratio).toBeGreaterThanOrEqual(3);
          await expect(marker).toHaveAttribute('data-tone', await row.locator('[data-label-kind="condition"]').getAttribute('data-tone'));
        }
      }
      await page.screenshot({ path: `${output}/items-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await rows.first().getByRole('checkbox').check();
      await expect(rows.first().locator('.ui-list-item-marker')).toHaveAttribute('data-variant', 'bar');
      const selectedCue = await rows.first().locator('.ui-list-item-marker').boundingBox(), selectedRow = await rows.first().boundingBox();
      expect(selectedCue.x - selectedRow.x).toBeGreaterThanOrEqual(12);
      expect(selectedCue.x - selectedRow.x).toBeLessThanOrEqual(14);
      await page.screenshot({ path: `${output}/items-selected-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Xong', exact: true }).click();
      for (const kind of ['tpcn', 'tpts']) {
        const opener = page.locator(`.store-create-actions .create-${kind}`);
        await opener.click();
        await expect(page.locator('#product-name')).toBeVisible();
        const groups = page.locator('.store-create-screen fieldset').filter({ has: page.locator('.choice-grid') });
        await expect(groups).toHaveCount(2);
        await expect(groups.nth(0).locator('input:checked')).toHaveValue(kind === 'tpcn' ? 'NEAR_EXPIRY' : 'BRUISED_WATERLOGGED');
        await expect(groups.nth(1).locator('input:checked')).toHaveValue('CANCEL');
        const first = groups.nth(0).locator('input').first();
        await first.focus(); await page.keyboard.press('ArrowRight');
        await expect(groups.nth(0).locator('input').nth(1)).toBeChecked();
        expect(await groups.nth(0).locator('.choice-card:has(input:checked)').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
        const layout = [];
        for (const [index, group] of (await groups.all()).entries()) {
          const cards = group.locator('.choice-card');
          for (const card of await cards.all()) {
            const radio = card.getByRole('radio');
            await card.click();
            await expect(radio).toBeChecked();
            await expect(group.locator('input:checked')).toHaveCount(1);
            await expect(card.locator('.choice-indicator svg')).toBeVisible();
            expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
            const rect = await card.boundingBox();
            expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
            // Restore the legacy option palette. These are radio choices, not destructive actions.
            const value = await radio.inputValue();
            const expected = index === 0 ? value === 'NEAR_EXPIRY' ? 'warning' : ['EXPIRED', 'OTHER'].includes(value) ? 'neutral' : 'danger'
              : value === 'EXCHANGE' ? 'success' : value === 'RETURN' ? 'info' : value === 'CANCEL' ? 'danger' : 'neutral';
            await expect(card).toHaveAttribute('data-tone', expected);
            results.push(await audit(page, '.store-create-screen', `${kind}-${index}-${value}-${viewport.width}`));
          }
          layout.push(await cards.evaluateAll(elements => elements.map(el => ({ value: el.dataset.choiceValue, x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y, width: el.getBoundingClientRect().width }))));
        }
        // Two equal columns; condition OTHER uses the whole final row.
        expect(layout[0][0].y).toBe(layout[0][1].y);
        expect(Math.abs(layout[0][0].width - layout[0][1].width)).toBeLessThanOrEqual(1);
        expect(layout[0].at(-1).width).toBeGreaterThan(layout[0][0].width * 1.9);
        expect(layout[1][0].y).toBe(layout[1][1].y);
        await page.getByRole('textbox', { name: 'Nội dung tình trạng khác', exact: true }).fill('Bao bì cần kiểm tra riêng');
        await page.getByRole('textbox', { name: 'Nội dung biện pháp khác', exact: true }).fill('Trao đổi nhà cung cấp');
        await groups.nth(0).locator('.choice-card').first().click();
        await expect(page.getByRole('textbox', { name: 'Nội dung tình trạng khác', exact: true })).toHaveCount(0);
        await groups.nth(0).locator('.choice-card:has(input[value="OTHER"])').click();
        await expect(page.getByRole('textbox', { name: 'Nội dung tình trạng khác', exact: true })).toHaveValue('Bao bì cần kiểm tra riêng');
        // Restore default selections for visual review, keeping form native behavior.
        await groups.nth(0).locator('.choice-card').first().click();
        await groups.nth(1).locator('.choice-card').first().click();
        await groups.nth(0).scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${output}/choices-${kind}-${viewport.width}.png` });
        await page.locator('.store-create-screen .choice-card').evaluateAll(cards => cards.forEach(el => { el.style.fontSize = '19.5px'; el.style.lineHeight = '27px'; }));
        expect(await page.locator('.create-dialog-form').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        for (const card of await page.locator('.store-create-screen .choice-card').all())
          expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
        await page.screenshot({ path: `${output}/choices-150-${kind}-${viewport.width}.png` });
        await page.getByRole('button', { name: 'Hủy', exact: true }).click();
        await expect(opener).toBeFocused();
      }
      expect(errors).toEqual([]);
      console.log(`PASS choices/items ${viewport.width}: left bars/contrast, legacy palette, 2-column forms, native radios/keyboard/OTHER, all selection colors/contrast, reflow 150%`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
