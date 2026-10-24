// Verify the role/state recipe against the integrated 816b4e3 + accepted-form base.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4304';
const baseline = process.env.STORE_BASELINE_URL || 'http://127.0.0.1:4303';
const output = process.env.STORE_COMPONENT_OUTPUT || '.local/form01/r3-components';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
const rgb = s => s.match(/[\d.]+/g).map(Number);
const lum = c => c.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((s,x,i)=>s+x*[.2126,.7152,.0722][i],0);
const ratio = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
async function paint(el) { return el.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{w:r.width,h:r.height,edge:s.borderTopColor,fill:s.backgroundColor,color:s.color,outline:s.outlineColor,outlineWidth:parseFloat(s.outlineWidth),shadow:s.boxShadow};}); }
async function quiet(el) {
  await expect(el).toBeVisible();
  await expect.poll(async()=>rgb((await paint(el)).edge)[3]??1).toBeLessThanOrEqual(.1);
}
async function strong(el) {
  await expect.poll(async()=>{const s=await paint(el);const edge=rgb(s.edge),fill=rgb(s.fill),a=edge[3]??1;return ratio(edge.slice(0,3).map((v,i)=>v*a+fill[i]*(1-a)),[255,255,255]);}).toBeGreaterThanOrEqual(3);
}
async function parity(now, old) {
  const [a,b]=await Promise.all([paint(now),paint(old)]);
  expect(Math.abs(a.w-b.w)).toBeLessThanOrEqual(1);expect(Math.abs(a.h-b.h)).toBeLessThanOrEqual(1);
  return {w:a.w,h:a.h};
}
async function ready(p, url, route) {
  await p.goto(`${url}/#${route}`);await expect(p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true})).toBeEnabled();
  if(route==='kph') await expect(p.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
  if(route==='reports') await expect(p.locator('.report-type-card').first()).toBeVisible();
  await p.evaluate(()=>document.fonts.ready);
}
async function colors(scope) {
 return scope.evaluateAll(roots=>roots.flatMap(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[null,'::before','::after'].map(pseudo=>{const s=getComputedStyle(el,pseudo);return{tag:el.tagName,cls:el.className,pseudo,color:s.color,fill:s.backgroundColor,image:s.backgroundImage,edge:s.borderColor,radius:s.borderRadius,shadow:s.boxShadow};}))));
}
async function settle(p) {await p.locator('body').evaluate(async root=>Promise.all(root.getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))));}
async function fits(p) { expect(await p.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true); }
(async()=>{
 const browser=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const results=[];
 try {
  for(const viewport of[{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:375,height:812},{width:844,height:390}]){
   const p=await browser.newPage({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
   const old=await browser.newPage({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));await old.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
   await ready(p,base,'kph');await ready(old,baseline,'kph');
   const dimensions=[];
   for(const selector of['.store-quick-sort-trigger','.store-compact','.store-filter','.store-kph-more button']){
    const el=p.locator(selector).first();dimensions.push({selector,...await parity(el,old.locator(selector).first())});
    await quiet(el);const s=await paint(el);expect(s.w).toBeGreaterThanOrEqual(44);expect(s.h).toBeGreaterThanOrEqual(44);
   }
   const select=p.locator('.store-compact');await select.click();await expect(select).toHaveAttribute('aria-pressed','true');await strong(select);
   await select.click();await expect(select).toHaveAttribute('aria-pressed','false');await quiet(select);
   await p.keyboard.press('Tab');await select.focus();const focus=await paint(select);expect(focus.outlineWidth).toBeGreaterThanOrEqual(2);expect(ratio(rgb(focus.outline),[255,255,255])).toBeGreaterThanOrEqual(3);
   await p.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
   const filter=p.getByRole('dialog');await quiet(filter.locator('.store-kph-filter-section').first());
   const pending=filter.getByRole('group',{name:'Trạng thái duyệt',exact:true}).getByRole('button',{name:'Chờ duyệt',exact:true});
   await quiet(pending);await pending.hover();await quiet(pending);await pending.click();await expect(pending).toHaveAttribute('aria-pressed','true');await strong(pending);expect((await paint(pending)).shadow).toBe('none');
   await audit(p,'.store-kph-sheet',`filter-${viewport.width}`);
   await p.screenshot({path:`${output}/filter-${viewport.width}.png`});
   await filter.getByRole('button',{name:'Đặt lại bộ lọc',exact:true}).click();await p.keyboard.press('Escape');
   await p.locator('.store-quick-sort-trigger').click();await quiet(p.locator('.store-quick-sort-popup'));await p.keyboard.press('Escape');
   await expect(p.locator('.store-quick-sort-trigger')).toBeFocused();
   // Notification group expansion remains native and each row still opens its lot.
   await ready(p,base,'notifications');const section=p.locator('.store-notification-section').first();await quiet(section);
   const wasOpen=await section.getAttribute('open');await section.locator('summary').click();expect(await section.getAttribute('open')).not.toBe(wasOpen);await section.locator('summary').click();
   if(wasOpen===null)await section.locator('summary').click();
   await section.locator('.store-notification-item').first().click();await expect(p).toHaveURL(/#date$/);
   // Report settings and choice rows share the recipe without changing geometry.
   await ready(p,base,'reports');await ready(old,baseline,'reports');
   await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await old.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
   await quiet(p.locator('.store-settings-group').first());await parity(p.locator('.store-settings-group').first(),old.locator('.store-settings-group').first());
   await p.getByRole('button',{name:/Đổi mẫu/}).click();await old.getByRole('button',{name:/Đổi mẫu/}).click();
   const picker=p.getByRole('dialog'),oldPicker=old.getByRole('dialog');
   await quiet(picker.locator('.store-choice-cancel'));await parity(picker.locator('.store-choice-cancel'),oldPicker.locator('.store-choice-cancel'));
   const row=picker.locator('.store-choice-option').filter({has:p.locator('input:not(:checked)')}).first();
   await quiet(row);const radio=picker.getByRole('radio',{name:await row.locator('input').getAttribute('aria-label'),exact:true});
   await row.click();await expect(radio).toBeChecked();await picker.locator('.store-choice-cancel').click();await oldPicker.locator('.store-choice-cancel').click();
   await p.screenshot({path:`${output}/reports-${viewport.width}.png`});
   await audit(p,'.report-composer',`composer-${viewport.width}`);await fits(p);
   await p.getByRole('button',{name:'Tùy chọn chọn lô',exact:true}).click();await quiet(p.locator('.ui-dropdown-surface.store-dropdown'));await p.keyboard.press('Escape');
   if([390,1440,320].includes(viewport.width)){
    for(const page of[p,old]){await page.getByRole('button',{name:'Chi tiết lô A24-301',exact:true}).click();await expect(page.locator('.date-report-sheet .store-timeline')).toBeVisible();await settle(page);}
    expect(await colors(p.locator('.date-report-sheet .store-timeline'))).toEqual(await colors(old.locator('.date-report-sheet .store-timeline')));
    for(const page of[p,old]){await page.keyboard.press('Escape');await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();await page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();await expect(page.locator('.date-report.is-document')).toBeVisible();await page.emulateMedia({media:'print'});await expect(page.locator('.date-report.is-document')).toHaveAttribute('data-printing','true');await settle(page);}
    expect(await colors(p.locator('.date-report.is-document'))).toEqual(await colors(old.locator('.date-report.is-document')));
    await p.emulateMedia({media:'screen'});await old.emulateMedia({media:'screen'});
    await p.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
    // Radix hides the background from AT while the listbox is open; keep a stable DOM locator for its paint.
    const month=p.locator('.ui-select-trigger[aria-label="Tháng chốt báo cáo"]');await quiet(month);await month.click();await expect(month).toHaveAttribute('data-state','open');await strong(month);await quiet(p.locator('.ui-dropdown-surface.store-dropdown'));await p.keyboard.press('Escape');await expect(month).toBeFocused();
   }
   // Strong fallback boundaries remain available without relying on decoration.
   await p.emulateMedia({contrast:'more'});await ready(p,base,'kph');await strong(p.locator('.store-compact'));
   await p.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();await strong(p.getByRole('dialog').locator('.store-kph-filter-section').first());
   await p.keyboard.press('Escape');await p.emulateMedia({contrast:'no-preference',forcedColors:'active'});await strong(p.locator('.store-filter'));
   await fits(p);expect(errors).toEqual([]);results.push({viewport,dimensions,states:true,notificationNavigation:true,picker:true,preferences:true});
   await old.close();await p.close();console.log(`PASS component recipe ${viewport.width}x${viewport.height}: integrated geometry parity, quiet rest/hover, selected/focus, filters, notification groups, report picker, contrast fallbacks`);
  }
  fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
