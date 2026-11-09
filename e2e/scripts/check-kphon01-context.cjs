// Real central backend and guarded synthetic ADMIN03 DB; no API mocks/routes.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync } = require('node:fs');
const adminUrl='http://127.0.0.1:4175', storeUrl='http://127.0.0.1:4173';
const storeId='73000000-0000-4000-8000-000000000001';
const employeeId='71000000-0000-4000-8000-000000000003';
const output='.local/verification/kphon01-context';
const results=[];
async function login(page, username) {
 await page.goto(storeUrl);
 await page.getByLabel('Tên đăng nhập',{exact:true}).fill(username);
 await page.getByLabel('Mật khẩu',{exact:true}).fill('admin-e2e-password');
 await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Chọn cửa hàng',exact:true})).toBeVisible();
}
async function select(page, code='001') {
 await page.getByRole('button',{name:new RegExp(`^${code} ·`)}).click();
 await expect(page.getByText(`Mã cửa hàng · ${code}`,{exact:true})).toBeVisible();
}
async function refresh(page) { await page.evaluate(()=>window.dispatchEvent(new Event('focus'))); }
async function logout(page) {
 await page.getByRole('button',{name:'Tài khoản',exact:true}).click();
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
 await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toBeVisible();
}
async function layout(page,name) {
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${name}: overflow`);
 assert.equal(await page.getByText('Vào bản dùng thử',{exact:true}).count(),0);
 assert.equal(await page.getByRole('main').count(),1);
}
(async()=>{
 mkdirSync(output,{recursive:true});const browser=await chromium.launch();
 const options={locale:'vi-VN',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'};
 const admin=await browser.newContext(options);
 try {
  await expect.poll(async()=>{try{return(await admin.request.get('http://127.0.0.1:8082/actuator/health')).status();}catch{return 0;}},{timeout:20000}).toBe(200);
  const logged=await admin.request.post(`${adminUrl}/api/v1/auth/login`,{data:{username:'chain.admin03',password:'admin-e2e-password'}});
  assert.equal(logged.status(),200);const token=(await logged.json()).csrfToken;
  async function role(role) {const r=await admin.request.put(`${adminUrl}/api/v1/admin/stores/${storeId}/memberships/${employeeId}`,{headers:{'X-CSRF-TOKEN':token},data:{role,reason:'KPHON01 synthetic context test'}});assert.equal(r.status(),200,await r.text());}
  async function revoke() {const r=await admin.request.post(`${adminUrl}/api/v1/admin/stores/${storeId}/memberships/${employeeId}/revoke`,{headers:{'X-CSRF-TOKEN':token},data:{reason:'KPHON01 synthetic scope revoke'}});assert.ok([200,409].includes(r.status()));}
  for(const[name,width,height]of[['mobile',390,844],['desktop',1440,1024]]){
   await role('EMPLOYEE');
   const c=await browser.newContext({...options,viewport:{width,height}});const page=await c.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await login(page,'employee.admin03');
   await expect(page.getByRole('button',{name:/^002 ·/})).toHaveCount(0);
   const discovery=await c.request.get(`${storeUrl}/api/v1/kph/stores`);assert.equal(discovery.headers()['cache-control'],'no-store');
   assert.deepEqual((await discovery.json())[0].capabilities,['VIEW','CREATE']);
   await select(page);await expect(page.getByText('Duyệt phiếu',{exact:true})).toHaveCount(0);
   await role('STORE_MANAGER');await refresh(page);
   await expect(page.getByText('Duyệt phiếu',{exact:true})).toBeVisible();
   await role('EMPLOYEE');await refresh(page);
   await expect(page.getByText('Duyệt phiếu',{exact:true})).toHaveCount(0);
   await expect(page.getByText('Xem phiếu',{exact:true})).toBeVisible();
   await revoke();await refresh(page);
   await expect(page.getByText('Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.',{exact:true})).toBeVisible();
   await expect(page.getByText('Mã cửa hàng · 001',{exact:true})).toHaveCount(0);
   assert.equal((await c.request.get(`${storeUrl}/api/v1/stores/${storeId}/kph`)).status(),403);
   await role('EMPLOYEE');await page.getByRole('button',{name:'Tải lại quyền cửa hàng',exact:true}).click();
   await select(page);
   const session=await(await c.request.get(`${storeUrl}/api/v1/auth/session`)).json();
   assert.equal((await c.request.post(`${storeUrl}/api/v1/auth/logout`,{headers:{'X-CSRF-TOKEN':session.csrfToken}})).status(),204);
   await refresh(page);await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toBeVisible();
   await login(page,'region.admin03');
   const regionSession=await(await c.request.get(`${storeUrl}/api/v1/auth/session`)).json();assert.equal(regionSession.user.stores.length,0);
   assert.equal(await page.getByRole('button',{name:/^001 ·/}).count(),1);
   await select(page);await expect(page.getByText('Duyệt phiếu',{exact:true})).toBeVisible();
   await page.evaluate(()=>{location.hash='date';});
   await expect(page.getByText(/chưa được kết nối trong phiên online/)).toBeVisible();
   await expect(page.getByRole('button',{name:'Tạo lô',exact:true})).toHaveCount(0);
   await layout(page,name);await page.screenshot({path:`${output}/${name}-region.png`,fullPage:true});
   await page.getByRole('button',{name:'Tài khoản',exact:true}).click();
   await page.getByRole('button',{name:'Đổi mật khẩu',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'Đổi mật khẩu',exact:true})).toHaveCount(1);
   await page.screenshot({path:`${output}/${name}-password.png`,fullPage:false});
   await page.keyboard.press('Escape');
   await logout(page);
   await login(page,'chain.admin03');
   assert.equal(await page.getByRole('button',{name:/^00[12] ·/}).count(),2);
   await select(page);
   await page.getByRole('button',{name:'Tài khoản',exact:true}).click();
   await page.getByRole('button',{name:'Đổi cửa hàng',exact:true}).click();
   await select(page,'002');
   await expect(page.getByText('Mã cửa hàng · 001',{exact:true})).toHaveCount(0);
   await c.setOffline(true);await refresh(page);
   await expect(page.getByRole('alert')).toContainText('Không thể xác minh');
   await expect(page.getByText('Mã cửa hàng · 002',{exact:true})).toHaveCount(0);
   await page.getByRole('button',{name:'Thử lại',exact:true}).click();
   await expect(page.getByRole('alert')).toContainText('Không thể xác minh');
   await c.setOffline(false);
   await expect(page.getByRole('heading',{name:'Chọn cửa hàng',exact:true})).toBeVisible();
   await layout(page,`${name}-reconnected`);
   await select(page,'002');await page.reload();
   await expect(page.getByRole('heading',{name:'Chọn cửa hàng',exact:true})).toBeVisible();
   assert.deepEqual(errors,[]);
   results.push(`PASS ${name} ${width}×${height}: grant/upgrade/downgrade/revoke, expiry, inherited scope, store switch, offline/retry, no mock, single password dialog`);
   console.log(results.at(-1));await c.close();
  }
  await revoke();
  const c=await browser.newContext(options);const p=await c.newPage();await login(p,'catalog.admin03');
  await expect(p.getByText('Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.',{exact:true})).toBeVisible();
  await c.close();results.push('PASS catalog-only/no KPH scope returns empty stores');console.log(results.at(-1));
  writeFileSync(`${output}/results.json`,JSON.stringify({results,realBackend:true,mockedRoutes:0},null,2));
 }finally{await admin.close();await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
