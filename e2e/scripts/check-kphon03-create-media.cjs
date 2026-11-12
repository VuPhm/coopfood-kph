// Real backend + synthetic acceptance DB. Network fault drops a real committed response; no business API mocks.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const base='http://127.0.0.1:4173', store='73000000-0000-4000-8000-000000000001', outside='73000000-0000-4000-8000-000000000002', employee='71000000-0000-4000-8000-000000000003';
const mediaRoot=path.resolve('../kphon02-lookup-history/.local/runtime/kphon02/media');
const output='.local/verification/kphon03';
const password='admin-e2e-password';
async function login(page, user='region.admin03') {
 await page.goto(base+'/#kph'); await page.getByLabel('Tên đăng nhập',{exact:true}).fill(user); await page.getByLabel('Mật khẩu',{exact:true}).fill(password);
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click(); await page.getByRole('button',{name:/^001 ·/}).click();
 await expect(page.getByRole('heading',{name:'Quyền hàng không phù hợp',exact:true})).toBeVisible();
 await page.evaluate(()=>location.hash='kph'); await expect(page.getByRole('button',{name:'Tạo phiếu TP tươi sống',exact:true})).toBeVisible();
}
async function history(c,type='TPTS') { const r=await c.request.get(`${base}/api/v1/stores/${store}/kph?type=${type}`); assert.equal(r.status(),200); return r.json(); }
async function fillDraft(page, title, files) {
 await page.getByRole('textbox',{name:'Tên hàng hóa',exact:true}).fill(title);
 const picker=page.getByText('Chọn ảnh',{exact:true}).locator('..').locator('input'); await picker.setInputFiles(files);
 await expect(page.getByText(new RegExp(`Đã xử lý ${files.length}/3 ảnh`))).toBeVisible();
}
async function review(page) { await page.getByRole('button',{name:'Xem lại',exact:true}).click(); await expect(page.getByRole('button',{name:'Gửi phiếu',exact:true})).toBeVisible(); }
async function originals(record, files) {
 assert.match(record.id,/^[0-9a-f-]{36}$/);
 const query=`SELECT json_agg(row_to_json(p) ORDER BY ordinal) FROM (SELECT ordinal,original_storage_key,stamped_storage_key,original_sha256 FROM kph_photos WHERE kph_record_id='${record.id}') p`;
 const rows=JSON.parse(execFileSync('docker',['exec','coopfood-kph-kphon02-acceptance','psql','-U','kph_admin03','-d','coopfood_kph_admin03_acceptance','-Atc',query],{encoding:'utf8'}));
 assert.equal(rows.length,files.length);
 rows.forEach((row,index)=>{
  assert.equal(row.ordinal,index+1);
  for(const key of [row.original_storage_key,row.stamped_storage_key]) assert.ok(path.resolve(mediaRoot,key).startsWith(mediaRoot+path.sep));
  assert.deepEqual(readFileSync(path.resolve(mediaRoot,row.original_storage_key)),files[index].buffer);
  assert.equal(row.original_sha256,createHash('sha256').update(files[index].buffer).digest('hex'));
  const jpeg=readFileSync(path.resolve(mediaRoot,row.stamped_storage_key)); assert.deepEqual([...jpeg.subarray(0,2)],[255,216]);
 });
}
(async()=>{
 mkdirSync(output,{recursive:true}); const browser=await chromium.launch();const results=[];
 const options={locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'};
 try {
 for(const [name,width,height] of [['mobile',390,844],['desktop',1440,1024]]) {
  const c=await browser.newContext({...options,viewport:{width,height}}), page=await c.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message)); await login(page);
  const files=await page.evaluate(()=>['#d12c2c','#19854b','#2452bd'].map((color,i)=>{const c=document.createElement('canvas');c.width=640+i*20;c.height=360;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,c.width,c.height);x.fillStyle='white';x.font='32px sans-serif';x.fillText('SYNTHETIC '+(i+1),20,60);return c.toDataURL('image/png').split(',')[1];}));
  const payloads=files.map((data,i)=>({name:`synthetic-${i+1}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')}));
  const before=(await history(c)).totalItems, title=`KPHON03 ${name} ${Date.now()}`;
  await page.getByRole('button',{name:'Tạo phiếu TP tươi sống',exact:true}).click();
  await expect(page.getByRole('textbox',{name:'Ngày phát hiện',exact:true})).toHaveAttribute('readonly','');
  await expect(page.getByRole('textbox',{name:'Người phát hiện',exact:true})).toHaveValue('Quản lý vùng Nam mẫu');
  await page.getByRole('textbox',{name:'Mã SKU / UPC',exact:true}).fill('0000000000000');
  await page.getByRole('textbox',{name:'Tên hàng hóa',exact:true}).focus();
  await expect(page.getByText(/Không tìm thấy barcode\. Có thể/)).toBeVisible();
  await fillDraft(page,title,payloads);
  let releaseScope; const scopeHeld=new Promise(resolve=>{releaseScope=resolve;});
  const discovery=async route=>{const response=await route.fetch();await scopeHeld;await route.fulfill({response});};
  await page.route('**/api/v1/kph/stores',discovery);
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/v1/kph/stores'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.locator('[data-suspended="true"] [data-scope-status]')).toBeVisible();
  await expect(page.getByRole('textbox',{name:'Tên hàng hóa',exact:true})).toBeHidden();
  await page.screenshot({path:`${output}/${name}-verifying.png`});
  releaseScope(); await refreshed; await page.unroute('**/api/v1/kph/stores',discovery);
  await expect(page.getByRole('textbox',{name:'Tên hàng hóa',exact:true})).toHaveValue(title);
  await expect(page.getByLabel('Ảnh đã chọn').locator('img')).toHaveCount(3);
  await page.screenshot({path:`${output}/${name}-form.png`});
  await review(page); assert.equal((await history(c)).totalItems,before);
  let committed, release; const held=new Promise(resolve=>{release=resolve;}); let first=true; const keys=[];
  page.on('request',request=>{if(request.method()==='POST'&&request.url()===`${base}/api/v1/stores/${store}/kph`)keys.push(request.headers()['idempotency-key']);});
  await page.route(`**/api/v1/stores/${store}/kph`,async route=>{
   if(route.request().method()!=='POST'||!first) return route.continue(); first=false;
   const response=await route.fetch(); assert.equal(response.status(),201); committed=await response.json(); await held; await route.abort('failed');
  });
  await page.getByRole('button',{name:'Gửi phiếu',exact:true}).click();
  await expect.poll(()=>!!committed).toBe(true); await expect(page.getByRole('button',{name:'Đang gửi…',exact:true})).toBeDisabled();
  await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click(); await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Đang gửi…',exact:true})).toBeVisible(); release();
  await expect(page.getByRole('alert').filter({hasText:'Chưa gửi được phiếu'})).toBeVisible(); await expect(page.getByText('Đã gửi phiếu',{exact:true})).toHaveCount(0);
  await page.screenshot({path:`${output}/${name}-retry.png`});
  const retry=page.waitForResponse(r=>r.request().method()==='POST'&&r.url()===`${base}/api/v1/stores/${store}/kph`);
  await page.getByRole('button',{name:'Gửi phiếu',exact:true}).click();const saved=await(await retry).json();assert.equal(saved.id,committed.id);
  await expect(page.getByText('Đã gửi phiếu',{exact:true})).toBeVisible();assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
  assert.equal((await history(c)).totalItems,before+1);assert.equal(saved.lookupStatus,'NOT_FOUND');assert.equal(saved.barcode,'0000000000000');assert.equal(saved.detectedBy.displayName,'Quản lý vùng Nam mẫu');
  await originals(saved,payloads);
  for(const [i,photo]of saved.photos.entries()){
   assert.equal(photo.ordinal,i+1); const response=await c.request.get(base+photo.stampedContentPath);assert.equal(response.status(),200);assert.match(response.headers()['cache-control'],/private/);
   const anon=await browser.newContext();assert.equal((await anon.request.get(base+photo.stampedContentPath)).status(),401);await anon.close();
   assert.equal((await c.request.get(base+photo.stampedContentPath.replace(store,outside))).status(),403);
  }
  await expect(page.getByRole('button',{name:`Mở phiếu ${title}`,exact:true})).toBeVisible();
  await page.screenshot({path:`${output}/${name}-saved.png`});
  // Create the other kind through real published lookup, preserving leading-zero catalog IDs.
  await page.getByRole('button',{name:/TP khô/}).click(); await page.getByRole('button',{name:'Tạo phiếu TP khô & khác',exact:true}).click();
  await page.getByRole('textbox',{name:'Mã SKU / UPC',exact:true}).fill('0890123456789');await page.getByRole('textbox',{name:'Tên hàng hóa',exact:true}).focus();
  await expect(page.getByText('Đã tìm thấy 000042.',{exact:true})).toBeVisible();
  await fillDraft(page,'Sản phẩm E2E FOUND',[payloads[0]]); await review(page);
  const foundResponse=page.waitForResponse(r=>r.request().method()==='POST'&&r.url()===`${base}/api/v1/stores/${store}/kph`);
  await page.getByRole('button',{name:'Gửi phiếu',exact:true}).click();const found=await(await foundResponse).json();
  await expect(page.getByText('Đã gửi phiếu',{exact:true})).toBeVisible();assert.equal(found.type,'TPCN');assert.equal(found.lookupStatus,'FOUND');assert.equal(found.catalogSnapshot.skuCode,'000042');assert.equal(found.catalogSnapshot.supplierCode,'000007');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
  results.push({viewport:name,result:'PASS',recordId:saved.id,foundRecordId:found.id,checks:['real inherited context','NOT_FOUND barcode preserved','review then send','3 originals ordered byte-identical','private stamped photos','focus preserves form/photos','close/double-submit blocked while sending','lost committed response retried once without duplicate','TPCN published lookup snapshot']});await c.close();
 }
 // Revoke membership between review and submission; no guessed success or persisted record.
 const admin=await browser.newContext(options);const logged=await admin.request.post(base+'/api/v1/auth/login',{data:{username:'chain.admin03',password}});assert.equal(logged.status(),200);const token=(await logged.json()).csrfToken;
 const memberUrl=`${base}/api/v1/admin/stores/${store}/memberships/${employee}`;
 assert.equal((await admin.request.put(memberUrl,{headers:{'X-CSRF-TOKEN':token},data:{role:'EMPLOYEE',reason:'KPHON03 synthetic create test'}})).status(),200);
 const employeeContext=await browser.newContext({...options,viewport:{width:390,height:844}}),page=await employeeContext.newPage();await login(page,'employee.admin03');const before=(await history(admin)).totalItems;
 await page.getByRole('button',{name:'Tạo phiếu TP tươi sống',exact:true}).click();
 const file={name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF3cAAAAASUVORK5CYII=','base64')};
 await fillDraft(page,'KPHON03 revoked draft',[file]);await review(page);
 assert.equal((await admin.request.post(memberUrl+'/revoke',{headers:{'X-CSRF-TOKEN':token},data:{reason:'KPHON03 synthetic revoke before send'}})).status(),200);
 const denied=page.waitForResponse(r=>r.request().method()==='POST'&&r.url()===`${base}/api/v1/stores/${store}/kph`);
 await page.getByRole('button',{name:'Gửi phiếu',exact:true}).click();assert.equal((await denied).status(),403);
 await expect(page.getByRole('heading',{name:'Chọn cửa hàng',exact:true})).toBeVisible();assert.equal((await history(admin)).totalItems,before);await expect(page.getByText('Đã gửi phiếu',{exact:true})).toHaveCount(0);
 results.push({scenario:'revoke-before-send',result:'PASS',checks:['next POST403','scope closed','no success or new record']});
 await employeeContext.close();await admin.close();writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
