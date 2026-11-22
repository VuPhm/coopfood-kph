// Real backend8082 + Fresh4173; guarded synthetic KPHON02 fixture, no API mocks.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const base='http://127.0.0.1:4173', store='73000000-0000-4000-8000-000000000001', outside='73000000-0000-4000-8000-000000000002';
const output='.local/verification/fresh-restore/kphon02';
async function login(page, username='region.admin03') {
 await page.goto(base); await page.getByLabel('Tên đăng nhập',{exact:true}).fill(username);
 await page.getByLabel('Mật khẩu',{exact:true}).fill('admin-e2e-password');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await page.getByRole('button',{name:/^001 ·/}).click();
 await expect(page.getByRole('heading',{name:'Công việc cửa hàng'})).toBeVisible();
}
async function route(page, hash) { await page.evaluate(h=>location.hash=h,hash); }
async function layout(page,name) {
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: horizontal overflow`);
 assert.equal(await page.getByText('Vào bản dùng thử',{exact:true}).count(),0);
}
(async()=>{
 mkdirSync(output,{recursive:true}); const browser=await chromium.launch(); const results=[];
 try {
 for(const [name,width,height] of [['mobile',390,844],['desktop',1440,1024]]) {
  const c=await browser.newContext({viewport:{width,height},locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'});
  const page=await c.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await login(page);
  assert.equal(await page.getByRole('button',{name:/^002 ·/}).count(),0);
  assert.equal((await c.request.get(`${base}/api/v1/stores/${outside}/kph`)).status(),403);
  await page.getByRole('button',{name:'Quản lý DATE',exact:true}).click();
  await page.getByRole('button',{name:'Quét / tra mã hàng',exact:true}).click();
  await page.getByLabel('Barcode',{exact:true}).fill('0890123456789');
  await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
  await expect(page.getByRole('status').filter({hasText:'Đã tìm thấy sản phẩm.'})).toBeVisible();
  await expect(page.getByText('000042',{exact:true})).toBeVisible();
  await expect(page.getByText('000007',{exact:true})).toBeVisible();
  await layout(page,`${name}-lookup`); await page.screenshot({path:`${output}/${name}-lookup.png`,fullPage:true});
  await page.getByLabel('Barcode',{exact:true}).fill('0000000000000');
  await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
  await page.getByRole('button',{name:'Nhập tay',exact:true}).click();
  const input=page.getByLabel('Tên sản phẩm',{exact:true}); await expect(input).toHaveValue('');
  await input.fill('Bản nháp synthetic');
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/v1/kph/stores'));
  await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); await refreshed;
  await expect(input).toBeVisible(); await expect(input).toHaveValue('Bản nháp synthetic');
  await layout(page,`${name}-manual`); await page.screenshot({path:`${output}/${name}-manual.png`,fullPage:true});
  const historyUrl=`${base}/api/v1/stores/${store}/kph?type=TPTS&page=1&pageSize=25`;
  const firstPage=await (await c.request.get(historyUrl)).json();
  assert.ok(firstPage.totalItems > 25); assert.ok(firstPage.totalPages >= 2);
  await route(page,'kph'); await expect(page.getByText(`${firstPage.totalItems} phiếu`,{exact:true})).toBeVisible();
  await expect(page.getByText(`Trang 1/${firstPage.totalPages}`,{exact:true})).toBeVisible();
  const opens=page.getByRole('button',{name:/^Mở phiếu/}); await expect(opens).toHaveCount(firstPage.items.length);
  await opens.first().click(); await expect(page.getByRole('dialog',{name:'Phiếu KPH',exact:true})).toBeVisible();
  const image=page.getByRole('button',{name:'Xem ảnh 1',exact:true}).locator('img');
  await expect.poll(()=>image.evaluate(i=>i.complete && i.naturalWidth>0)).toBe(true);
  const mediaPath=await image.getAttribute('src'); assert.match(mediaPath,/\/photos\/1$/);
  assert.equal((await c.request.get(`${base}${mediaPath}`)).status(),200);
  const anon=await browser.newContext(); assert.equal((await anon.request.get(`${base}${mediaPath}`)).status(),401); await anon.close();
  await page.screenshot({path:`${output}/${name}-detail.png`,fullPage:true});
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog',{name:'Phiếu KPH',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Trang sau',exact:true}).click();
  const secondPage=await (await c.request.get(historyUrl.replace('page=1','page=2'))).json();
  await expect(page.getByText(`Trang 2/${secondPage.totalPages}`,{exact:true})).toBeVisible(); await expect(opens).toHaveCount(secondPage.items.length);
  await page.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
  await page.getByLabel('Sắp xếp',{exact:true}).selectOption('quantity');
  await page.getByLabel('Thứ tự',{exact:true}).selectOption('ascending');
  const sorted=await (await c.request.get(historyUrl+'&sort=quantity&direction=ascending')).json();
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await expect(page.getByText(`Trang 1/${sorted.totalPages}`,{exact:true})).toBeVisible(); await expect(opens).toHaveCount(sorted.items.length);
  await page.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
  await page.getByLabel('Trạng thái',{exact:true}).selectOption('APPROVED');
  const approved=await (await c.request.get(historyUrl+'&sort=quantity&direction=ascending&approvalStatus=APPROVED')).json();
  await page.getByRole('button',{name:'Xong',exact:true}).click(); await expect(page.getByText(`${approved.totalItems} phiếu`,{exact:true})).toBeVisible(); await expect(opens).toHaveCount(approved.items.length);
  await page.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
  await page.getByRole('button',{name:'Đặt lại',exact:true}).click();
  await page.getByLabel('Từ ngày',{exact:true}).fill('01/01/2099');
  await page.getByLabel('Đến ngày',{exact:true}).fill('01/09/2026');
  await expect(page.getByRole('alert')).toContainText('Ngày bắt đầu'); await expect(opens).toHaveCount(0);
  await page.getByRole('button',{name:'Đặt lại',exact:true}).click();
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await expect(page.getByText(`${firstPage.totalItems} phiếu`,{exact:true})).toBeVisible();
  await layout(page,`${name}-history`); await page.screenshot({path:`${output}/${name}-history.png`,fullPage:true});
  // End the real session via API, then verify no previous scope survives focus refresh.
  const session=await (await c.request.get(`${base}/api/v1/auth/session`)).json();
  assert.equal((await c.request.post(`${base}/api/v1/auth/logout`,{headers:{'X-CSRF-TOKEN':session.csrfToken}})).status(),204);
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toBeVisible(); await expect(opens).toHaveCount(0);
  assert.deepEqual(errors,[]); results.push({viewport:name,result:'PASS',records:firstPage.totalItems,pageSize:25,checks:['FOUND leading zeros','NOT_FOUND blank manual + focus draft','server paging/filter/sort/counts','private stamped media','cross-region403','expiry boundary','no overflow']});
  await c.close();
 }
 writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2)+'\n'); console.log(JSON.stringify(results));
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
