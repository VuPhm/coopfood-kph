// Local production-preview gate. Uses only synthetic data in a fresh browser context.
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const fs = require('node:fs');
const base = process.env.PILOT_PREVIEW_URL || 'http://127.0.0.1:4381/coopfood-kph/';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname)) throw new Error('Only a local preview may receive synthetic records.');
const output = process.env.PILOT_DATE_OUTPUT || '.local/pilot-date-browser';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({headless:true});
  for (const viewport of [{width:390,height:844},{width:1440,height:1024}]) {
    const context = await browser.newContext({viewport, timezoneId:'America/Los_Angeles', locale:'vi-VN', serviceWorkers:'block'});
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin ? route.continue() : route.abort());
    await page.clock.install({time:new Date('2026-10-27T17:30:00Z')});
    await page.goto(base);
    async function unlock() {
      await page.getByLabel('Mã truy cập',{exact:true}).fill('0000');
      await expect(page.getByRole('button',{name:'Mở lọc và sắp xếp',exact:true})).toBeVisible();
    }
    await unlock();
    await page.evaluate(async()=> {
      const db=await new Promise((resolve,reject)=> {const r=indexedDB.open('coopfood-kph-pilot');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
      const tx=db.transaction('records','readwrite');
      const store=tx.objectStore('records');
      const dates=['27/10/2026','26/10/2026','25/10/2026','01/11/2026','02/11/2026'];
      for (let i=0;i<59;i++) store.put({
        id:'date-test-'+i,kind:i===57?'TPTS':'TPCN',detectedDate:i<52||i>56?'28/10/2026':dates[i-52],detectedBy:'Kiểm thử',sku:String(i).padStart(7,'0'),productName:'Hàng kiểm thử '+i,supplier:'NCC tổng hợp',quantity:'1 EA',quantityValue:1,unit:'EA',condition:'Cận date',resolution:'HỦY',treatmentDate:'',approvalStatus:i===1?'APPROVED':'PENDING',photos:[],note:'Dữ liệu tổng hợp',trashState:i===58?'trash':'active',createdAt:'2026-10-28T00:00:00Z',updatedAt:'2026-10-28T00:00:00Z',deletedAt:i===58?'2026-10-28T00:00:00Z':null,lastExportedAt:null
      });
      await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
    });
    await page.reload();await unlock();
    const count=page.locator('.history-total-count');
    await expect(count).toHaveText('57');
    await page.getByRole('button',{name:'Hiển thị thêm 7 phiếu',exact:true}).click();
    const open=()=>page.getByRole('button',{name:'Mở lọc và sắp xếp',exact:true}).click();
    const dialog=page.getByRole('dialog',{name:'Lọc & sắp xếp',exact:true});
    const close=()=>dialog.getByRole('button',{name:'Đóng',exact:true}).click();
    await open();
    await dialog.getByRole('button',{name:'Hôm nay',exact:true}).click();
    await expect(dialog.getByLabel('Từ ngày',{exact:true})).toHaveValue('28/10/2026');
    await expect(count).toHaveText('52');
    await page.screenshot({path:`${output}/${viewport.width}-filter.png`});
    const inputFits=await dialog.locator('input').evaluateAll(inputs=>inputs.every(i=>i.scrollWidth<=i.clientWidth+1));
    expect(inputFits).toBe(true);
    await close();
    await expect(page.getByRole('button',{name:'Hiển thị thêm 2 phiếu',exact:true})).toBeVisible();
    await page.getByRole('checkbox',{name:viewport.width<768?'Chọn tất cả phiếu':'Chọn tất cả',exact:true}).check();
    await expect(page.getByRole('button',{name:'Duyệt 52 phiếu',exact:true})).toBeVisible();
    await open();
    await dialog.getByRole('button',{name:'Hôm qua',exact:true}).click();
    await expect(count).toHaveText('1');
    await expect(page.locator('.selection-count')).toHaveText('Đã chọn 0');
    await dialog.getByRole('button',{name:'Tuần này',exact:true}).click();
    await expect(count).toHaveText('55');
    await expect(dialog.getByLabel('Từ ngày',{exact:true})).toHaveValue('26/10/2026');
    await expect(dialog.getByLabel('Đến ngày',{exact:true})).toHaveValue('01/11/2026');
    await dialog.getByRole('button',{name:'Lọc Đã duyệt',exact:true}).click();
    await expect(count).toHaveText('1');
    await dialog.getByRole('button',{name:'Bỏ lọc trạng thái duyệt',exact:true}).click();
    await dialog.getByLabel('Đến ngày',{exact:true}).fill('25/10/2026');
    await expect(dialog.getByRole('alert')).toContainText('Đến ngày phải bằng hoặc sau Từ ngày');
    await expect(count).toHaveText('55');
    await dialog.getByLabel('Đến ngày',{exact:true}).fill('31/02/2026');
    await expect(dialog.getByRole('alert')).toContainText('Nhập ngày hợp lệ');
    await dialog.getByRole('button',{name:'Bỏ lọc ngày',exact:true}).click();
    await expect(count).toHaveText('57');
    await dialog.getByRole('button',{name:'Chọn từ ngày',exact:true}).click();
    const calendar=page.getByRole('dialog',{name:'Lịch chọn ngày',exact:true});
    await expect(calendar).toBeVisible();
    await calendar.getByRole('button',{name:'28 tháng 10, 2026',exact:true}).click();
    await expect(dialog.getByLabel('Từ ngày',{exact:true})).toHaveValue('28/10/2026');
    await expect(count).toHaveText('54');
    await dialog.getByRole('button',{name:'Hôm nay',exact:true}).click();
    await close();
    await page.getByRole('tab',{name:/TP Tươi sống/}).click();
    await expect(count).toHaveText('1');
    await page.getByRole('button',{name:/Mở thùng rác/}).click();
    await page.getByRole('tab',{name:/TP Khô & khác/}).click();
    await open();await dialog.getByRole('button',{name:'Hôm nay',exact:true}).click();await close();
    await expect(count).toHaveText('1');
    expect(await page.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await open();
    await page.evaluate(()=>document.documentElement.style.fontSize='24px');
    await dialog.getByRole('button',{name:'Bỏ sắp xếp',exact:true}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${output}/${viewport.width}-large-text.png`});
    expect(await dialog.locator('input').evaluateAll(inputs=>inputs.every(input=>{const style=getComputedStyle(input);const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');ctx.font=style.font;return ctx.measureText(input.value).width<=input.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)+1}))).toBe(true);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    expect(errors).toEqual([]);
    console.log(`PASS ${viewport.width}x${viewport.height}: shortcuts, VN timezone, range/calendar, validation, approval, selection, pagination, food type/trash, layout, large text, Escape`);
    await context.close();
  }
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
