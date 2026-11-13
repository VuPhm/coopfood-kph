// Run against Store online 4173 and Admin 4175. Admin session is a synthetic route fixture.
const { chromium, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');
const out = '.local/verification/fresh-restore'; mkdirSync(out, { recursive: true });
async function store(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4173');
  await page.getByLabel('Tên đăng nhập', { exact: true }).fill('region.admin03');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await page.getByRole('button', { name: /001.*Cửa hàng An Phú mẫu/ }).click();
  await expect(page.locator('.store-page-hero')).toBeVisible(); return page;
}
async function admin(browser, width) {
  const page = await browser.newPage({ viewport: { width, height: 844 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
  await page.route('**/api/v1/**', route => route.request().url().includes('/auth/session')
    ? route.fulfill({ json: { user: { id: 'demo', username: 'demo', displayName: 'Demo User', globalRoles: ['CHAIN_ADMIN'], stores: [] }, csrfToken: 'synthetic' } })
    : route.fulfill({ status: 403, json: {} }));
  await page.goto('http://127.0.0.1:4175'); await expect(page.locator('.admin-shell')).toBeVisible(); return page;
}
async function metrics(locator) { return locator.evaluate(e => { const r=e.getBoundingClientRect(), s=getComputedStyle(e); return { x:r.x,y:r.y,width:r.width,height:r.height,font:s.fontSize,weight:s.fontWeight,color:s.color,background:s.backgroundColor,image:s.backgroundImage,radius:s.borderRadius }; }); }
(async()=>{ const browser=await chromium.launch(); try {
  for (const width of [1440,900,834,390]) {
    const s=await store(browser,width), a=await admin(browser,width);
    if(width>=900) {
      expect(await s.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true); expect(await a.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      const sm=await metrics(s.locator('.store-desktop-rail nav a').first()), am=await metrics(a.locator('.admin-sidebar .admin-nav-item').first());
      expect(sm).toEqual(am); await expect(s.locator('.store-desktop-rail')).toBeVisible(); await expect(a.locator('.admin-sidebar')).toBeVisible();
      await s.evaluate(()=>window.scrollTo(0,250)); await s.waitForTimeout(100);
      const scroll=await s.evaluate(()=>({ y:scrollY, hero:document.querySelector('.store-page-hero').getBoundingClientRect().top, rail:document.querySelector('.store-desktop-rail').getBoundingClientRect().top, position:getComputedStyle(document.querySelector('.store-page-hero')).position, header:getComputedStyle(document.querySelector('.store-header')).backgroundImage }));
      expect(scroll.y).toBeGreaterThan(0); expect(scroll.hero).toBe(-scroll.y); expect(scroll.rail).toBe(0); expect(scroll.position).toBe('static'); expect(scroll.header).toContain('gradient'); console.log(width,sm,scroll);
      await a.getByRole('button',{name:'Thu gọn sidebar'}).click(); await expect(a.getByRole('button',{name:'Mở rộng sidebar'})).toBeVisible(); await a.getByRole('button',{name:'Mở rộng sidebar'}).click();
    } else {
      await expect(s.locator('.store-mobile-toolbar')).toBeVisible(); await expect(a.locator('.admin-sidebar')).toBeHidden(); await a.getByRole('button',{name:'Mở điều hướng'}).click(); await expect(a.getByRole('dialog')).toBeVisible();
      await s.evaluate(()=>window.scrollTo(0,200)); await s.waitForTimeout(100);
      const scroll=await s.evaluate(()=>({y:scrollY, hero:document.querySelector('.store-page-hero').getBoundingClientRect().top, position:getComputedStyle(document.querySelector('.store-page-hero')).position}));
      expect(scroll.y).toBeGreaterThan(0); expect(scroll.hero).toBe(0); expect(scroll.position).toBe('sticky'); console.log(width,scroll);
    }
    await s.screenshot({path:`${out}/store-chrome-${width}.png`}); await a.screenshot({path:`${out}/admin-chrome-${width}.png`}); await s.close(); await a.close();
  }
  const forced = await browser.newPage({viewport:{width:1440,height:844},forcedColors:'active',reducedMotion:'reduce',serviceWorkers:'block'});
  await forced.goto('http://127.0.0.1:4173'); await forced.getByLabel('Tên đăng nhập',{exact:true}).fill('region.admin03'); await forced.getByLabel('Mật khẩu',{exact:true}).fill('admin-e2e-password'); await forced.getByRole('button',{name:'Đăng nhập',exact:true}).click(); await forced.getByRole('button',{name:/001.*Cửa hàng An Phú mẫu/}).click(); await expect(forced.locator('.store-desktop-rail nav a[aria-current=page]')).toBeVisible(); await forced.screenshot({path:`${out}/store-chrome-forced-colors.png`}); await forced.close();
 } finally {await browser.close();} })().catch(e=>{console.error(e);process.exitCode=1});
