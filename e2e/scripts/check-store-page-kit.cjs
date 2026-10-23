const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4232';
const output='.local/store-page-kit';fs.mkdirSync(output,{recursive:true});
const {audit}=require('./check-kph-colors.cjs');
const routes=['home','shelf','date','kph','reports','notifications','login'];
async function bounds(l){const r=await l.boundingBox();expect(r).not.toBeNull();return r;}
(async()=>{const browser=await chromium.launch();try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:1920,height:1080},{width:2560,height:1440},{width:320,height:740},{width:768,height:1024},{width:844,height:390}]){
  const page=await browser.newPage({viewport,reducedMotion:'reduce',serviceWorkers:'block'});page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));let accountAnchor,backAnchor;
  for(const route of routes){
   await page.goto(`${base}/#${route}`);
   // Measure the loaded report frame, not the transient feature placeholder.
   // Slow/failed chunk behavior has its own deferred-loading gate.
   if(route==='reports')await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
   await expect(page.locator('.store-page-layout')).toHaveCount(1);await expect(page.locator('.store-header')).toHaveCount(1);
   if(route!=='login')await expect(page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true})).toBeEnabled();
   await page.evaluate(()=>document.fonts.ready);
   const layout=page.locator('.store-page-layout'),hero=page.locator('.store-page-hero'),surface=page.locator('.store-page-surface');
   const l=await bounds(layout),h=await bounds(hero),s=await bounds(surface),bar=await bounds(page.locator('.store-appbar-row'));
   expect(h.x).toBe(l.x);expect(h.width).toBe(l.width);expect(s.x).toBe(l.x);expect(s.width).toBe(l.width);
   expect(h.y).toBe(0);expect(h.y+h.height-s.y).toBe(12);expect(bar.y).toBe(14);expect(bar.height).toBe(44);
   const header=page.locator('.store-header');expect((await bounds(header)).height).toBe(72);
   await expect(header.locator('h1')).toHaveCSS('font-size','20px');await expect(header.locator('h1')).toHaveCSS('line-height','26px');
   await expect(hero).toHaveCSS('background-image','linear-gradient(115deg, rgb(0, 107, 75), rgb(0, 122, 82))');
   await expect(surface).toHaveCSS('background-color','rgb(255, 255, 255)');await expect(surface).toHaveCSS('border-top-left-radius','24px');
   if(route!=='login'){
    const a=await bounds(page.locator('.store-account'));expect(a.x+a.width).toBe(bar.x+bar.width);expect(a.y).toBe(bar.y);
    if(accountAnchor)expect(a).toEqual(accountAnchor);else accountAnchor=a;
    if(route!=='home'){const b=await bounds(page.locator('.store-back'));expect(b.x).toBe(bar.x);expect(b.y).toBe(bar.y);if(backAnchor)expect(b).toEqual(backAnchor);else backAnchor=b;}
   }else{await expect(page.locator('.store-account,.store-desktop-rail,.store-mobile-toolbar')).toHaveCount(0);}
   await audit(page,'.store-header',`page-kit-${route}-${viewport.width}`);
   if([390,1920].includes(viewport.width))await page.screenshot({path:`${output}/${route}-${viewport.width}.png`});
   await page.evaluate(()=>scrollTo(0,200));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(0);
   const scrolled=await bounds(hero);expect(scrolled.y).toBe(0);expect(scrolled.x).toBe(l.x);expect(scrolled.width).toBe(l.width);
   if([390,1440].includes(viewport.width)){
    await page.locator('.store-header h1').evaluate(el=>{el.style.fontSize='30px';el.style.lineHeight='39px'});
    await page.locator('.store-header p').evaluate(el=>{el.style.fontSize='18px';el.style.lineHeight='24px'});
    const large=await bounds(page.locator('.store-header-account')),leading=await bounds(page.locator('.store-header-brand,.store-back'));
    expect(large.y).toBe(leading.y);expect(large.x).toBeGreaterThan(leading.x+leading.width);
    expect(await page.locator('.store-header h1').getAttribute('title')).toBe(await page.locator('.store-header h1').textContent());
   }
   await page.locator('.store-header').evaluate(el=>el.querySelector('button')?.focus());
   if(route!=='login')await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.goto(`${base}/#reports`);await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
  await expect(page.locator('.store-header h1')).toHaveText('Báo cáo tổng hợp');await expect(page.locator('.store-page-layout')).toHaveCount(1);
  const a=await bounds(page.locator('.store-account'));expect(a).toEqual(accountAnchor);
  await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
  await page.goto(`${base}/#home`);
  const account=page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true});await account.click();await expect(page.getByRole('dialog',{name:'Tài khoản',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(account).toBeFocused();
  await page.getByRole('link',{name:'Đến nội dung',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('.store-page-surface')).toBeFocused();
  await page.goto(`${base}/#login`);await page.getByLabel('Tên đăng nhập',{exact:true}).fill('sample');await page.getByLabel('Mật khẩu',{exact:true}).fill('sample-password');
  await page.getByRole('button',{name:'Hiện mật khẩu',exact:true}).click();await expect(page.getByLabel('Mật khẩu',{exact:true})).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'Vào bản dùng thử',exact:true}).click();await expect(page).toHaveURL(/#home$/);
  expect(errors).toEqual([]);console.log(`PASS page kit ${viewport.width}x${viewport.height}: seven routes, identical bar/green/surface, anchors, scroll/focus, report and login`);await page.close();
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
