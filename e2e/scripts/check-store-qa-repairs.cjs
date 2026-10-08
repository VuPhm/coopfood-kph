// Bounded regression gate for the 2026-10-08 Store App mock QA findings.
const { chromium, expect } = require('@playwright/test');
const ExcelJS = require('exceljs');
const fs = require('node:fs');
const out = '.local/figma-mobile/r5';
fs.mkdirSync(out, { recursive: true });
const base = process.env.STORE_APP_URL || 'http://127.0.0.1:5175';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jV7kAAAAASUVORK5CYII=', 'base64');
const results = [];

async function capture(page, name) {
 await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
 });
 await page.screenshot({ path: `${out}/${name}.png` });
}

async function route(page, screen) {
 await page.evaluate(screen => { window.location.hash = screen; }, screen);
 await page.locator(`.store-screen-${screen}`).waitFor();
}

async function downloadRows(page) {
 const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name:'Tải xuống', exact:true }).click()]);
 const workbook = new ExcelJS.Workbook();
 await workbook.xlsx.readFile(await download.path());
 const sheet = workbook.getWorksheet('Thực phẩm tươi sống');
 if (!sheet) throw new Error('Missing TPTS worksheet');
 const rows = [];
 sheet.eachRow((row, number) => { if (number >= 9 && row.getCell(4).value) rows.push({ sku:row.getCell(3).value, name:row.getCell(4).value }); });
 await page.getByRole('dialog', { name:'Xuất Excel', exact:true }).waitFor({ state:'hidden' });
 return rows;
}

async function clickExpandedArea(page, control, dx, dy) {
 const rect = await control.boundingBox();
 if (!rect) throw new Error('Control has no visible bounds');
 const point = { x:rect.x + rect.width / 2 + dx, y:rect.y + rect.height / 2 + dy };
 const hitsControl = await control.evaluate((element, point) => element.contains(document.elementFromPoint(point.x, point.y)), point);
 if (!hitsControl) throw new Error(`Expanded hit area misses ${await control.getAttribute('aria-label') || await control.innerText()}`);
 await page.mouse.click(point.x, point.y);
}

(async () => {
 const browser = await chromium.launch({ headless:true });
 try {
  for (const viewport of [{width:390,height:844}, {width:1440,height:1024}]) {
   const page = await browser.newPage({ viewport });
   page.setDefaultTimeout(8000);
   const runtimeErrors = [];
   page.on('pageerror', error => runtimeErrors.push(error.message));
   page.on('console', message => { if (/Encountered two children with the same key/.test(message.text())) runtimeErrors.push(message.text()); });
   await page.goto(base);
   await page.locator('.store-screen-home').waitFor();

   // One fixture selection must mean exactly one selected and exported ticket.
   await route(page, 'kph');
   await page.getByRole('button', {name:'Chọn',exact:true}).click();
   const collection = page.locator(viewport.width < 900 ? '.store-tickets' : '.store-kph-table');
   await collection.getByRole('checkbox', {name:'Chọn Cải thìa VietGAP 500 g',exact:true}).check();
   await expect(collection.getByRole('checkbox', {name:'Chọn Nông sản mẫu 01',exact:true})).not.toBeChecked();
   await expect(collection.locator('input:checked')).toHaveCount(1);
   await expect(page.locator('.store-batch')).toContainText('1 đã chọn');
   await capture(page, `selection-${viewport.width}`);
   await page.getByRole('button', {name:'Xuất Excel',exact:true}).click();
   await expect(page.getByRole('dialog', {name:'Xuất Excel',exact:true})).toContainText('1 phiếu đã duyệt');
   expect(await downloadRows(page)).toEqual([{sku:'0011730',name:'Cải thìa VietGAP 500 g'}]);
   await page.getByRole('button', {name:'Xong',exact:true}).click();
   const openFixture = collection.getByRole('button', {name:viewport.width < 900 ? /Cải thìa VietGAP/ : 'Mở phiếu Cải thìa VietGAP 500 g'});
   await openFixture.click();
   await page.getByRole('button', {name:'Không duyệt',exact:true}).click();
   await expect(page.getByRole('dialog', {name:'Chi tiết phiếu KPH'})).toContainText('Không duyệt');
   await page.getByRole('button', {name:'Đóng',exact:true}).click();
   const other = page.locator(viewport.width < 900 ? '.store-ticket' : '.store-kph-table tbody tr').filter({hasText:'Nông sản mẫu 01'});
   await expect(other).toHaveCount(1);
   await expect(other).toContainText('Đã duyệt');

   // Found product SKU, scanned UPC and export SKU remain distinct strings.
   await page.locator('.store-create-actions .create-tpts').click();
   await page.getByRole('textbox', {name:'Mã SKU / UPC',exact:true}).fill('29123415005');
   await page.getByRole('textbox', {name:'Tên hàng hóa',exact:true}).focus();
   await page.getByText('Đã tìm thấy 0011730.', {exact:true}).waitFor();
   await page.locator('input[type=file][multiple]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
   await page.getByRole('button', {name:'Xem ảnh minh chứng 1',exact:true}).waitFor();
   await page.getByRole('button', {name:'Xem lại',exact:true}).click();
   await page.getByRole('button', {name:'Gửi phiếu',exact:true}).click();
   const currentTicket = page.locator(viewport.width < 900 ? '.store-ticket' : '.store-kph-table tbody tr').filter({hasText:'Chờ duyệt'}).filter({hasText:'Cải thìa VietGAP 500 g'});
   await expect(currentTicket).toHaveCount(1);
   await expect(currentTicket).toContainText('0011730');
   // Search is part of the desktop composition; resizing must retain the session record.
   if (viewport.width < 900) await page.setViewportSize({width:1440,height:1024});
   const search = page.getByRole('textbox', {name:'Tìm tên hàng hoặc SKU'});
   for (const identifier of ['0011730','29123415005']) {
    await search.fill(identifier);
    await expect(currentTicket).toHaveCount(1);
   }
   if (viewport.width < 900) await page.setViewportSize(viewport);
   await currentTicket.getByRole('button').click();
   const detail = page.getByRole('dialog', {name:'Chi tiết phiếu KPH'});
   await expect(detail.locator('.store-summary > div').filter({has:page.locator('dt', {hasText:/^SKU$/})})).toContainText('0011730');
   await expect(detail.locator('.store-summary > div').filter({has:page.locator('dt', {hasText:/^UPC$/})})).toContainText('29123415005');
   await page.getByRole('button', {name:'Duyệt phiếu',exact:true}).click();
   await page.getByRole('button', {name:'Đóng',exact:true}).click();
   await capture(page, `found-sku-${viewport.width}`);
   await page.getByRole('button', {name:'Chọn',exact:true}).click();
   await collection.getByRole('checkbox', {name:'Chọn Cải thìa VietGAP 500 g',exact:true}).check();
   await page.getByRole('button', {name:'Xuất Excel',exact:true}).click();
   expect(await downloadRows(page)).toEqual([{sku:'0011730',name:'Cải thìa VietGAP 500 g'}]);
   await page.getByRole('button', {name:'Xong',exact:true}).click();

   // DATE state survives route changes; guards stay consistent by viewport.
   await route(page, 'date');
   await page.getByRole('button', {name:/^Theo dõi DATE/}).click();
   await page.getByRole('button').filter({hasText:'Sản phẩm C'}).click();
   const actions = viewport.width < 900 ? page.getByRole('dialog', {name:'Xử lý cảnh báo DATE'}) : page.locator('.store-date-detail');
   await actions.getByRole('button', {name:'Đã xử lý',exact:true}).click();
   if (viewport.width < 900) {
    await actions.waitFor({state:'hidden'});
    await page.getByRole('button').filter({hasText:'Sản phẩm C'}).click();
   }
   await expect(actions.getByRole('button', {name:'Ghi nhận',exact:true})).toBeDisabled();
   await expect(actions.getByRole('button', {name:'Đã xử lý',exact:true})).toBeDisabled();
   await capture(page, `date-resolved-${viewport.width}`);
   if (viewport.width < 900) await actions.getByRole('button', {name:'Đóng',exact:true}).click();
   await route(page, 'home');
   await expect(page.locator('.store-home-panels')).toContainText('1 cảnh báo đang mở');
   await route(page, 'date');
   await expect(page.getByRole('button').filter({hasText:'Sản phẩm C'})).toHaveCount(0);
   await page.getByRole('button', {name:'Đã xử lý',exact:true}).click();
   await page.getByRole('button').filter({hasText:'Sản phẩm C'}).click();
   await expect(actions).toContainText('Đã xử lý');
   await expect(actions.getByRole('button', {name:'Ghi nhận',exact:true})).toBeDisabled();
   if (viewport.width < 900) await actions.getByRole('button', {name:'Đóng',exact:true}).click();
   await page.getByRole('button', {name:/^Đã ghi nhận/}).click();
   await page.getByRole('button').filter({hasText:'Sản phẩm A'}).click();
   await expect(actions.getByRole('button', {name:'Ghi nhận',exact:true})).toBeDisabled();
   await expect(actions.getByRole('button', {name:'Đã xử lý',exact:true})).toBeEnabled();
   if (viewport.width < 900) await actions.getByRole('button', {name:'Đóng',exact:true}).click();

   // Route dismissal and unique IDs for dedicated and quick shelf inputs.
   await page.getByRole('button', {name:'Mở tiện ích tra cứu lùi hàng'}).click();
   await expect(page.locator('#quick-shelf-nsx')).toHaveCount(1);
   await capture(page, `quick-${viewport.width}`);
   await route(page, 'home');
   await expect(page.getByRole('dialog', {name:'Tra cứu lùi hàng nhanh'})).toHaveCount(0);
   await route(page, 'kph');
   await page.getByRole('button', {name:'Mở tiện ích tra cứu lùi hàng'}).click();
   await route(page, 'shelf');
   await expect(page.locator('#shelf-nsx')).toHaveCount(1);
   await expect(page.locator('#quick-shelf-nsx')).toHaveCount(0);
   const duplicates = await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map(e=>e.id);
    return ids.filter((id,index)=>ids.indexOf(id)!==index);
   });
   expect(duplicates).toEqual([]);
   if (viewport.width < 900) {
    await clickExpandedArea(page, page.getByRole('switch'), 0, -20);
    await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
    await clickExpandedArea(page, page.getByRole('switch'), 0, -20);
    await clickExpandedArea(page, page.getByRole('button', {name:'Chọn ngày sản xuất'}), 21, 0);
    await page.getByRole('dialog', {name:'Lịch chọn ngày'}).waitFor();
    await page.keyboard.press('Escape');
    await route(page, 'kph');
    await clickExpandedArea(page, page.getByRole('button', {name:'Chọn',exact:true}), 0, -21);
    await page.getByRole('button', {name:'Xong',exact:true}).waitFor();
    await clickExpandedArea(page, page.getByRole('button', {name:'Lọc phiếu KPH'}), 21, 0);
    await page.getByRole('dialog', {name:'Lọc & sắp xếp'}).waitFor();
    await page.getByRole('button', {name:'Đóng',exact:true}).click();
    await route(page, 'date');
    await clickExpandedArea(page, page.getByRole('button', {name:'Lọc DATE'}), 21, 0);
    await page.getByRole('dialog', {name:'Lọc DATE'}).waitFor();
    await page.getByRole('button', {name:'Đóng',exact:true}).click();
   }

   // Lookup fixture metadata changes with product identity.
   await route(page, 'lookup');
   const lookupButton = page.locator('.store-lookup-search').getByRole('button', {name:'Tra cứu',exact:true});
   const buttonPresentation = await lookupButton.evaluate(button => {
    const style = getComputedStyle(button);
    return {color:style.color, background:style.backgroundColor, clipped:button.scrollWidth > button.clientWidth};
   });
   expect(buttonPresentation.color).not.toEqual(buttonPresentation.background);
   expect(buttonPresentation.clipped).toBe(false);
   const input = page.getByRole('textbox', {name:'Mã hàng, tên hàng hoặc lô'});
   await input.fill('0011730');
   await page.locator('.store-lookup-search').getByRole('button', {name:'Tra cứu',exact:true}).click();
   await expect(page.locator('.store-lookup-product')).toContainText('Thực phẩm tươi sống');
   await expect(page.locator('.store-lookup-product dl')).toContainText('kg');
   await expect(page.locator('.store-lookup-product')).not.toContainText('Thực phẩm khô');
   await capture(page, `lookup-fresh-${viewport.width}`);
   await input.fill('0008421');
   await page.locator('.store-lookup-search').getByRole('button', {name:'Tra cứu',exact:true}).click();
   await expect(page.locator('.store-lookup-product')).toContainText('Thực phẩm khô');
   await expect(page.locator('.store-lookup-product dl')).toContainText('EA');
   expect(runtimeErrors).toEqual([]);
   results.push({viewport,selectedExportRows:1,sku:'0011730',barcode:'29123415005',dateStateRetained:true,routeDismissal:true,duplicateIds:duplicates,runtimeErrors,touchHitAreas:viewport.width<900?'pass':'mobile-only'});
   await page.close();
   console.log(`PASS ${viewport.width}x${viewport.height}: isolated selection/review/export, catalog SKU/UPC, DATE session/guards, quick route/IDs, lookup metadata, mobile expanded hit areas`);
  }
  fs.writeFileSync(`${out}/qa-repairs.json`, JSON.stringify(results,null,2));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode=1; });
