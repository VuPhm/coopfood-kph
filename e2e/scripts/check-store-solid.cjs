// One Store screen, shared material roles and operationally sized controls.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4362';
const output = process.env.STORE_SOLID_OUTPUT || '.local/fresh01/solid';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
const viewports = [{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:900,height:650},{width:844,height:390}];
async function settle(page) {
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))); });
}
async function bounds(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  for (const dialog of await page.getByRole('dialog').all()) {
    const b=await dialog.boundingBox(); expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.y).toBeGreaterThanOrEqual(-1);
    expect(b.x+b.width).toBeLessThanOrEqual(page.viewportSize().width+1);expect(b.y+b.height).toBeLessThanOrEqual(page.viewportSize().height+1);
    expect(await dialog.evaluate(n => n.scrollWidth <= n.clientWidth+1)).toBe(true);
  }
}
(async () => {
  const browser = await chromium.launch(), results=[];
  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce',timezoneId:'Asia/Ho_Chi_Minh'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
      for (const route of ['home','kph','date','reports','shelf','notifications','login']) {
        await page.goto(`${base}/#${route}`);await expect(page.locator('.store-header')).toBeVisible();
        if(route==='kph')await expect(page.locator('.store-kph:not(.kph-loading-frame) [data-record-id]').first()).toBeVisible();
        if(route==='reports')await expect(page.locator('.report-type-card').first()).toBeVisible();
        await settle(page);await bounds(page);
        await expect(page.locator('html')).not.toHaveAttribute('data-store-density', /.+/);
        const palette=await page.locator('body').evaluate(n=>{const s=getComputedStyle(n);return {brand:s.getPropertyValue('--store-brand-action').trim(),well:s.getPropertyValue('--store-canvas').trim(),edge:s.getPropertyValue('--store-soft-edge').trim()}});
        expect(palette.brand).toBe('#007a52');expect(palette.well).toBe('#f2f5f3');
        await audit(page,route==='login'?'.store-login':'.store-app',`${route}-${viewport.width}`);
        if(route==='home') {
          const cards=await page.locator('.store-module').evaluateAll(ns=>ns.map(n=>{const s=getComputedStyle(n),i=getComputedStyle(n.querySelector('.store-module-icon'));return{bg:s.backgroundColor,shadow:s.boxShadow,icon:i.backgroundColor}}));
          expect(new Set(cards.map(c=>c.bg))).toEqual(new Set(['rgb(255, 255, 255)']));expect(cards.every(c=>c.shadow!=='none')).toBe(true);
          expect(new Set(cards.map(c=>c.icon))).toEqual(new Set(['rgb(0, 122, 82)','rgb(196, 81, 8)']));
        }
        if(route==='kph'||route==='date') {
          if(route==='date')await page.getByRole('group',{name:'Loại thực phẩm'}).getByRole('button',{name:/TP khô/}).click();
          const row=page.locator(route==='kph'?'[data-record-id]':'[data-date-lot-id]').first();
          const tag=row.locator(route==='kph'?'[data-label-kind=resolution]':'[data-processing-status]');
          await expect(tag).toHaveCSS('border-top-width','1px');expect(await tag.evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe('rgba(0, 0, 0, 0)');
          const filter=page.getByRole('button',{name:route==='kph'?'Lọc phiếu KPH':'Lọc DATE',exact:true});const b=await filter.boundingBox();expect(b.width).toBeGreaterThanOrEqual(32);expect(b.height).toBeGreaterThanOrEqual(32);
          await filter.click();await bounds(page);await page.keyboard.press('Escape');await expect(filter).toBeFocused();
          if(route==='kph'&&viewport.width<900){
            await expect(row.locator('.store-ticket-tags [data-label-kind]')).toHaveCount(2);
            await page.emulateMedia({media:'print'});await expect(row.locator('.store-ticket-tags [data-label-kind]')).toHaveCount(3);
            await page.emulateMedia({media:'screen'});await expect(row.locator('.store-ticket-tags [data-label-kind]')).toHaveCount(2);
          }
        }
        await page.screenshot({path:`${output}/${route}-${viewport.width}.png`});
        if(route!=='login'){
          const trigger=page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true});await trigger.click();
          await expect(page.getByRole('switch',{name:'Chế độ gọn'})).toHaveCount(0);await bounds(page);
          await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
        }
        results.push({viewport,route,palette,oneScreen:true});
      }
      expect(errors).toEqual([]);await page.close();console.log(`PASS solid Store ${viewport.width}: seven routes, shared palette, cards/tags, focus, print, no mode or overflow`);
    }
    // Old stored choices must neither change the UI nor be rewritten by UI code.
    for(const stored of [null,'comfortable','compact','invalid']){
      const p=await browser.newPage({viewport:viewports[0],serviceWorkers:'block'});
      await p.addInitScript(value=>{if(value!==null)localStorage.setItem('coopfood.store-ui.density.v1',value)},stored);
      await p.goto(base+'/#kph');await expect(p.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
      const cta=p.getByRole('button',{name:'Tạo phiếu TP khô & khác',exact:true});await expect(cta).toHaveText('Tạo TPCN');
      await expect(p.getByRole('button',{name:/Sắp xếp phiếu:/})).toHaveCount(0);
      expect(await p.evaluate(()=>localStorage.getItem('coopfood.store-ui.density.v1'))).toBe(stored);await p.close();
    }
    fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
