async function setReportPhase(page, value) {
 const labels={all:'Toàn bộ danh mục',attention:'Cần chú ý',EXPIRED:'Hết HSD'};
 await page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true}).click();
 await page.getByRole('group',{name:'Tình trạng DATE',exact:true}).getByRole('button',{name:labels[value],exact:true}).click();
 await page.getByRole('button',{name:'Xong',exact:true}).click();
}
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const ExcelJS = require('exceljs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4221';
const output = process.env.STORE_REPORT_OUTPUT || '.local/reports-design/evidence-r14/regression';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
const results = [];
async function inspect(page, state, width) {
 if(await page.locator('.report-sliding-cap').count()) await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${state}: page overflow`).toBe(true);
  const short = await page.locator('.date-report button, .date-report-sheet button').evaluateAll(nodes => nodes.filter(e => e.getBoundingClientRect().width && e.getBoundingClientRect().height < 43).map(e => e.textContent));
  expect(short, `${state}: touch heights`).toEqual([]);
  const checks = await page.locator('.report-lot-check').evaluateAll(nodes => nodes.filter(e => e.getBoundingClientRect().width).map(e => ({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height})));
  expect(checks.every(rect => rect.w >= 44 && rect.h >= 44), `${state}: checkbox targets`).toBe(true);
  await audit(page, '.report-composer, .date-report, .date-report-sheet', `${state}-${width}`);
  await page.screenshot({ path: `${output}/${state}-${width}.png`, fullPage: true });
}
async function create(page) {
  await page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo và lưu lịch sử', exact: true }).click();
}
async function go(page, width, name) {
  const label = name === 'DATE' ? 'Quản lý DATE' : name;
  if (width < 900) {
    await page.locator('.store-mobile-toolbar').getByRole('link', { name: 'Trang chủ', exact: true }).click();
    await page.locator('.store-launcher-grid').getByRole('button', { name: label, exact: true }).click();
  } else {
    await page.locator('.store-desktop-rail').getByRole('link', { name: label, exact: true }).click();
  }
}
async function summary(page) { await page.getByRole('button', { name: /^Báo cáo tổng hợp/ }).click(); await expect(page.getByRole('heading', { name: 'Báo cáo tổng hợp', exact: true })).toBeFocused(); }
async function oneLot(page) { await bulk(page, 'Bỏ chọn toàn bộ'); await page.getByRole('checkbox', { name: 'Chọn lô C24-118', exact: true }).check(); }

async function pick(page, control, value) {
 await control.click();
 await page.locator(`[role="option"][data-option-value="${value}"]`).click();
 await expect(control).toHaveAttribute('aria-expanded','false');
}
async function bulk(page, name) {
 await page.getByRole('button',{name:'Tùy chọn chọn lô',exact:true}).click();
 await page.getByRole('menuitem',{name,exact:true}).click();
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'reduce', acceptDownloads: true, serviceWorkers: 'block' });
      await page.clock.install({ time: new Date('2026-10-14T05:00:00Z') });
      page.setDefaultTimeout(10000);
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/#reports`);
      await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeFocused();
      await expect(page.locator('.report-type-card')).toHaveCount(3);
      const nav = page.locator(viewport.width < 900 ? '.store-mobile-toolbar' : '.store-desktop-rail');
      await expect(nav.getByRole('link', { name: 'Báo cáo', exact: true })).toHaveAttribute('aria-current', 'page');
      await inspect(page, 'menu', viewport.width);
      await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Chưa có báo cáo', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await page.getByRole('button', { name: /^Hàng đã xử lý/ }).click();
      await expect(page.getByRole('heading', { name: 'Không có lô phù hợp', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await page.getByRole('button', { name: /^Hàng cần chú ý/ }).click();
      await expect(page.locator('#report-filter-summary')).toContainText('Cần chú ý');
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await summary(page);
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 7 / 7 lô');
      await bulk(page, 'Bỏ chọn toàn bộ');
      await expect(page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true })).toBeDisabled();
      await expect(page.getByRole('button', { name: 'Lưu thành mẫu', exact: true })).toBeDisabled();
      await page.getByRole('checkbox', { name: 'Chọn lô C24-118', exact: true }).check();
      const search = page.getByLabel('Tìm mã hàng hoặc lô báo cáo', { exact: true });
      await search.fill('0008421');
      await expect(page.locator('.report-selection-bar')).toContainText('1 lô đã chọn ngoài kết quả tìm');
      await page.getByRole('checkbox', { name: 'Chọn lô A24-198', exact: true }).check();
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 2 / 7 lô');
      await search.fill('');
      await expect(page.getByRole('checkbox', { name: 'Chọn lô C24-118', exact: true })).toBeChecked();
      await page.getByRole('checkbox', { name: 'Chọn lô A24-198', exact: true }).uncheck();
      await setReportPhase(page, 'EXPIRED');
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 1 / 3 lô');
      await inspect(page, 'selection', viewport.width);
      // Custom kinds are saved as recipes, with explicit selected lots or dynamic conditions.
      await page.getByRole('button', { name: 'Lưu thành mẫu', exact: true }).click();
      // Names now arrive ready to save; no required typing step.
      await expect(page.getByLabel('Tên mẫu', { exact: true })).toHaveValue('Hết HSD · 1 lô');
      await expect(page.getByRole('button', { name: 'Lưu mẫu', exact: true })).toBeFocused();
      await page.getByLabel('Tên mẫu', { exact: true }).fill('Báo cáo tổng hợp');
      await page.getByRole('button', { name: 'Lưu mẫu', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('đã có');
      await page.getByLabel('Tên mẫu', { exact: true }).fill('Nhóm quầy A');
      await expect(page.getByLabel('Danh mục cho lần sau', { exact: true })).toHaveAttribute('data-value', 'items');
      await inspect(page, 'save-template', viewport.width);
      await page.getByRole('button', { name: 'Lưu mẫu', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Đã lưu mẫu');
      // A query can hide selected rows; it must never silently change what is generated.
      await search.fill('không có trong danh mục');
      await expect(page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true })).toBeEnabled();
      await expect(page.locator('.report-selection-bar')).toContainText('1 lô đã chọn ngoài kết quả tìm');
      await create(page);
      await expect(page.getByRole('heading', { name: 'Bản báo cáo DATE', exact: true })).toBeFocused();
      await expect(page.locator('.date-report-catalog-heading')).toContainText('1 mã hàng · 1 lô');
      await inspect(page, 'document', viewport.width);
      await page.getByRole('button', { name: 'Chi tiết lô C24-118', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Chi tiết lô báo cáo' })).toContainText('Mở');
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Chi tiết lô C24-118', exact: true })).toBeFocused();
      const downloadEvent = page.waitForEvent('download');
      await page.getByRole('button', { name: 'Xuất Excel', exact: true }).click();
      const download = await downloadEvent; const file = `${output}/selected-${viewport.width}.xlsx`; await download.saveAs(file);
      const wb = new ExcelJS.Workbook(); await wb.xlsx.readFile(file); const sheet = wb.worksheets[0];
      expect(sheet.getCell('A10').value).toBe('0011730');
      expect(sheet.getCell('A11').value).toBeNull();
      expect(sheet.getCell('F10').value).toBe('Chưa có');
      expect(sheet.getCell('H10').value).toBe('Hết HSD');
      expect(sheet.getCell('I10').value).toBe('Mở');
      expect(sheet.getCell('B5').value).not.toContain('Tìm:');
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('.store-header')).toBeHidden();
      await expect(page.locator('.date-report-table tbody tr')).toHaveCount(1);
      await page.pdf({ path: `${output}/selected-${viewport.width}.pdf`, printBackground: true });
      await page.emulateMedia({ media: 'screen' });
      await page.getByRole('button', { name: 'Về lịch sử báo cáo', exact: true }).click();
      await expect(page.locator('.report-history-card')).toHaveCount(1);
      await inspect(page, 'history', viewport.width);
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await page.getByRole('button', { name: /^Nhóm quầy A/ }).click();
      await expect(page.locator('#report-filter-summary')).toContainText('Hết HSD');
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 1 / 3 lô');
      // Save a dynamic filter template, then prove both recipes survive a new route and reload.
      await page.getByRole('button', { name: 'Lưu mẫu', exact: true }).click();
      await pick(page, page.getByLabel('Cách lưu mẫu', { exact: true }), 'new');
      await page.getByLabel('Tên mẫu', { exact: true }).fill('Tất cả lô hết hạn');
      await pick(page, page.getByLabel('Danh mục cho lần sau', { exact: true }), 'filter');
      await page.getByRole('button', { name: 'Lưu mẫu', exact: true }).click();
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await page.getByRole('button', { name: /^Tất cả lô hết hạn/ }).click();
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 3 / 3 lô');
      await go(page, viewport.width, 'DATE');
      await page.getByRole('button', { name: /Cải thìa/ }).click();
      await page.getByRole('button', { name: 'Ghi nhận', exact: true }).click();
      await page.getByRole('button', { name: 'Hẹn báo lại', exact: true }).click();
      await go(page, viewport.width, 'Báo cáo');
      await page.getByRole('button', { name: 'Lịch sử 1', exact: true }).click();
      await page.locator('.report-history-card').click();
      await page.getByRole('button', { name: 'Chi tiết lô C24-118', exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('Mở'); // frozen, despite live DATE mutation
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await page.getByRole('button', { name: 'Dùng lại cấu hình', exact: true }).click();
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 1 / 3 lô');
      await create(page);
      await page.getByRole('button', { name: 'Chi tiết lô C24-118', exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('Đã ghi nhận');
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeFocused();
      await expect(page.locator('.report-custom-types .report-type-card')).toHaveCount(2);
      await inspect(page, 'saved-menu', viewport.width);
      await page.getByRole('button', { name: 'Lịch sử 2', exact: true }).click();
      await expect(page.locator('.report-history-card')).toHaveCount(2);
      await page.locator('.report-history-card').first().click();
      await page.getByRole('button', { name: 'Chi tiết lô C24-118', exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('Đã ghi nhận'); // restored snapshot, live source reset on reload
      await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
      await page.getByRole('button', { name: 'Về lịch sử báo cáo', exact: true }).click();
      await page.addStyleTag({ content: '.date-report :is(p, small, span, label, button, input, select) { font-size: 150% !important; }' });
      await inspect(page, 'large-history', viewport.width);
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await summary(page);
      await inspect(page, 'large-composer', viewport.width);
      await page.getByRole('button', { name: 'Chọn kỳ báo cáo', exact: true }).click();
      await page.getByRole('button', { name: 'Tháng trước', exact: true }).click();
      await page.getByRole('button', { name: 'Áp dụng kỳ', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Chưa có dữ liệu chốt kỳ này', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true })).toBeDisabled();
      expect(errors).toEqual([]);
      results.push({ viewport, passed: true, history: 2, templates: 2, exportedRows: 1, errors });
      console.log(`PASS report library ${viewport.width}×${viewport.height}`);
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
    await page.addInitScript(() => { const write = Storage.prototype.setItem; Storage.prototype.setItem = function(key,value) { if (key.startsWith('coopfood:mock-date-report-library')) throw new DOMException('quota','QuotaExceededError'); return write.call(this,key,value); }; });
    await page.goto(`${base}/#reports`); await summary(page); await oneLot(page);
    await create(page);
    await expect(page.locator('.report-library-error')).toContainText('trong phiên');
    await page.getByRole('button', { name: 'Về lịch sử báo cáo', exact: true }).click();
    await expect(page.locator('.report-history-card')).toHaveCount(1);
    await page.close();
    console.log('PASS storage failure: explicit session fallback, no false persistence claim');
  } finally { await browser.close(); fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
