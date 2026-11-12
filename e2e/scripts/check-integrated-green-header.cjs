// Read-only business smoke against synthetic backend8082; only own login sessions mutate.
const {chromium,expect}=require('@playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const output='.local/verification/ui08';
const gradient='linear-gradient(120deg, rgb(0, 95, 67), rgb(0, 122, 82) 58%, rgb(0, 128, 90))';
(async()=>{
  fs.mkdirSync(output,{recursive:true});const browser=await chromium.launch();
  try {
    for(const width of [390,1440]) {
      const page=await browser.newPage({viewport:{width,height:width===390?844:1024},reducedMotion:'reduce',serviceWorkers:'block'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto('http://127.0.0.1:4179');
      await page.getByLabel('Tên đăng nhập',{exact:true}).fill('region.admin03');
      await page.getByLabel('Mật khẩu',{exact:true}).fill('admin-e2e-password');
      await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
      await page.getByRole('button',{name:/^001 ·/}).click();
      await expect(page.getByRole('heading',{name:'Quyền hàng không phù hợp'})).toBeVisible();
      await page.getByRole('button',{name:'Tra mã hàng',exact:true}).click();
      await page.getByLabel('Barcode',{exact:true}).fill('0890123456789');
      await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
      await expect(page.getByRole('status').filter({hasText:'Đã tìm thấy sản phẩm.'})).toBeVisible();
      await page.evaluate(()=>location.hash='kph');
      await expect(page.locator('.store-online-kph')).toBeVisible();
      await expect(page.locator('.store-online-kph').getByRole('alert')).toHaveCount(0);
      if(width>=900) {
        await expect(page.locator('.store-header')).toHaveCSS('background-image',gradient);
        await expect(page.locator('.store-header')).toHaveCSS('border-bottom-width','0px');
      }
      await page.screenshot({path:`${output}/online-kph-${width}.png`});
      const account=page.getByRole('button',{name:'Tài khoản',exact:true});
      await account.click();await expect(page.getByRole('dialog',{name:'Tài khoản',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');await expect(account).toBeFocused();
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);await page.close();
      console.log(`PASS real backend Store ${width}: session/scope, barcode, D01 history, account and green chrome`);
    }
    const page=await browser.newPage({viewport:{width:1440,height:1024},serviceWorkers:'block'});
    await page.goto('http://127.0.0.1:4178/#overview');
    await page.getByLabel(/Tên đăng nhập/).fill('region.admin03');
    await page.getByLabel(/^Mật khẩu/).fill('admin-e2e-password');
    await page.getByRole('button',{name:'Đăng nhập',exact:true}).click();
    await page.getByRole('button',{name:'Quyền cửa hàng',exact:true}).click();
    await expect(page.locator('.membership-workspace')).toBeVisible();
    await expect(page.locator('.admin-topbar')).toHaveCSS('background-image',gradient);
    await page.screenshot({path:`${output}/admin-membership-1440.png`});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.close();console.log('PASS real backend Admin: region membership navigation retained and green header');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
