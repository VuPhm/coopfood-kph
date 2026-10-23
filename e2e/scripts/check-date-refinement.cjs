// DATE02: inclusive remaining ratio, semantic color and soft lot details. Synthetic fixtures only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4277';
const output = process.env.STORE_DATE_OUTPUT || '.local/date02/refinement';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
const cases = [
  ['2026-07-31', '100', 'info', 'BEFORE_NSX'],
  ['2026-08-01', '100', 'success', 'SAFE'],
  ['2026-10-07', '38', 'warning', 'WARNING'],
  ['2026-10-25', '21', 'warning', 'DANGER'],
  ['2026-11-15', '1', 'warning', 'DANGER'],
  ['2026-11-16', '0', 'danger', 'EXPIRED'],
];
async function noClip(scope) {
  expect(await scope.evaluate(root => [...root.querySelectorAll('h2,h3,p,dd,button,strong')].filter(el => {
    if (el.closest('.sr-only,[aria-hidden="true"]')) return false;
    const r=el.getBoundingClientRect();return r.width && el.textContent.trim() && el.scrollWidth>el.clientWidth+1;
  }).map(el => `${el.tagName}.${el.className}`))).toEqual([]);
}
(async()=>{
  const browser=await chromium.launch();const results=[];
  try {
    for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]) {
      for(const [date,percent,tone,phase] of cases) {
        const page=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});
        const errors=[];page.on('pageerror',e=>errors.push(e.message));
        await page.clock.setFixedTime(new Date(`${date}T05:00:00+07:00`));
        await page.goto(`${base}/#date`);
        const input=page.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'});
        await input.fill('A24-301');
        const lot=page.locator('.store-date-lot');const badge=lot.locator('.store-date-percent');
        await expect(badge).toHaveText(`Còn ${percent}% HSD`);
        await expect(badge).toHaveAttribute('data-tone',tone);
        await expect(lot.locator('[data-date-phase]')).toHaveAttribute('data-date-phase',phase);
        await expect(lot).not.toContainText(/Quá \d+ ngày/);
        await noClip(lot);
        await audit(page,'.store-date',`list-${phase}-${viewport.width}`);
        if(phase==='WARNING') {
          await lot.evaluate(root=>{const styles=[root,...root.querySelectorAll('*')].map(el=>{const s=getComputedStyle(el);return{el,font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)}});for(const{el,font,line}of styles){el.style.fontSize=`${font*1.5}px`;if(Number.isFinite(line))el.style.lineHeight=`${line*1.5}px`;}});
          await noClip(lot);
          expect(await lot.evaluate(root=>root.scrollWidth<=root.clientWidth+1)).toBe(true);
          await page.screenshot({path:`${output}/list-text150-${viewport.width}.png`,fullPage:true});
          await lot.evaluate(root=>{for(const el of [root,...root.querySelectorAll('*')]){el.style.removeProperty('font-size');el.style.removeProperty('line-height');}});
        }
        await lot.click();
        const detail=viewport.width>=900?page.getByRole('region',{name:'Chi tiết lô DATE'}):page.getByRole('dialog',{name:'Chi tiết lô DATE'});
        await detail.evaluate(async root=>{await Promise.all(root.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});
        await expect(detail.locator('.store-date-detail-metrics .store-date-percent strong')).toHaveText(`${percent}%`);
        const material=await detail.locator('.store-date-milestones').evaluate(el=>{const s=getComputedStyle(el);return {edge:s.borderTopColor,width:s.borderTopWidth,bg:s.backgroundColor,filter:s.backdropFilter}});
        expect(material).toEqual({edge:'rgb(223, 229, 233)',width:'1px',bg:'rgb(255, 255, 255)',filter:'none'});
        expect(await detail.locator('.store-date-lot-heading').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(255, 255, 255)');
        expect(await detail.locator('.store-date-detail-metrics > p').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor))).toEqual(['rgb(245, 248, 250)','rgb(245, 248, 250)']);
        expect(await detail.evaluate(root=>[root,...root.querySelectorAll('*')].filter(el=>getComputedStyle(el).backdropFilter!=='none').length)).toBe(0);
        for(const name of ['Ghi nhận','Đã xử lý']) {
          const box=await detail.getByRole('button',{name,exact:true}).boundingBox();
          expect(box.height).toBeGreaterThanOrEqual(48);expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
        }
        await noClip(detail);
        await audit(page,viewport.width>=900?'.store-date-detail':'.store-date-lot-sheet',`detail-${phase}-${viewport.width}`);
        await page.screenshot({path:`${output}/${phase}-${viewport.width}.png`,fullPage:true});
        if(phase==='WARNING') {
          await detail.evaluate(root=>{const styles=[...root.querySelectorAll('*')].map(el=>{const s=getComputedStyle(el);return{el,font:parseFloat(s.fontSize),line:parseFloat(s.lineHeight)}});for(const{el,font,line}of styles){el.style.fontSize=`${font*1.5}px`;if(Number.isFinite(line))el.style.lineHeight=`${line*1.5}px`;}});
          await noClip(detail);
          expect(await detail.evaluate(root=>root.scrollWidth<=root.clientWidth+1)).toBe(true);
          const action=detail.getByRole('button',{name:'Đã xử lý',exact:true});await action.focus();
          const box=await action.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(viewport.height+1);
          await page.screenshot({path:`${output}/text150-${viewport.width}.png`,fullPage:true});
        }
        if(phase==='EXPIRED') {
          await detail.getByRole('button',{name:'Đã xử lý',exact:true}).click();
          await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','resolved');
          await expect(badge).toHaveText('Còn 0% HSD');await expect(badge).toHaveAttribute('data-tone','danger');
        } else if(viewport.width<900) {
          await page.keyboard.press('Escape');await expect(detail).toBeHidden();await expect(lot).toBeFocused();
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        expect(errors).toEqual([]);results.push({viewport,date,percent,tone,phase});await page.close();
      }
      const page=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});
      await page.clock.setFixedTime(new Date('2026-11-16T05:00:00+07:00'));await page.goto(`${base}/#date`);
      await page.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('D24-090');
      const lot=page.locator('.store-date-lot');await expect(lot.locator('.store-date-percent')).toHaveText('Chưa đủ dữ liệu');await lot.click();
      const detail=viewport.width>=900?page.getByRole('region',{name:'Chi tiết lô DATE'}):page.getByRole('dialog',{name:'Chi tiết lô DATE'});
      await expect(detail.locator('.store-date-percent')).toHaveText('HSD còn lạiChưa đủ dữ liệu');await expect(detail.locator('.store-timeline')).toHaveCount(0);
      await expect(detail).toContainText('Thiếu NSX');await noClip(detail);
      await page.screenshot({path:`${output}/missing-${viewport.width}.png`,fullPage:true});await page.close();
      console.log(`PASS DATE refinement ${viewport.width}: ratio/tone/phase, quiet holders, contrast, text150, focus/CTA, missing NSX and independent processing`);
    }
    const short=await browser.newPage({viewport:{width:390,height:568},serviceWorkers:'block',reducedMotion:'reduce'});
    await short.clock.setFixedTime(new Date('2026-10-07T05:00:00+07:00'));await short.goto(`${base}/#date`);
    await short.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('A24-255');await short.locator('.store-date-lot').click();
    const sheet=short.getByRole('dialog',{name:'Chi tiết lô DATE'});
    for(const name of ['Ghi nhận','Đã xử lý']) {
      const button=sheet.getByRole('button',{name,exact:true});await button.focus();await expect(button).toBeFocused();
      const box=await button.boundingBox();expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(568);
    }
    await sheet.locator('.store-modal-body').evaluate(el=>el.scrollTop=el.scrollHeight);
    await noClip(sheet);await short.screenshot({path:`${output}/short-390.png`});await short.close();
    console.log('PASS DATE short viewport 390x568: content scroll, visible actions and keyboard focus');
    fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
