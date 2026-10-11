const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const sessionFixture = require('../../contracts/fixtures/api/session.json');
const recordFixture = require('../../contracts/fixtures/api/kph-record.json');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4198';
const output = '.local/kph-loading/online-check';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      const scripts = []; page.on('request', request => { if (/\.js$/.test(request.url())) scripts.push(request.url()); });
      let releaseFirst, releaseSecond, pageTwoRequests = 0;
      const firstGate = new Promise(resolve => { releaseFirst = resolve; });
      const secondGate = new Promise(resolve => { releaseSecond = resolve; });
      const firstRecords = Array.from({ length: 25 }, (_, index) => ({
        ...recordFixture, id: `synthetic-page-1-${index}`, photos: [],
        catalogSnapshot: { ...recordFixture.catalogSnapshot, productName: `Phiếu trang một ${index}` },
      }));
      const secondRecord = { ...firstRecords[0], id: 'synthetic-page-2', catalogSnapshot: { ...firstRecords[0].catalogSnapshot, productName: 'Phiếu trang hai' } };
      await page.route('**/api/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/auth/session')) return route.fulfill({ json: sessionFixture });
        if (url.pathname.endsWith('/kph')) {
          expect(url.pathname).toBe(`/api/v1/stores/${sessionFixture.user.stores[0].id}/kph`);
          expect(url.searchParams.get('type')).toBe('TPCN');
          expect(url.searchParams.get('pageSize')).toBe('25');
          const index = Number(url.searchParams.get('page'));
          if (index === 1) await firstGate;
          else { pageTwoRequests++; await secondGate; }
          return route.fulfill({ json: { items: index === 1 ? firstRecords : [secondRecord], page: index, pageSize: 25, totalItems: 26, totalPages: 2, typeTotals: { tpcn: 26, tpts: 0 } } });
        }
        return route.fulfill({ status: 404, json: { title: 'Synthetic route unavailable' } });
      });
      await page.goto(base);
      await expect(page.locator('.kph-loading')).toHaveAttribute('aria-busy', 'true');
      await expect(page.getByText('Chưa có phiếu nào trên máy chủ.')).toHaveCount(0);
      await page.screenshot({ path: `${output}/server-skeleton-${viewport.width}.png` });
      releaseFirst();
      await expect(page.getByText('Phiếu trang một 0', { exact: true }).first()).toBeAttached();
      await page.getByRole('checkbox', { name: 'Chọn phiếu synthetic-page-1-0', exact: true }).filter({ visible: true }).check();
      const next = page.getByRole('button', { name: 'Trang sau', exact: true });
      await next.hover();
      await expect.poll(() => pageTwoRequests).toBe(1);
      await expect(page.getByText('Trang 1 / 2', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Duyệt 1 phiếu', exact: true })).toBeVisible();
      await next.click();
      await expect(page.getByRole('navigation', { name: 'Phân trang lịch sử phiếu' })).toHaveAttribute('aria-busy', 'true');
      await expect(page.getByRole('checkbox', { name: 'Chọn phiếu synthetic-page-1-0', exact: true }).first()).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Duyệt 1 phiếu', exact: true })).toHaveCount(0);
      releaseSecond();
      await expect(page.getByText('Trang 2 / 2', { exact: true })).toBeVisible();
      await expect(page.getByText('Phiếu trang hai', { exact: true }).first()).toBeAttached();
      await expect(next).toBeDisabled();
      expect(pageTwoRequests).toBe(1);
      expect(scripts.some(url => /exceljs|excel-export/.test(url))).toBe(false);
      expect(errors).toEqual([]);
      await page.screenshot({ path: `${output}/page-two-${viewport.width}.png` });
      console.log(`PASS online KPH ${viewport.width}x${viewport.height}: skeleton, scoped request, prefetch dedupe, busy selection, lazy Excel`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
