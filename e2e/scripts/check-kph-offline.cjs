// Current Store App only; real service worker, first feature use after offline reload.
const { chromium, expect } = require('../node_modules/@playwright/test');
const ExcelJS = require('exceljs');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4197';
const build = process.env.STORE_BUILD_DIR || '.local/kph-loading/after';
const output = '.local/kph-loading/offline';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'allow', reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
      await page.goto(`${base}/#home`);
      await expect(page.locator('.store-screen-home')).toBeVisible();
      await page.evaluate(async () => { await navigator.serviceWorker.ready; });
      const cached = await page.evaluate(async () => {
        const entries = await Promise.all((await caches.keys()).map(async name =>
          (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)));
        return entries.flat();
      });
      const assets = fs.readdirSync(path.join(build, 'assets')).filter(file => /\.(js|css)$/.test(file));
      for (const asset of assets) expect(cached).toContain(`/assets/${asset}`);
      for (const asset of ['coopfood-home-basket-620.webp', 'coopfood-home-basket-920.webp', 'coopfood-home-logo-144.webp', 'coopfood-home-logo-288.webp'])
        expect(cached).toContain(`/brand/${asset}`);
      expect(cached.some(url => /\/api\//.test(url))).toBe(false);
      // Precache downloads are separate from module execution in the window.
      const initialModules = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
      expect(initialModules.some(url => /store-kph-workspace-|create-record-dialog-|excel-export-/.test(url))).toBe(false);

      await context.setOffline(true);
      await cdp.send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      await cdp.send('Network.overrideNetworkState', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      const navigation = await page.reload();
      expect(navigation.fromServiceWorker()).toBe(true);
      await expect(page.locator('.store-screen-home')).toBeVisible();
      await cdp.send('Network.overrideNetworkState', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
      expect(await page.evaluate(() => navigator.onLine)).toBe(false);
      expect(await page.evaluate(async () => {
        try { await fetch('/offline-network-probe.txt', { cache: 'no-store' }); return false; }
        catch { return true; }
      })).toBe(true);
      await expect(page.getByText('Đang ngoại tuyến', { exact: true })).toBeVisible();
      await page.locator('.store-header-brand img').evaluate(image => image.decode());
      await page.locator('.store-home-art').evaluate(image => image.decode());
      await expect(page.locator('.pwa-status-toast')).toContainText('Phiếu dùng thử chỉ giữ trong phiên');
      const toast = await page.locator('.pwa-status-toast').boundingBox();
      const toolbar = await page.locator('.store-mobile-toolbar').boundingBox();
      if (viewport.width < 900) expect(toast.y + toast.height).toBeLessThanOrEqual(toolbar.y);
      await page.screenshot({ path: `${output}/home-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Đóng thông báo PWA', exact: true }).click();

      const chunkResponses = [];
      page.on('response', response => {
        if (/store-kph-workspace-|create-record-dialog-|excel-export-/.test(response.url()))
          chunkResponses.push({ url: response.url(), worker: response.fromServiceWorker() });
      });
      await page.evaluate(() => { window.location.hash = 'kph'; });
      await expect(page.locator('.store-kph')).toBeVisible();
      await page.getByRole('button', { name: 'Chọn', exact: true }).click();
      await page.getByRole('checkbox', { name: 'Chọn Cải thìa VietGAP 500 g', exact: true }).check();
      await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Tải xuống', exact: true }).click(),
      ]);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(await download.path());
      const sheet = workbook.getWorksheet('Thực phẩm tươi sống');
      expect(sheet).toBeTruthy();
      expect(sheet.getRow(9).getCell(3).value).toBe('0011730');
      expect(sheet.getRow(9).getCell(4).value).toBe('Cải thìa VietGAP 500 g');
      await page.getByRole('dialog', { name: 'Xuất Excel', exact: true }).waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Xong', exact: true }).click();
      await page.locator('.store-create-actions .create-tpts').click();
      await expect(page.getByRole('textbox', { name: 'Mã SKU / UPC', exact: true })).toBeVisible();
      await page.screenshot({ path: `${output}/form-${viewport.width}.png` });
      await page.getByRole('button', { name: 'Về danh sách KPH', exact: true }).click();
      for (const chunk of ['store-kph-workspace-', 'create-record-dialog-', 'excel-export-']) {
        expect(chunkResponses.some(response => response.url.includes(chunk) && response.worker)).toBe(true);
      }

      await page.evaluate(() => { window.location.hash = 'shelf'; });
      await expect(page.locator('.store-screen-shelf')).toBeVisible();
      await page.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
      await page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('10/10/2026');
      await page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Kết quả tra hạn lùi' }).locator('time[datetime="2026-10-08"]')).toHaveText('08/10');
      await page.screenshot({ path: `${output}/shelf-${viewport.width}.png` });
      expect(errors).toEqual([]);
      results.push({ viewport, cachedAssets: assets.length, offlineReload: true, firstOfflineChunks: chunkResponses, exportSku: '0011730', shelfDate: '08/10/2026', errors });
      await context.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
