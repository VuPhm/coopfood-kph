// Synthetic camera + BarcodeDetector: local preview only, never a real user's camera/data.
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const fs = require('node:fs');
const base = process.env.PILOT_PREVIEW_URL || 'http://127.0.0.1:4383/';
if (!['127.0.0.1','localhost'].includes(new URL(base).hostname)) throw Error('Local preview only');
fs.mkdirSync('.local/pilot-scan-browser',{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
 try {for(const viewport of [{width:390,height:844},{width:1440,height:1024}]) {
  const context=await browser.newContext({viewport,permissions:['camera'],serviceWorkers:'block'});
  await context.addInitScript(()=>{window.__syntheticCode='2912345612345';window.BarcodeDetector=class {static async getSupportedFormats(){return ['ean_8','ean_13','upc_a','code_128','code_39']} async detect(){return [{rawValue:window.__syntheticCode}]}}});
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const unlock=async()=>{await page.getByLabel('Mã truy cập',{exact:true}).fill('0000');await expect(page.getByRole('button',{name:'Tạo phiếu TP tươi sống',exact:true})).toBeEnabled()};
  await page.goto(base);await unlock();
  await page.evaluate(async()=>{
   const db=await new Promise(resolve=>{const r=indexedDB.open('coopfood-kph-pilot');r.onsuccess=()=>resolve(r.result)});
   const tx=db.transaction('records','readwrite');
   for(const [i,name] of ['Tên cũ','Tên mới','Tên mới'].entries()) tx.objectStore('records').put({id:'scan-'+i,kind:'TPTS',sku:'2912345612345',productName:name,supplier:'NCC '+i,detectedDate:'01/01/2026',detectedBy:'Synthetic',quantity:'1 EA',quantityValue:1,unit:'EA',condition:'Dập úng',resolution:'HỦY',treatmentDate:'',approvalStatus:'PENDING',photos:[],note:'',trashState:'active',createdAt:`2026-01-0${i+1}T00:00:00Z`,updatedAt:'2026-01-03T00:00:00Z',deletedAt:null,lastExportedAt:null});
   await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
  });
  await page.reload();await unlock();await page.getByRole('button',{name:'Tạo phiếu TP tươi sống',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:/Tạo phiếu KPH/});
  await dialog.getByRole('button',{name:'Quét mã barcode',exact:true}).click();
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('Tên mới',{timeout:15000});
  await expect(dialog.getByLabel('Nhà cung cấp',{exact:true})).toHaveValue('NCC 2');
  await expect(page.getByRole('listbox',{name:'Đề xuất SKU'})).toHaveCount(0);
  const quantity=dialog.getByRole('textbox',{name:'Số lượng',exact:true});await quantity.fill('7,5');
  await dialog.getByText('EA',{exact:true}).click();await dialog.getByText('Thối mốc',{exact:true}).click();
  await dialog.getByText('KHÁC',{exact:true}).click();await dialog.getByLabel('Nội dung biện pháp khác',{exact:true}).fill('Biện pháp đã nhập');
  await dialog.getByRole('combobox',{name:'Mã SKU / UPC',exact:true}).click();
  await expect(page.getByRole('option')).toHaveCount(2);
  await page.screenshot({path:`.local/pilot-scan-browser/${viewport.width}-fallback.png`});
  await page.getByRole('option',{name:/Tên cũ/}).click();
  await dialog.getByLabel('Nhà cung cấp',{exact:true}).focus();
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('Tên cũ');
  await expect(dialog.getByLabel('Nhà cung cấp',{exact:true})).toHaveValue('NCC 0');
  await expect(quantity).toHaveValue('7,5');await expect(dialog.getByRole('radio',{name:'EA',exact:true})).toBeChecked();
  await expect(dialog.getByRole('radio',{name:'Thối mốc',exact:true})).toBeChecked();await expect(dialog.getByLabel('Nội dung biện pháp khác',{exact:true})).toHaveValue('Biện pháp đã nhập');
  await page.evaluate(()=>window.__syntheticCode='2912345602505');
  await dialog.getByRole('button',{name:'Quét mã barcode',exact:true}).click();
  await expect(dialog.getByRole('combobox',{name:'Mã SKU / UPC',exact:true})).toHaveValue('2912345602505',{timeout:15000});
  await expect(dialog.getByLabel('Tên hàng hóa',{exact:true})).toHaveValue('');await expect(page.getByRole('listbox')).toHaveCount(0);
  expect(errors).toEqual([]);await context.close();console.log(`PASS ${viewport.width}x${viewport.height}: native scan latest exact metadata, no unsolicited dropdown, distinct-name fallback, quantity/unit/condition/resolution preserved, unmatched full code not inferred`);
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
