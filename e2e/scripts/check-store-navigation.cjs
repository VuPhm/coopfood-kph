const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4231';
const output = '.local/navigation'; fs.mkdirSync(output, { recursive: true });
const { audit } = require('./check-kph-colors.cjs');
async function hit(locator) {
  expect(await locator.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)); })).toBe(true);
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:740},{width:768,height:1024},{width:844,height:390}]) {
      const page = await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/#home`);await page.locator('.store-launcher-grid').waitFor();
      await expect(page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true})).toBeEnabled();
      await page.evaluate(()=>document.fonts.ready);
      const mobile=viewport.width<900;
      const nav=page.locator(mobile?'.store-mobile-toolbar':'.store-desktop-rail');
      const tabs=page.locator('.store-mobile-toolbar');
      await expect(nav).toBeVisible();
      await expect(page.locator(mobile?'.store-desktop-rail':'.store-mobile-toolbar')).toBeHidden();
      await expect(page.locator('.store-launcher-grid button')).toHaveCount(4);
      for(const name of ['Quản lý DATE','KPH','Báo cáo','Tra cứu lùi hàng']) await expect(page.locator('.store-launcher-grid').getByRole('button',{name,exact:true})).toBeVisible();
      if(mobile){
        await expect(tabs.getByRole('link')).toHaveCount(3);
        const surface=await tabs.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,backdrop:s.backdropFilter,webkitBackdrop:s.webkitBackdropFilter||'none',filter:s.filter,opacity:s.opacity}});
        expect(surface).toEqual({background:'rgb(249, 253, 251)',backdrop:'none',webkitBackdrop:'none',filter:'none',opacity:'1'});
        await expect(tabs.locator('[data-recent-feature]')).toHaveText('Tính năng');
        const r=await tabs.boundingBox();expect(r.height).toBe(64);expect(r.x).toBeGreaterThanOrEqual(12);expect(r.x+r.width).toBeLessThanOrEqual(viewport.width-12);expect(r.y+r.height).toBe(viewport.height-12);
      }else{
        expect((await nav.boundingBox()).width).toBe(248);
        await expect(nav.getByRole('link')).toHaveCount(7);
        const features=nav.getByRole('navigation',{name:'Tính năng cửa hàng',exact:true});
        await expect(features.getByRole('link')).toHaveCount(4);
        await expect(features.getByRole('link')).toHaveText(['Quản lý DATE','KPH','Báo cáo','Tra hạn lùi']);
        for(const name of ['Trang chủ','Thông báo','Quản lý DATE','KPH','Báo cáo','Tra hạn lùi']) await expect(nav.getByRole('link',{name,exact:true})).toBeVisible();
      }
      await audit(page,'.store-home-features, .store-home-attention, .store-mobile-toolbar, .store-desktop-rail',`navigation-home-${viewport.width}`);
      await page.screenshot({path:`${output}/home-${viewport.width}.png`});
      const fab=page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng',exact:true});
      await expect(fab).toBeVisible();await hit(fab);
      await page.locator('.store-launcher-grid').getByRole('button',{name:'Báo cáo',exact:true}).click();
      await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
      if(mobile){await expect(tabs.locator('[data-recent-feature]')).toHaveText('Báo cáo');await expect(tabs.locator('[data-recent-feature]')).toHaveAttribute('aria-current','page');}
      await fab.click();const quick=page.getByRole('dialog',{name:'Tra cứu lùi hàng nhanh',exact:true});await expect(quick).toBeVisible();await expect(tabs).toBeHidden();
      await quick.getByRole('switch').click();await quick.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true}).fill('31/10/2026');await quick.getByRole('textbox',{name:'HSD (Số ngày)',exact:true}).fill('10');
      await expect(quick.getByRole('region',{name:'Kết quả tra hạn lùi'})).not.toHaveAttribute('data-status','EMPTY');await page.keyboard.press('Escape');await expect(fab).toBeFocused();
      await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await page.locator('.report-composer').waitFor();
      const dock=page.getByRole('region',{name:'Thao tác báo cáo',exact:true});
      await expect(dock).toBeVisible();
      if(await dock.getAttribute('data-floating')==='true'){
        await expect.poll(async()=>{const f=await fab.boundingBox(),d=await dock.boundingBox();return d.y-(f.y+f.height)}).toBeGreaterThanOrEqual(8);
      }
      await hit(fab);
      await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
      const toast=page.locator('.pwa-status-toast');await expect(toast).toBeVisible();
      const t=await toast.boundingBox(),f=await fab.boundingBox();
      expect(t.y+t.height).toBeLessThanOrEqual(f.y-8);expect(t.y).toBeGreaterThanOrEqual(0);
      await toast.getByRole('button',{name:'Đóng thông báo PWA',exact:true}).click();await page.evaluate(()=>window.dispatchEvent(new Event('online')));
      await page.screenshot({path:`${output}/reports-${viewport.width}.png`});
      await fab.click();await expect(quick.getByRole('textbox',{name:'HSD (Số ngày)',exact:true})).toHaveValue('10');await page.keyboard.press('Escape');
      await nav.getByRole('link',{name:'Thông báo',exact:true}).click();await expect(page.getByRole('heading',{name:'Chưa có thông báo',exact:true})).toBeVisible();
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      if(mobile)await expect(tabs.locator('[data-recent-feature]')).toHaveAttribute('data-recent-feature','reports');
      await expect(fab).toBeVisible();await hit(fab);await page.screenshot({path:`${output}/notifications-${viewport.width}.png`});
      await page.reload();await expect(page.getByRole('heading',{name:'Chưa có thông báo',exact:true})).toBeVisible();
      if(mobile)await expect(tabs.locator('[data-recent-feature]')).toHaveAttribute('data-recent-feature','reports');
      await nav.getByRole('link',{name:'Trang chủ',exact:true}).click();await page.locator('.store-launcher-grid').waitFor();
      await page.locator('.store-launcher-grid').getByRole('button',{name:'Quản lý DATE',exact:true}).click();await page.locator('.store-date-search-form').waitFor();
      if(mobile){await expect(tabs.locator('[data-recent-feature]')).toHaveAttribute('data-recent-feature','date');await nav.getByRole('link',{name:'Trang chủ',exact:true}).click();await page.locator('.store-launcher-grid').waitFor();await tabs.getByRole('link',{name:'DATE',exact:true}).click();await page.locator('.store-date-search-form').waitFor();}
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      if(mobile){
        await page.locator('.store-mobile-toolbar a').evaluateAll(nodes=>nodes.forEach(el=>{el.style.fontSize='16.5px';el.style.lineHeight='24px'}));
        for(const link of await tabs.getByRole('link').all()){const r=await link.boundingBox();expect(r.height).toBeGreaterThanOrEqual(44);expect(r.width).toBeGreaterThanOrEqual(44);await link.focus();await hit(link);}
      }
      await page.screenshot({path:`${output}/date-${viewport.width}.png`});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      expect(errors).toEqual([]);console.log(`PASS navigation ${viewport.width}x${viewport.height}: all Home features, sidebar/three tabs, recent/reload, empty notifications, quick utility/dock/focus`);
      await page.close();
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
