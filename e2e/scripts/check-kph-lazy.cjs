// Delay/abort only local code chunks, using synthetic fixtures.
const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4197';
const output = '.local/kph-loading/lazy';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      let releaseRoute;
      const routeGate = new Promise(resolve => { releaseRoute = resolve; });
      await page.route('**/assets/store-kph-workspace-*.js', async route => { await routeGate; await route.continue(); });
      await page.goto(`${base}/#home`);
      await page.locator('.store-launcher-grid .module-kph').click();
      await expect(page.locator('.kph-loading-frame')).toHaveAttribute('aria-busy', 'true');
      await expect(page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'KPH', exact: true })).toBeVisible();
      await page.screenshot({ path: `${output}/route-skeleton-${viewport.width}.png` });
      releaseRoute();
      await expect(page.locator('.store-kph')).toBeVisible();
      await expect(page.locator('.kph-loading-frame')).toHaveCount(0);
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Chọn tất cả', exact: true }).first().check();
      await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
      // Changing layout keeps the page and selection, rendering only one list.
      await page.setViewportSize({ width: viewport.width < 900 ? 1440 : 390, height: viewport.height });
      await expect(page.locator(viewport.width < 900 ? '.store-ticket' : '.store-kph-table tbody tr')).toHaveCount(0);
      await expect(page.getByText('25 đã chọn', { exact: true })).toBeVisible();
      await page.setViewportSize(viewport);
      await page.getByRole('button', { name: 'Trang sau', exact: true }).click();
      await expect(page.getByText('0 đã chọn', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Trang sau', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Trang trước', exact: true }).click();

      let releaseForm;
      const formGate = new Promise(resolve => { releaseForm = resolve; });
      await page.route('**/assets/create-record-dialog-*.js', async route => { await formGate; await route.continue(); });
      const trigger = page.locator('.store-create-actions .create-tpts');
      await trigger.click();
      let dialog = page.getByRole('dialog', { name: /Tạo phiếu KPH/ });
      await expect(dialog.locator('.store-form-skeleton')).toHaveAttribute('aria-busy', 'true');
      expect(await dialog.locator('.create-dialog-header').evaluate(el => {
        const style = getComputedStyle(el);
        return style.backgroundImage !== 'none' || style.backgroundColor !== 'rgba(0, 0, 0, 0)';
      })).toBe(true);
      const bounds = await dialog.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(-1);
      expect(bounds.y).toBeGreaterThanOrEqual(-1);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
      await page.screenshot({ path: `${output}/form-skeleton-${viewport.width}.png` });
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      const downloaded = page.waitForResponse(response => /\/assets\/create-record-dialog-.*\.js$/.test(response.url()));
      releaseForm(); await downloaded;
      await expect(dialog).toHaveCount(0);
      await trigger.click();
      await expect(dialog.getByRole('textbox', { name: 'Tên hàng hóa', exact: true })).toBeVisible();
      await expect(dialog).toHaveAttribute('data-kind', 'tpts');
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(errors).toEqual([]);
      await page.close();

      const failedForm = await browser.newPage({ viewport, serviceWorkers: 'block' });
      await failedForm.route('**/assets/create-record-dialog-*.js', route => route.abort());
      await failedForm.goto(`${base}/#kph`);
      await failedForm.locator('.store-create-actions .create-tpcn').click();
      await expect(failedForm.getByRole('alert')).toContainText('Chưa tải được biểu mẫu');
      await expect(failedForm.getByRole('button', { name: 'Tải lại ứng dụng' })).toBeVisible();
      await failedForm.getByRole('button', { name: 'Hủy mở phiếu' }).click();
      await expect(failedForm.getByRole('dialog')).toHaveCount(0);
      await failedForm.close();

      const failedRoute = await browser.newPage({ viewport, serviceWorkers: 'block' });
      await failedRoute.route('**/assets/store-kph-workspace-*.js', route => route.abort());
      await failedRoute.goto(`${base}/#kph`);
      await expect(failedRoute.getByRole('alert')).toContainText('Chưa tải được giao diện');
      await expect(failedRoute.getByRole('button', { name: 'Tải lại ứng dụng' })).toBeVisible();
      await failedRoute.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
      await expect(failedRoute.locator('.store-screen-home')).toBeVisible();
      await failedRoute.close();
      const failedEntry = await browser.newPage({ viewport, serviceWorkers: 'block' });
      const entryErrors = []; failedEntry.on('pageerror', error => entryErrors.push(error.message));
      await failedEntry.route('**/assets/store-app-*.js', route => route.abort());
      await failedEntry.goto(`${base}/#home`);
      await expect(failedEntry.getByRole('alert')).toContainText('Chưa tải được giao diện');
      expect(entryErrors).toEqual([]);
      await failedEntry.unroute('**/assets/store-app-*.js');
      await failedEntry.getByRole('button', { name: 'Tải lại ứng dụng' }).click();
      await expect(failedEntry.locator('.store-screen-home .store-account')).toBeVisible();
      await failedEntry.close();
      console.log(`PASS lazy KPH ${viewport.width}x${viewport.height}: loading, cancel/focus, page selection, resize, chunk failure recovery`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
