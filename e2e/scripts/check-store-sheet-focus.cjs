// Targeted r7 lifecycle, result coherence and Figma geometry gate; synthetic data only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_APP_URL || 'http://127.0.0.1:5177';
const out = '.local/ui-r7';
fs.mkdirSync(out, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV7kAAAAASUVORK5CYII=', 'base64');
const results = [];
async function route(page, name) {
 await page.evaluate(name => { location.hash = name; }, name);
 await page.locator(`.store-screen-${name}`).waitFor();
}
async function close(page, dialog, method, button) {
 if (method === 'escape') await page.keyboard.press('Escape');
 else await dialog.getByRole('button', { name: button, exact: true }).click();
 await expect(dialog).toBeHidden();
}
async function capture(page, name) {
 await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
 await page.screenshot({ path: `${out}/${name}.png` });
}
async function expandedHit(page, locator, offsetY) {
 const rect = await locator.boundingBox();
 const point = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 + offsetY };
 expect(await locator.evaluate((el, point) => el.contains(document.elementFromPoint(point.x, point.y)), point)).toBe(true);
 await page.mouse.click(point.x, point.y);
}
(async () => {
 const browser = await chromium.launch({ headless: true });
 try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
   const page = await browser.newPage({ viewport, reducedMotion: 'reduce', timezoneId: 'Asia/Ho_Chi_Minh' });
   page.setDefaultTimeout(8000);
   const runtimeErrors = [];
   page.on('pageerror', error => runtimeErrors.push(error.message));
   await page.goto(`${base}/#kph`);
   await page.locator('.store-screen-kph').waitFor();
   for (const [label, title] of [['Lọc phiếu KPH', 'Lọc & sắp xếp'], ['Tài khoản và cửa hàng', 'Tài khoản']]) {
    for (const method of ['escape', 'close']) {
     const opener = page.getByRole('button', { name: label, exact: true });
     if (method === 'escape') { await opener.focus(); await page.keyboard.press('Enter'); }
     else await opener.click();
     const dialog = page.getByRole('dialog', { name: title, exact: true });
     await expect(dialog).toBeVisible();
     await close(page, dialog, method, 'Đóng');
     await expect(opener).toBeFocused();
    }
   }
   const filterOpener = page.getByRole('button', { name: 'Lọc phiếu KPH' });
   await filterOpener.click();
   const filterSheet = page.getByRole('dialog', { name: 'Lọc & sắp xếp' });
   const calendarOpener = filterSheet.getByRole('button', { name: 'Chọn từ ngày', exact: true });
   await calendarOpener.click();
   const calendar = page.getByRole('dialog', { name: 'Lịch chọn ngày', exact: true });
   await expect(calendar).toBeVisible();
   await page.keyboard.press('Escape'); await expect(calendar).toBeHidden();
   await expect(filterSheet).toBeVisible(); await expect(calendarOpener).toBeFocused();
   await filterSheet.getByRole('button', { name: 'Đóng', exact: true }).click();
   await expect(filterSheet).toBeHidden(); await expect(filterOpener).toBeFocused();
   const quickOpener = page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng' });
   await quickOpener.click();
   const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
   await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
   const accountOpener = page.getByRole('button', { name: 'Tài khoản và cửa hàng' });
   await accountOpener.click();
   await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toBeVisible();
   await page.keyboard.press('Escape');
   await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toBeHidden();
   await expect(quick).toBeVisible();
   await expect(quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true })).toHaveValue('01/10/2026');
   await expect(accountOpener).toBeFocused();
   await accountOpener.click();
   await route(page, 'date');
   await expect(page.getByRole('dialog', { name: 'Tài khoản', exact: true })).toBeHidden();
   await expect(quick).toBeHidden();
   await expect(page.locator('#store-content')).toBeFocused();
   await page.getByRole('textbox', { name: 'Tìm mã hàng hoặc lô' }).fill(' C24-118 ');
   await expect(page.locator('.store-date-lot')).toHaveCount(1);
   await page.getByRole('textbox', { name: 'Tìm mã hàng hoặc lô' }).fill('');
   for (const method of ['escape', 'close']) {
    const opener = page.getByRole('button', { name: 'Quét mã để tìm lô DATE' });
    await opener.click();
    const scanner = page.locator('.barcode-scanner-dialog-content');
    await expect(scanner).toBeVisible();
    await close(page, scanner, method, 'Đóng quét mã');
    await expect(opener).toBeFocused();
   }
   await capture(page, `date-${viewport.width}`);
   await route(page, 'lookup');
   const input = page.getByRole('textbox', { name: 'Mã hàng, tên hàng hoặc lô' });
   const submit = page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true });
   await input.fill(' bánh quy '); await submit.click();
   await expect(page.getByRole('heading', { name: 'Bánh quy bơ hộp 300 g' })).toBeVisible();
   const lookupIcons = await page.evaluate(() => {
    const search = document.querySelector('.store-lookup-search label > img');
    const product = document.querySelector('.store-lookup-product-icon img');
    const rect = product.getBoundingClientRect();
    return { search: search.src.split('/').pop(), searchOpacity: getComputedStyle(search).opacity, product: product.src.split('/').pop(), productSize: [rect.width, rect.height], productFilter: getComputedStyle(product).filter };
   });
   expect(lookupIcons.search).toBe('0d9947bc-6df8-489b-b0f1-4d3264da3d36.svg');
   expect(lookupIcons.searchOpacity).toBe('1');
   expect(lookupIcons.product).toBe('f1cc55ce-810f-4467-98f9-d444e648a218.svg');
   expect(lookupIcons.productSize).toEqual(viewport.width < 900 ? [18, 18] : [16, 16]);
   expect(lookupIcons.productFilter).toBe('brightness(0)');
   await capture(page, `lookup-${viewport.width}`);
   await input.fill('0011730');
   await expect(page.locator('.store-lookup-product')).toHaveCount(0);
   await submit.click();
   await expect(page.getByRole('heading', { name: 'Cải thìa VietGAP 500 g' })).toBeVisible();
   const scanLookup = page.getByRole('button', { name: 'Quét barcode để tra cứu' });
   await scanLookup.focus(); await page.keyboard.press('Enter');
   const scanner = page.locator('.barcode-scanner-dialog-content');
   await expect(scanner).toBeVisible();
   await scanner.getByRole('button', { name: 'Nhập mã thủ công', exact: true }).click();
   await expect(scanner).toBeHidden(); await expect(scanLookup).toBeFocused();
   await route(page, 'kph');
   const create = page.locator('.store-create-actions .create-tpts');
   for (const method of ['escape', 'close']) {
    await create.click();
    const form = page.locator('.store-create-screen');
    await expect(form).toBeVisible();
    await close(page, form, method, 'Về danh sách KPH');
    await expect(create).toBeFocused();
   }
   await create.click();
   const form = page.locator('.store-create-screen');
   const nestedScanOpener = form.getByRole('button', { name: 'Quét mã barcode' });
   await nestedScanOpener.click();
   await expect(scanner).toBeVisible();
   await expect(scanner.getByRole('button', { name: 'Đóng quét mã', exact: true })).toBeFocused();
   await page.keyboard.press('Escape'); await expect(scanner).toBeHidden();
   await expect(form).toBeVisible(); await expect(nestedScanOpener).toBeFocused();
   await form.locator('input[type=file][multiple]').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: png });
   const imageOpener = form.getByRole('button', { name: 'Xem ảnh minh chứng 1', exact: true });
   await imageOpener.click();
   const viewer = page.getByRole('dialog', { name: 'Xem ảnh minh chứng', exact: true });
   await expect(viewer).toBeVisible();
   await page.keyboard.press('Escape'); await expect(viewer).toBeHidden();
   await expect(form).toBeVisible(); await expect(imageOpener).toBeFocused();
   await form.getByRole('button', { name: 'Về danh sách KPH' }).click();
   await expect(form).toBeHidden(); await expect(create).toBeFocused();
   if (viewport.width === 390) {
    await expandedHit(page, page.getByRole('button', { name: /^TP khô & khác/ }), -20);
    await expect(page.getByRole('button', { name: /^TP khô & khác/ })).toHaveAttribute('aria-pressed', 'true');
   }
   await capture(page, `kph-${viewport.width}`);
   const geometry = await page.evaluate(() => {
    const height = s => document.querySelector(s)?.getBoundingClientRect().height;
    const chevron = document.querySelector('.store-ticket-chevron');
    const rect = chevron?.getBoundingClientRect();
    const card = chevron?.parentElement.getBoundingClientRect();
    return { header: height('.store-header'), tabs: height('.store-tabs'), tab: height('.store-tabs button'), createText: document.querySelector('.store-create-actions button').innerText, chevron: rect ? [rect.width, rect.height, card.right - rect.right] : null, overflow: document.documentElement.scrollWidth > innerWidth };
   });
   expect(geometry.header).toBe(viewport.width < 900 ? 72 : 56);
   expect(geometry.tabs).toBe(40); expect(geometry.tab).toBe(32);
   expect(geometry.createText).toContain('Tạo ·'); expect(geometry.overflow).toBe(false);
   if (viewport.width < 900) expect(geometry.chevron).toEqual([20, 20, 12]);
   await route(page, 'date');
   if (viewport.width === 390) {
    await expandedHit(page, page.getByRole('button', { name: 'Mở 2', exact: true }), -21);
    await expect(page.getByRole('button', { name: 'Mở 2', exact: true })).toHaveAttribute('aria-pressed', 'true');
   }
   const dateGeometry = await page.evaluate(() => ({ tabs: document.querySelector('.store-tabs').getBoundingClientRect().height, status: document.querySelector('.store-date-statuses button').getBoundingClientRect().height }));
   expect(dateGeometry).toEqual({ tabs: 40, status: 40 });
   if (viewport.width >= 900) {
    const filter = await page.getByRole('button', { name: 'Lọc DATE' }).boundingBox();
    const add = await page.getByRole('button', { name: 'Thêm theo dõi' }).boundingBox();
    expect(Math.abs(filter.y + filter.height / 2 - add.y - add.height / 2)).toBeLessThan(1);
    expect(add.x).toBeGreaterThan(filter.x + filter.width);
   }
   expect(runtimeErrors).toEqual([]);
   results.push({ viewport, geometry, dateGeometry, lookupIcons, result: 'PASS: sheets, nested dialogs, route, quick draft, query/result, geometry and hit areas' });
   console.log(`PASS ${viewport.width}x${viewport.height}`);
   await page.close();
  }
 } finally { await browser.close(); fs.writeFileSync(`${out}/results.json`, JSON.stringify(results, null, 2)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
