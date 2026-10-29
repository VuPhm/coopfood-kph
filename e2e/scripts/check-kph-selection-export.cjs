// Targeted regression: aligned quantity/unit, partial selection and real workbook output.
const { chromium, expect } = require('@playwright/test');
const ExcelJS = require('exceljs');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4392';
const output = process.env.STORE_KPH_OUTPUT || '/tmp/kph03-selection-export';
fs.mkdirSync(output, { recursive: true });
async function enlarge(root) {
  await root.evaluate(root => {
    const sizes = [root, ...root.querySelectorAll('*')].map(el => ({el, font: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight)}));
    for (const {el, font, line} of sizes) { el.style.fontSize = font * 2 + 'px'; if (Number.isFinite(line)) el.style.lineHeight = line * 2 + 'px'; }
  });
}
async function noOverflow(root) { expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true); }
async function unitGeometry(panel) {
  const a = await panel.locator('#quantity').boundingBox(), b = await panel.locator('.unit-options').boundingBox();
  expect(Math.abs(a.y - b.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(1);
  for (const label of await panel.locator('.unit-options label').all()) {
    const r = await label.boundingBox(); expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
  }
  return {topDelta: a.y - b.y, heightDelta: a.height - b.height};
}
(async () => {
  const browser = await chromium.launch(), results = [];
  try {
    for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:740},{width:844,height:390}]) {
      const page = await browser.newPage({viewport, reducedMotion:'reduce', serviceWorkers:'block'});
      page.setDefaultTimeout(10000); const errors=[]; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/#kph'); await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      await expect(page.locator('.create-tpcn')).toContainText('Tạo Khô & Khác');
      expect(await page.locator('.store-kph').innerText()).not.toMatch(/TPCN|TPTS/);
      const geometries=[];
      for (const kind of ['tpcn','tpts']) {
        await page.locator('.create-' + kind).click(); const panel=page.locator('.store-create-screen');
        await expect(panel.locator('#quantity')).toBeAttached();
        geometries.push(await unitGeometry(panel));
        await panel.locator('#quantity').scrollIntoViewIfNeeded();
        await panel.locator('.unit-options label').filter({hasText:/^kg$/}).click();
        await expect(panel.getByRole('radio', {name:'kg', exact:true})).toBeChecked();
        await panel.locator('#quantity').fill(''); await panel.getByRole('button', {name:'Xem lại',exact:true}).click();
        await expect(panel.locator('#quantity')).toHaveAttribute('aria-invalid','true');
        geometries.push(await unitGeometry(panel));
        await panel.locator('#quantity').scrollIntoViewIfNeeded(); await page.screenshot({path:`${output}/unit-error-${kind}-${viewport.width}.png`});
        await enlarge(panel); await noOverflow(panel); await noOverflow(panel.locator('.kph-create-quantity'));
        await panel.getByRole('button',{name:'Đóng',exact:true}).click(); await expect(panel).toHaveCount(0);
      }
      await page.getByRole('button',{name:'Chọn',exact:true}).click(); const batch=page.locator('.store-batch');
      await expect(batch.getByRole('button',{name:'Xuất Excel',exact:true})).toBeDisabled();
      const rows=page.locator(viewport.width>=900 ? '.store-kph-table tbody tr[data-record-id]' : '.store-ticket');
      const fixture=rows.filter({hasText:'Cải thìa VietGAP 500 g'}); const pending=rows.filter({hasText:'Chờ duyệt'}).first();
      await pending.getByRole('checkbox').check(); await expect(batch.getByRole('checkbox')).toBeChecked({indeterminate:true});
      if(viewport.width>=900) await expect(page.locator('.store-kph-table thead input')).toBeChecked({indeterminate:true});
      await batch.getByRole('button',{name:'Xuất Excel',exact:true}).click(); let dialog=page.getByRole('dialog',{name:'Xuất Excel',exact:true});
      await expect(dialog).toContainText('1 phiếu chưa được duyệt'); await expect(dialog.getByRole('button',{name:'Tải xuống',exact:true})).toBeDisabled();
      await dialog.getByRole('button',{name:'Quay lại',exact:true}).click(); await pending.getByRole('checkbox').uncheck();
      await fixture.getByRole('checkbox').check(); await batch.scrollIntoViewIfNeeded(); await page.screenshot({path:`${output}/selection-${viewport.width}.png`});
      await batch.getByRole('button',{name:'Xuất Excel',exact:true}).click(); dialog=page.getByRole('dialog',{name:'Xuất Excel',exact:true});
      await expect(dialog).toContainText('1 phiếu đã duyệt'); await noOverflow(dialog); await page.screenshot({path:`${output}/export-${viewport.width}.png`});
      const [download]=await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Tải xuống',exact:true}).click()]);
      expect(download.suggestedFilename()).toBe('KPH-MAU-Tuoi-Song.xlsx');
      const workbook=new ExcelJS.Workbook(); await workbook.xlsx.readFile(await download.path());
      const sheet=workbook.getWorksheet('Thực phẩm tươi sống'), exported=[];
      expect(sheet).toBeTruthy(); sheet.eachRow((row,num)=>{if(num>=9&&row.getCell(4).value)exported.push({sku:row.getCell(3).value,name:row.getCell(4).value})});
      expect(exported).toEqual([{sku:'0011730',name:'Cải thìa VietGAP 500 g'}]); await expect(dialog).toHaveCount(0);
      // Confirm all only applies to the loaded 25, and appending preserves the 25.
      await batch.getByRole('checkbox').check(); await expect(batch).toContainText('25 đã chọn');
      await page.getByRole('button',{name:/Hiển thị thêm/}).click(); await expect(batch).toContainText('25 đã chọn');
      await expect(batch.getByRole('checkbox')).toBeChecked({indeterminate:true});
      await batch.getByRole('button',{name:'Xuất Excel',exact:true}).click(); dialog=page.getByRole('dialog',{name:'Xuất Excel',exact:true});
      await enlarge(dialog); await noOverflow(dialog); await noOverflow(dialog.locator('.store-kph-export-content'));
      expect(await dialog.locator('.store-summary').evaluate(el=>el.scrollHeight<=el.clientHeight+1)).toBe(true);
      const summary=await dialog.locator('.store-summary').boundingBox(), note=await dialog.locator('.store-kph-export-note').boundingBox();
      expect(summary.y+summary.height).toBeLessThanOrEqual(note.y);
      const actions=await dialog.locator('.store-sheet-actions').boundingBox();
      expect(actions.y+actions.height).toBeLessThanOrEqual(viewport.height+1);
      const close=dialog.getByRole('button',{name:'Đóng',exact:true});
      expect(await close.evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})).toBe(true);
      await page.screenshot({path:`${output}/export-text200-${viewport.width}.png`});
      await close.click(); await enlarge(batch); await noOverflow(batch);
      await batch.scrollIntoViewIfNeeded(); await page.screenshot({path:`${output}/selection-text200-${viewport.width}.png`});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true); expect(errors).toEqual([]);
      results.push({viewport,geometries,mixedSelection:true,approvedOnlyWorkbook:exported,appendPreservesSelection:true,text200:true});
      console.log(`PASS KPH ${viewport.width}: unit/error alignment, partial/all/append, pending guard, actual workbook, text200/footer/close`);
      await page.close();
    }
  } finally {fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
