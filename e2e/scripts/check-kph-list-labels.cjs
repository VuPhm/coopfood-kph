// Semantic list labels on real mobile/desktop KPH renderers, using synthetic fixtures.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = process.env.STORE_LABEL_OUTPUT || '.local/kph-list-labels/evidence';
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
      const desktop = viewport.width >= 900;
      const rows = page.locator(desktop ? '.store-kph-table tbody tr' : '.store-ticket');
      const tones = new Set();
      for (const [index, kind] of ['tpts', 'tpcn'].entries()) {
        await page.locator('.store-kph .store-tabs button').nth(index === 0 ? 1 : 0).click();
        await expect(rows).toHaveCount(25);
        for (const row of await rows.all()) {
          const labels = row.locator('.ui-list-label');
          await expect(labels).toHaveCount(3);
          expect(await labels.evaluateAll(elements => elements.map(el => el.dataset.labelKind))).toEqual(['condition', 'resolution', 'approval']);
          for (const label of await labels.all()) {
            const text = await label.locator('.ui-list-label-text').textContent();
            expect(text.trim().length).toBeGreaterThan(0);
            expect(await label.getAttribute('title')).toContain(text);
            await expect(label.locator('.ui-list-label-icon')).toHaveAttribute('aria-hidden', 'true');
            expect(await label.getAttribute('tabindex')).toBeNull();
            tones.add(await label.getAttribute('data-tone'));
          }
        }
        await expect(page.locator('[data-label-kind="condition"]').filter({ hasText: 'Hết HSD' }).first()).toHaveAttribute('data-tone', 'danger');
        await expect(page.locator('[data-label-kind="resolution"]').filter({ hasText: /^Biện pháp: Hủy$/ }).first()).toHaveAttribute('data-tone', 'neutral');
        results.push(await audit(page, '.store-kph', `${kind}-labels-${viewport.width}`));
        await page.screenshot({ path: `${output}/${kind}-${viewport.width}.png` });
      }
      expect([...tones].sort()).toEqual(['danger', 'info', 'neutral', 'process', 'success', 'warning']);
      expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);

      // Long OTHER details and larger label text must wrap without truncating the value.
      const custom = page.locator('[data-label-kind="condition"][data-tone="neutral"]').first();
      const detail = 'Khác: bao bì cần kiểm tra lại với nhà cung cấp trước khi cửa hàng quyết định xử lý';
      await custom.locator('.ui-list-label-text').evaluate((el, text) => { el.textContent = text; }, detail);
      await page.locator('.ui-list-label').evaluateAll(labels => labels.forEach(label => {
        const style = getComputedStyle(label);
        label.style.fontSize = `${parseFloat(style.fontSize) * 1.5}px`;
        label.style.lineHeight = `${parseFloat(style.lineHeight) * 1.5}px`;
      }));
      await expect(custom.locator('.ui-list-label-text')).toHaveText(detail);
      expect(await custom.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      await page.screenshot({ path: `${output}/long-label-150-${viewport.width}.png`, fullPage: true });

      await page.reload(); await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      await page.getByRole('textbox', { name: 'Tìm tên hàng hoặc SKU', exact: true }).fill('0011730');
      await expect(rows).toHaveCount(1);
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Chọn Cải thìa VietGAP 500 g', exact: true }).check();
      await expect(page.getByText('1 đã chọn', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Xuất Excel', exact: true })).toContainText('1 phiếu đã duyệt');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Xuất Excel', exact: true })).toBeFocused();
      const opener = page.locator(desktop ? '.store-kph-row-open' : '.store-ticket-open').first();
      await opener.click();
      const sheet = page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true });
      await sheet.getByRole('button', { name: 'Không duyệt', exact: true }).click();
      await expect(page.locator('[data-label-kind="approval"]')).toContainText('Không duyệt');
      await expect(page.locator('[data-label-kind="approval"]')).toHaveAttribute('data-tone', 'neutral');
      await page.keyboard.press('Escape');
      await expect(opener).toBeFocused();
      await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
      const exportSheet = page.getByRole('dialog', { name: 'Xuất Excel', exact: true });
      await expect(exportSheet).toContainText('0 phiếu đã duyệt');
      await expect(exportSheet.getByRole('button', { name: 'Tải xuống', exact: true })).toBeDisabled();
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-label-kind="condition"]')).toContainText('Dập úng');
      await expect(page.locator('[data-label-kind="resolution"]')).toContainText('Hủy');
      expect(errors).toEqual([]);
      console.log(`PASS labels ${viewport.width}: six tones, three dimensions, contrast, long text 150%, search/select/review/export`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
