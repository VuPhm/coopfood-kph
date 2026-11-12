// UI fixtures exercise composition only; this does not prove backend authorization.
const { chromium, expect } = require('@playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const output = '.local/verification/chrome-r9';
const fixture = name => JSON.parse(fs.readFileSync(`contracts/fixtures/api/${name}.json`, 'utf8'));
const adminBase = process.env.ADMIN_PREVIEW_URL || 'http://127.0.0.1:4175';
const storeBase = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4176';
const properties = ['color','backgroundColor','backgroundImage','borderRadius','fontSize','lineHeight','padding','margin','width','height','boxShadow'];
const navPaint = el => {
  const style=getComputedStyle(el);
  return Object.fromEntries(['color','backgroundImage','borderRadius','fontSize','lineHeight','minHeight'].map(key=>[key,style[key]]));
};
function mobilePresentation(rows) {
  const rail=rows.findIndex(row=>row.cls==='store-desktop-rail');
  const main=rows.findIndex(row=>row.cls==='store-main-column');
  // The official logo replaces the old artwork. Compare the remaining mobile
  // presentation; hidden desktop sidebar DOM is outside this visual baseline.
  return rows.filter((row,index)=>!(index>=rail&&index<main)&&!(row.tag==='IMG'&&rows[index-1]?.cls==='store-header-brand'));
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No page overflow');
}
async function navigate(page, label) {
  const menu = page.getByRole('button', {name:'Mở điều hướng',exact:true});
  if (await menu.isVisible()) {
    await menu.click();
    await page.getByRole('dialog').getByRole('button',{name:label,exact:true}).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(menu).toBeFocused();
  } else await page.getByRole('button',{name:label,exact:true}).click();
}
(async () => {
  fs.mkdirSync(output,{recursive:true});
  const browser = await chromium.launch();
  let desktopNavPaint;
  try {
    for (const width of [1440,1280,1024,900,834,390]) {
      const page = await browser.newPage({viewport:{width,height:width===390?844:1024},reducedMotion:'reduce',serviceWorkers:'block'});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      const session=fixture('session'); session.user.globalRoles=['CHAIN_ADMIN','CATALOG_ADMIN'];
      await page.route('**/api/v1/**', route => {
        const path=new URL(route.request().url()).pathname;
        if(path.endsWith('/auth/session')) return route.fulfill({json:session});
        if(path.endsWith('/catalog/imports')) return route.fulfill({json:fixture('catalog-imports')});
        if(path.includes('/catalog/imports/')) return route.fulfill({json:fixture('catalog-import-detail')});
        return route.fulfill({json:[]});
      });
      await page.goto(`${adminBase}/#overview`);
      await expect(page.getByRole('heading',{name:'Tổng quan vận hành',exact:true})).toBeVisible();
      await noOverflow(page);
      if(width>=768) {
        const rail=await page.locator('.admin-sidebar').boundingBox();
        const header=await page.locator('.admin-topbar').boundingBox();
        const brand=await page.locator('.admin-brand').boundingBox();
        assert.equal(rail.x,0); assert.equal(rail.y,0);
        assert.equal(rail.x+rail.width,header.x);
        assert.equal(brand.y+brand.height,header.y+header.height,'One shared header baseline');
        await expect(page.locator('.admin-sidebar')).toHaveCSS('border-top-left-radius','0px');
        await expect(page.locator('.admin-logo')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
        await expect(page.locator('.admin-logo img')).toHaveAttribute('src','/brand/coopfood-logo-light.png');
        await expect(page.locator('.admin-topbar')).toHaveCSS('background-image','linear-gradient(120deg, rgb(0, 95, 67), rgb(0, 122, 82) 58%, rgb(0, 128, 90))');
        await expect(page.locator('.admin-topbar')).toHaveCSS('border-bottom-width','0px');
        await expect(page.locator('.admin-sidebar')).toHaveCSS('border-right-width','0px');
        await expect(page.locator('.admin-brand')).toHaveCSS('border-bottom-width','0px');
        if(width===1440) desktopNavPaint=await page.locator('.admin-sidebar [aria-current="page"]').evaluate(navPaint);
      }
      await page.screenshot({path:`${output}/admin-after-${width}.png`});
      if(width>=1024) {
        await page.getByRole('button',{name:'Thu gọn sidebar',exact:true}).click();
        await expect(page.getByRole('button',{name:'Mở rộng sidebar',exact:true})).toHaveAttribute('aria-expanded','false');
        await navigate(page,'Tài khoản');
        await expect(page.getByRole('heading',{name:'Tài khoản người dùng',exact:true})).toBeVisible();
        await page.screenshot({path:`${output}/admin-collapsed-${width}.png`});
        await page.getByRole('button',{name:'Mở rộng sidebar',exact:true}).click();
      }
      await navigate(page,'Catalog');
      await expect(page.getByRole('heading',{name:'Kiểm tra catalog CSV',exact:true})).toBeVisible();
      await navigate(page,'Lifecycle');
      await expect(page.getByRole('heading',{name:'Đặt lịch ngừng hoạt động',exact:true})).toBeVisible();
      const account=page.getByRole('button',{name:'Menu tài khoản',exact:true});
      await account.click();
      await expect(page.getByRole('menu')).toHaveCSS('background-color','rgb(255, 255, 255)');
      await page.keyboard.press('Escape'); await expect(account).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await page.getByRole('menuitem',{name:'Đổi mật khẩu',exact:true}).click();
      await expect(page.getByRole('dialog',{name:'Đổi mật khẩu',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Quay lại',exact:true}).click();
      await noOverflow(page);
      console.log(`PASS Admin fixture ${width}: junction, navigation, collapse/menu, password dialog`);
      await page.close(); assert.deepEqual(errors,[]);
    }
    for(const width of [1440,900,390]) {
      const page=await browser.newPage({viewport:{width,height:width===390?844:1024},serviceWorkers:'block'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      for(const route of ['home','kph','date','reports','notifications','shelf','login']) {
        await page.goto(`${storeBase}/#${route}`);
        await page.locator('.store-page-surface').waitFor();
        if(route==='reports') await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
        await page.evaluate(()=>document.fonts.ready);
        await noOverflow(page);
        if(width>=900 && route!=='login') {
          const rail=await page.locator('.store-desktop-rail').boundingBox();
          const header=await page.locator('.store-header').boundingBox();
          const brand=await page.locator('.store-sidebar-brand').boundingBox();
          assert.equal(rail.width,248);assert.equal(rail.x+rail.width,header.x);
          assert.equal(brand.y+brand.height,header.y+header.height);
          await expect(page.locator('.store-header')).toHaveCSS('background-image','linear-gradient(120deg, rgb(0, 95, 67), rgb(0, 122, 82) 58%, rgb(0, 128, 90))');
          await expect(page.locator('.store-header h1')).toHaveCSS('color','rgb(255, 255, 255)');
          await expect(page.locator('.store-header')).toHaveCSS('border-bottom-width','0px');
          await expect(page.locator('.store-desktop-rail')).toHaveCSS('border-right-width','0px');
          await expect(page.locator('.store-sidebar-brand')).toHaveCSS('border-bottom-width','0px');
          await expect(page.locator('.store-header-brand')).toBeHidden();
          await expect(page.locator('.store-sidebar-logo img')).toHaveAttribute('src','/brand/coopfood-logo-light.png');
          await expect(page.locator('.store-sidebar-logo img')).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
          assert.deepEqual(await page.locator('.store-desktop-rail [aria-current="page"]').evaluate(navPaint),desktopNavPaint,'Admin and Store paint the same navigation roles');
          if(route==='home') await expect(page.locator('.store-header-copy > div')).toHaveCSS('clip-path','none');
        }
        if(width===390 && ['home','kph'].includes(route)) {
          const baseline=`${output}/mobile-${route}-before.json`;
          if(fs.existsSync(baseline)) {
            const before=JSON.parse(fs.readFileSync(baseline));
            const after=await page.locator('.store-app').evaluate((el,keys)=>[el,...el.querySelectorAll('*')].map(e=>({tag:e.tagName,cls:e.className,css:keys.map(k=>getComputedStyle(e)[k])})),properties);
            assert.deepEqual(mobilePresentation(after),mobilePresentation(before),`Mobile ${route} computed styles unchanged except authorized logo replacement`);
          }
          await expect(page.locator('.store-header')).toHaveCSS('height','72px');
          await expect(page.locator('.store-header h1')).toHaveCSS('color','rgb(255, 255, 255)');
          await expect(page.locator('.store-mobile-toolbar')).toBeVisible();
          await expect(page.locator('.store-desktop-rail')).toBeHidden();
          if(route==='home') await expect(page.locator('.store-header-brand img')).toHaveAttribute('src','/brand/coopfood-logo-dark.png');
        }
        await page.screenshot({path:`${output}/store-${route}-after-${width}.png`});
      }
      await page.goto(`${storeBase}/#home`);
      const account=page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true});
      await account.click();await expect(page.getByRole('dialog',{name:'Tài khoản',exact:true})).toBeVisible();
      await page.keyboard.press('Escape');await expect(account).toBeFocused();
      await page.close();assert.deepEqual(errors,[]);
      console.log(`PASS Store ${width}: seven routes, account focus, mobile baseline / desktop chrome`);
    }
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
