// DATE reminders and real KPH creation in the shared Store session. Synthetic photos only.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4277';
const output=process.env.STORE_DATE_OUTPUT||'.local/date02/actions';
process.env.STORE_KPH_COLORS_OUTPUT=output;
const {audit}=require('./check-kph-colors.cjs');
fs.mkdirSync(output,{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=','base64');
const dateDetail=(p,w)=>p.getByRole('dialog',{name:'Chi tiết lô DATE'});
async function route(p,value){await p.evaluate(value=>{location.hash=value},value);}
async function settle(scope){await scope.evaluate(async root=>Promise.all(root.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));}
(async()=>{
 const browser=await chromium.launch();const results=[];
 try {
  for(const viewport of[{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]){
   for(const [days,due] of[[1,'24/10/2026'],[7,'30/10/2026']]){
    const p=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
    await p.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));await p.goto(`${base}/#date`);
    await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('A24-255');
    const lot=p.locator('[data-date-lot-id="A24-255"]');await lot.click();let detail=dateDetail(p,viewport.width);
    await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
    await expect(detail.getByRole('radio',{name:/1 ngày/})).toBeFocused();
    await detail.getByRole('button',{name:'Hủy',exact:true}).click();await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','open');
    await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
    await detail.getByRole('radio',{name:days===1?/1 ngày/:/1 tuần/}).check();
    await audit(p,viewport.width>=900?'.store-date-detail':'.store-date-lot-sheet',`reminder-${days}-${viewport.width}`);
    await p.screenshot({path:`${output}/reminder-${days}-${viewport.width}.png`,fullPage:true});
    await detail.getByRole('button',{name:'Hẹn báo lại',exact:true}).click();await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','acknowledged');
    await expect(lot).toContainText(`Báo lại ${due}`);await route(p,'notifications');await expect(p.getByRole('region',{name:'Danh sách thông báo'})).toBeVisible();await expect(p.locator('[data-notification-lot="A24-255"]')).toHaveCount(0);
    const dueISO=days===1?'2026-10-24':'2026-10-30';
    await p.clock.setFixedTime(new Date(`${dueISO}T00:00:00+07:00`));await p.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await expect(p.getByRole('heading',{name:/Đến lịch báo lại/})).toBeVisible();await p.getByRole('button',{name:new RegExp(`A24-255.*Đến lịch báo lại ${due}`)}).click();
    await expect(p.getByRole('heading',{name:'Chi tiết lô DATE',exact:true})).toBeVisible();await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','open');
    await p.screenshot({path:`${output}/due-${days}-${viewport.width}.png`,fullPage:true});await p.close();
   }
   for(const [id,kind,barcode,unit]of[['A24-255','tpcn','8936000123456','EA'],['C24-118','tpts','29123415005','kg']]){
    const p=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
    await p.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));await p.goto(`${base}/#date`);
    await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill(id);const lot=p.locator(`[data-date-lot-id="${id}"]`);
    await lot.click();await dateDetail(p,viewport.width).getByRole('button',{name:'Xử lý',exact:true}).click();let form=p.locator('.store-create-screen');
    await expect(form.locator('#product-name')).toBeAttached();await expect(form).toHaveAttribute('data-kind',kind);await expect(p.getByRole('dialog')).toHaveCount(1);
    await expect(form.getByRole('textbox',{name:'Mã SKU / UPC',exact:true})).toHaveValue(barcode);await expect(form.getByLabel('Ghi chú',{exact:true})).toHaveValue(new RegExp(id));
    await expect(form.getByRole('radio',{name:'Hết HSD',exact:true})).toBeChecked();await expect(form.locator('#detected-date')).toHaveAttribute('readonly','');
    await form.getByRole('button',{name:'Đóng',exact:true}).click();await expect(form).toHaveCount(0);await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','open');if(viewport.width<900)await expect(lot).toBeFocused();
    await lot.click();await dateDetail(p,viewport.width).getByRole('button',{name:'Xử lý',exact:true}).click();form=p.locator('.store-create-screen');await expect(form.locator('#product-name')).toBeAttached();
    await form.getByLabel('Chọn ảnh',{exact:true}).setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});await expect(form.getByRole('button',{name:'Xem ảnh minh chứng 1',exact:true})).toBeVisible();
    await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form.getByRole('button',{name:'Gửi phiếu',exact:true})).toBeVisible();
    await expect(form.locator('.store-form-review')).toContainText(id);await expect(form.locator('.store-form-review')).toContainText(`1 ${unit}`);
    await p.screenshot({path:`${output}/kph-${kind}-${viewport.width}.png`});await form.getByRole('button',{name:'Gửi phiếu',exact:true}).dblclick();
    await expect(form).toHaveCount(0);await expect(lot).toHaveCount(0);
    await route(p,'notifications');await expect(p.getByRole('region',{name:'Danh sách thông báo'})).toBeVisible();await expect(p.locator(`[data-notification-lot="${id}"]`)).toHaveCount(0);await route(p,'kph');await expect(p.getByRole('textbox',{name:'Tìm tên hàng hoặc SKU'})).toBeEnabled();
    if(kind==='tpcn')await p.locator('.store-tabs').getByRole('button',{name:/TP khô & khác/}).click();
    const record=p.locator('[data-record-id]').first();await expect(record).toContainText(kind==='tpcn'?'Bánh quy bơ':'Cải thìa');await expect(record).toContainText('Chờ duyệt');const recordId=await record.getAttribute('data-record-id');await expect(p.locator(`[data-record-id="${recordId}"]`)).toHaveCount(1);
    await record.locator('.store-ticket-open,.store-kph-row-open').click();await expect(p.getByRole('dialog',{name:'Chi tiết phiếu KPH',exact:true})).toContainText(id);
    expect(errors).toEqual([]);results.push({viewport,kind,reminderDays:[1,7],cancel:true,created:true,resolved:true});await p.close();
   }
   const p=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});await p.goto(`${base}/#date`);await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('D24-090');await p.locator('[data-date-lot-id]').click();await dateDetail(p,viewport.width).getByRole('button',{name:'Xử lý',exact:true}).click();
   const choice=p.getByRole('dialog',{name:'Chọn loại phiếu KPH'});await expect(choice).toBeVisible();await expect(p.locator('.store-create-screen')).toHaveCount(0);await choice.getByRole('button',{name:'Đóng',exact:true}).click();await expect(choice).toBeHidden();if(viewport.width<900)await expect(p.locator('[data-date-lot-id]')).toBeFocused();await p.locator('[data-date-lot-id]').click();await dateDetail(p,viewport.width).getByRole('button',{name:'Xử lý',exact:true}).click();await choice.locator('.create-tpts').click();await expect(p.locator('.store-create-screen #product-name')).toHaveValue('Sản phẩm D');await expect(p.locator('.store-create-screen #barcode')).toHaveValue('');await p.close();
   console.log(`PASS DATE actions ${viewport.width}: reminder1/7days, due alerts/notifications, TPCN/TPTS prefill/cancel/review/save/single record/resolved, unknown kind choice`);
  }
  fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
