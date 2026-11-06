// Production browser gate with synthetic data only, isolated per viewport.
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const fs = require('node:fs');
const base = process.env.PILOT_PREVIEW_URL || 'http://127.0.0.1:4383/';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Local preview only');
const output = '.local/pilot-sku-browser';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
 for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:390,height:400}]) {
  const context=await browser.newContext({viewport,locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'allow'});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  const unlock=async()=>{await page.getByLabel('Mã truy cập',{exact:true}).fill('0000');await expect(page.getByRole('button',{name:'Mở lọc và sắp xếp',exact:true})).toBeVisible();};
  await page.goto(base);await unlock();
  await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('coopfood-kph-pilot');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
   const tx=db.transaction('records','readwrite');
   tx.objectStore('records').put({id:'reuse-source',kind:'TPCN',detectedDate:'01/01/2020',detectedBy:'Người kiểm thử',sku:'8900123',productName:'Hàng tổng hợp',supplier:'NCC tổng hợp',quantity:'7.5 EA',quantityValue:7.5,unit:'EA',condition:'Tình trạng riêng',resolution:'Biện pháp riêng',treatmentDate:'02/01/2020',approvalStatus:'APPROVED',photos:[],note:'Ghi chú tổng hợp',trashState:'active',createdAt:'2020-01-01T00:00:00Z',updatedAt:'2020-01-01T00:00:00Z',deletedAt:null,lastExportedAt:null});
   tx.objectStore('records').put({id:'reuse-second',kind:'TPCN',detectedDate:'01/01/2020',detectedBy:'Kiểm thử',sku:'8900456',productName:'Mẫu thứ hai',supplier:'NCC thứ hai',quantity:'1 EA',quantityValue:1,unit:'EA',condition:'Cận date',resolution:'HỦY',treatmentDate:'',approvalStatus:'PENDING',photos:[],note:'',trashState:'active',createdAt:'2020-01-01T00:00:00Z',updatedAt:'2020-01-01T00:00:00Z',deletedAt:null,lastExportedAt:null});
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  });
  await page.reload();await unlock();
  await page.getByRole('button',{name:'Tạo phiếu TP khô & khác',exact:true}).click();
  let dialog=page.getByRole('dialog',{name:/Tạo phiếu KPH/});
  const input=dialog.getByRole('combobox',{name:'Mã SKU / UPC',exact:true});
  const supplierBefore=await dialog.getByLabel('Nhà cung cấp',{exact:true}).evaluate(el=>el.offsetTop);
  await input.fill('89');
  const suggestion=dialog.getByRole('option');
  await expect(dialog.getByRole('listbox',{name:'Đề xuất SKU'})).toBeVisible();
  await expect(suggestion).toHaveCount(2);
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('');
  await page.screenshot({path:`${output}/${viewport.width}-suggestion-list.png`});
  const supplierAfter=await dialog.getByLabel('Nhà cung cấp',{exact:true}).evaluate(el=>el.offsetTop);
  expect(Math.abs(supplierAfter-supplierBefore)).toBeLessThan(1);
  const list=dialog.getByRole('listbox',{name:'Đề xuất SKU'});
  expect(await list.evaluate(el=>getComputedStyle(el).position)).toBe('absolute');
  expect(await list.evaluate(el=>el.parentElement.getAttribute('role'))).toBe('dialog');
  for(const option of await suggestion.all()) {
    await option.scrollIntoViewIfNeeded();
    expect(await option.evaluate(el=>{const r=el.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&el.contains(hit)})).toBe(true);
  }
  console.log(`LAYER PASS ${viewport.width}x${viewport.height}: query 89, dropdown z80 outside form scrollport; all options pass elementFromPoint`);
  await page.keyboard.press('Escape');await expect(list).toHaveCount(0);await expect(dialog).toBeVisible();
  await dialog.getByLabel('Tên hàng hóa',{exact:true}).focus();await input.focus();
  await expect(list).toBeVisible();
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('Hàng tổng hợp');
  await expect(dialog.getByLabel('Nhà cung cấp',{exact:true})).toHaveValue('NCC tổng hợp');
  await page.screenshot({path:`${output}/${viewport.width}-suggestion.png`});
  await dialog.getByRole('combobox',{name:'Mã SKU / UPC',exact:true}).fill('999');
  await expect(suggestion).toHaveCount(0);await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('');
  await input.fill('hang tong hop');
  await expect(list).toBeVisible();await dialog.getByRole('option',{name:/8900123/}).click();
  await expect(input).toHaveValue('8900123');await expect(list).toHaveCount(0);
  await expect(dialog.getByText(/Điền thông tin SKU đã lưu|Đã điền|Chọn mẫu/)).toHaveCount(0);
  await dialog.getByRole('button',{name:'Hủy',exact:true}).click();
  const duplicate=page.getByRole('button',{name:'Tạo phiếu tương tự reuse-source',exact:true}).filter({visible:true});
  await expect(duplicate).toBeVisible();
  expect(await duplicate.evaluate(el=>{const group=el.closest('.record-approval-actions');return !!group?.querySelector('select')})).toBe(true);
  await page.screenshot({path:`${output}/${viewport.width}-compact-actions.png`});
  if(viewport.width<768) await page.getByRole('button',{name:'Mở rộng phiếu reuse-source',exact:true}).click();
  await page.getByRole('button',{name:'Tạo phiếu tương tự reuse-source',exact:true}).filter({visible:true}).click();
  dialog=page.getByRole('dialog',{name:/Tạo phiếu KPH/});
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('Hàng tổng hợp');
  await expect(dialog.getByRole('textbox',{name:'Số lượng',exact:true})).toHaveValue('7.5');
  await expect(dialog.getByLabel('Nội dung tình trạng khác',{exact:true})).toHaveValue('Tình trạng riêng');
  await expect(dialog.getByLabel('Nội dung biện pháp khác',{exact:true})).toHaveValue('Biện pháp riêng');
  await expect(dialog.getByRole('textbox',{name:'Ngày phát hiện',exact:true})).not.toHaveValue('01/01/2020');
  await expect(dialog.getByLabel('Ảnh đã chọn',{exact:true})).toHaveCount(0);
  await dialog.getByLabel('Tên hàng hóa',{exact:true}).fill('Hàng đã sửa khi sao chép');
  await dialog.getByRole('textbox',{name:'Tên người nhập',exact:true}).fill('Người kiểm thử mới');
  const png=Buffer.from(await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=640;canvas.height=480;const ctx=canvas.getContext('2d');ctx.fillStyle='#edf8f1';ctx.fillRect(0,0,640,480);ctx.fillStyle='#006b4b';ctx.fillText('SYNTHETIC TEST IMAGE',40,40);return canvas.toDataURL('image/png').split(',')[1];}),'base64');
  await dialog.locator('input[type=file][multiple]').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:png});
  await expect(dialog.getByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
  expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  await page.screenshot({path:`${output}/${viewport.width}-similar.png`});
  await dialog.getByRole('button',{name:'Lưu phiếu',exact:true}).click();await expect(dialog).toHaveCount(0);
  await page.reload();await unlock();
  const stored=await page.evaluate(async()=>{
   const db=await new Promise(resolve=>{const r=indexedDB.open('coopfood-kph-pilot');r.onsuccess=()=>resolve(r.result)});
   const records=await new Promise(resolve=>{const r=db.transaction('records').objectStore('records').getAll();r.onsuccess=()=>resolve(r.result)});db.close();return records;
  });
  expect(stored).toHaveLength(3);expect(stored.find(r=>r.id==='reuse-source').productName).toBe('Hàng tổng hợp');
  const created=stored.find(r=>!r.id.startsWith('reuse-'));expect(created.productName).toBe('Hàng đã sửa khi sao chép');expect(created.approvalStatus).toBe('PENDING');expect(created.photos).toHaveLength(1);
  expect(errors).toEqual([]);expect(await page.locator('html').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  console.log(`PASS ${viewport.width}x${viewport.height}: floating dropdown/no layout shift, SKU/name search, reopen, arrows/Enter/Escape, click selection, active service worker, compact copy action, similar editable/custom choices, photo/save/reload, source intact, no page errors`);
  await context.close();
 }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
