// Single-screen transactions, form reflow and unchanged report outputs.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4362';
const output = process.env.STORE_ACTIONS_OUTPUT || '.local/fresh01/actions';
fs.mkdirSync(output, {recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
const viewports = [{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:900,height:650},{width:844,height:390}];
const reportSettings='.store-report-settings, .store-settings-group';
const selectors = {
  home: ['.store-header','.store-page-hero','.store-home-features','.store-module'],
  kph: ['.store-header','.store-kph-underlay','.store-kph-toolbar','.store-create-cta','.store-kph-list-controls','[data-record-id]'],
  date: ['.store-header','.store-date-search-form','.store-date-list-controls','.store-date-lot'],
  reports: ['.store-header','.report-composer-controls',reportSettings,'.report-selection-bar'],
  shelf: ['.store-header','.store-shelf-form','.store-shelf-result'],
  notifications: ['.store-header','.store-notification-section > summary','.store-notification-item'],
  login: ['.store-header','.store-login-form'],
};
async function settle(p) {
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))); });
}
async function route(p, url, screen) {
  await p.goto(`${url}/#${screen}`);
  if (screen === 'kph') await expect(p.locator('[data-record-id]').first()).toBeVisible();
  else if (screen === 'reports') { await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click(); await expect(p.locator(reportSettings)).toBeVisible(); }
  else await expect(p.locator(selectors[screen][0])).toBeVisible();
  await settle(p);
}
async function bounds(p) {
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow').toBe(true);
  for (const dialog of await p.locator('[role="dialog"]:visible').all()) {
    const b=await dialog.boundingBox(); expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.y).toBeGreaterThanOrEqual(-1);
    expect(b.x+b.width).toBeLessThanOrEqual(p.viewportSize().width+1);expect(b.y+b.height).toBeLessThanOrEqual(p.viewportSize().height+1);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  }
}
async function touch(locator) { const b=await locator.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44); }
async function formTextReflow(p, form, width) {
  for(const factor of [1.5,2]){
    await form.evaluate((root,factor)=>{
      const nodes=[...root.querySelectorAll('h3,label,legend,input:not(.sr-only),textarea,.choice-card span,button')].filter(n=>n instanceof HTMLElement&&n.getBoundingClientRect().width>1);
      const values=nodes.map(n=>({n,font:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}));
      for(const {n,font,line}of values){if(!n.dataset.reflowStyle)n.dataset.reflowStyle=JSON.stringify([n.style.fontSize,n.style.lineHeight]);n.style.fontSize=`${font*factor}px`;if(Number.isFinite(line))n.style.lineHeight=`${line*factor}px`;}
    },factor);
    await bounds(p);
    const clipped=await form.evaluate(root=>[...root.querySelectorAll('h3,legend,.choice-card,button')].filter(n=>{const b=n.getBoundingClientRect();return b.width>1&&b.height>1&&n.scrollWidth>n.clientWidth+1}).map(n=>n.textContent));
    expect(clipped,`Compact form text${factor*100} horizontal reflow`).toEqual([]);
    await p.screenshot({path:`${output}/form-text${factor*100}-${width}.png`});
    await form.evaluate(root=>{for(const n of root.querySelectorAll('[data-reflow-style]')){const [font,line]=JSON.parse(n.dataset.reflowStyle);n.style.fontSize=font;n.style.lineHeight=line;delete n.dataset.reflowStyle;}});
  }
}

(async()=>{const browser=await chromium.launch();try{
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=','base64');
    for(const viewport of viewports.slice(0,2)){
      const p=await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block',reducedMotion:'reduce'});
      await p.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
      await route(p,base,'date');
      for(const [id,kind]of[['A24-255','tpcn'],['C24-118','tpts']]){
        await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill(id);
        const lot=p.locator(`[data-date-lot-id="${id}"]`);await lot.click();
        const detail=p.getByRole('dialog',{name:'Chi tiết lô DATE'});
        await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
        await detail.getByRole('radio',{name:kind==='tpcn'?/1 ngày/:/1 tuần/}).check();
        await detail.getByRole('button',{name:'Hẹn báo lại',exact:true}).click();
        await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','acknowledged');
        await lot.click();
        await detail.getByRole('button',{name:'Xử lý',exact:true}).click();
        const form=p.locator('.store-create-screen');await expect(form.locator('#product-name')).toBeAttached();
        await expect(form).toHaveAttribute('data-kind',kind);await bounds(p);
        if(kind==='tpcn')await formTextReflow(p,form,viewport.width);
        const quantity=form.getByRole('textbox',{name:'Số lượng',exact:true});await quantity.fill('0');
        await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(quantity).toHaveAccessibleDescription('Số lượng phải lớn hơn 0');await expect(quantity).toBeFocused();
        await quantity.fill('1');await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form.locator('#kph-photo-feedback')).toBeFocused();
        await form.getByLabel('Chọn ảnh',{exact:true}).setInputFiles({name:'density-synthetic.png',mimeType:'image/png',buffer:png});
        await expect(form.getByRole('button',{name:'Xem ảnh minh chứng 1',exact:true})).toBeVisible();
        await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form.locator('.store-form-review')).toContainText(id);
        await audit(p,'.store-create-screen',`${kind}-solid-${viewport.width}`);
        await p.screenshot({path:`${output}/${kind}-review-${viewport.width}.png`});await form.getByRole('button',{name:'Gửi phiếu',exact:true}).click();
        await expect(form).toHaveCount(0);await expect(lot).toHaveCount(0);
      }
      await p.evaluate(()=>{location.hash='kph'});await expect(p.locator('[data-record-id]').first()).toBeVisible();
      const created=p.locator('[data-record-id]').filter({visible:true}).first();await expect(created).toContainText('Chờ duyệt');
      await created.locator('.store-ticket-open,.store-kph-row-open').click();await expect(p.getByRole('dialog',{name:'Chi tiết phiếu KPH'})).toContainText('C24-118');await p.keyboard.press('Escape');
      await route(p,base,'reports');
      await p.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();await p.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();await expect(p.locator('.date-report-document-meta')).toBeVisible();
      const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Xuất Excel',exact:true}).click();const download=await downloadPromise;
      const xlsx=`${output}/report-${viewport.width}.xlsx`;await download.saveAs(xlsx);
      const ExcelJS=require('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(xlsx);const sheet=book.getWorksheet('DATE');expect(sheet.rowCount).toBe(16);expect(sheet.getRow(10).getCell(1).type).toBe(3);
      await p.emulateMedia({media:'print'});await expect(p.locator('.date-report')).toHaveAttribute('data-printing','true');await expect(p.locator('.date-report-table tbody tr')).toHaveCount(7);
      await p.pdf({path:`${output}/report-${viewport.width}.pdf`,format:'A4',landscape:true,printBackground:true});
      await p.emulateMedia({media:'screen'});await p.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();await expect(p.getByRole('region',{name:'Báo cáo đã tạo',exact:true}).getByRole('button').first()).toBeVisible();
      await p.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));await route(p,base,'shelf');
      const form=p.locator('.store-shelf-form'),result=p.locator('.store-shelf-result');
      await form.getByRole('textbox',{name:'Ngày sản xuất',exact:true}).fill('01/10/2026');await form.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true}).fill('10/10/2026');
      await expect(result.locator('.store-result-primary')).toHaveText('Ngày lùi hàng08/10/2026');await bounds(p);await p.close();
      console.log(`PASS Store actions ${viewport.width}: reminder1/7, TPCN/TPTS validation/photo/review/save, KPH, report Excel/PDF/history and shelf-life`);
    }
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1});
