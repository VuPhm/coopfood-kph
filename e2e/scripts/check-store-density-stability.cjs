// The setting must not move underneath pointer/keyboard while it resizes workspaces.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4354';
const output=process.env.STORE_DENSITY_STABILITY_OUTPUT||'.local/compact03/r5/stability';
const key='coopfood.store-ui.density.v1';
const viewports=[{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:900,height:650},{width:844,height:390}];
fs.mkdirSync(output,{recursive:true});
async function settle(page){await page.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});}
async function measure(page){return page.evaluate(()=>{const box=selector=>{const node=document.querySelector(selector),r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};return{sheet:box('.store-account-sheet'),hero:box('.store-account-hero'),control:box('.store-density-switch'),track:box('.store-density-track'),bodyScroll:document.querySelector('.store-account-body').scrollTop,pageScroll:scrollY};});}
function stable(before,after,label){for(const name of['sheet','hero','control','track'])for(const axis of['x','y','width','height'])expect(Math.abs(after[name][axis]-before[name][axis]),`${label} ${name}.${axis}`).toBeLessThanOrEqual(1);expect(Math.abs(after.bodyScroll-before.bodyScroll),`${label} settings scroll`).toBeLessThanOrEqual(1);}
(async()=>{const browser=await chromium.launch(),results=[];try{for(const viewport of viewports)for(const route of['home','kph','date','reports','shelf','notifications']){const page=await browser.newPage({viewport,serviceWorkers:'block',timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce'});try{const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));await page.goto(`${base}/#${route}`);await page.locator('.store-header').waitFor();if(route==='kph')await page.locator('[data-record-id]').first().waitFor();if(route==='date')await page.locator('[data-date-lot-id]').first().waitFor();if(route==='reports')await page.locator('.report-type-card').first().waitFor();
 const trigger=page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true});await trigger.click();const control=page.getByRole('switch',{name:'Chế độ gọn',exact:true});await control.scrollIntoViewIfNeeded();await settle(page);const before=await measure(page);const center={x:before.control.x+before.control.width/2,y:before.control.y+before.control.height/2};
 // A second click at the SAME coordinates must toggle back, without chasing a moving switch.
 await page.mouse.click(center.x,center.y);await expect(control).toHaveAttribute('aria-checked','true');await settle(page);const compact=await measure(page);stable(before,compact,`${route}/${viewport.width} compact`);await expect(control).toBeFocused();
 await page.mouse.click(center.x,center.y);await expect(control).toHaveAttribute('aria-checked','false');await settle(page);stable(before,await measure(page),`${route}/${viewport.width} restored`);
 for(const pressed of['true','false']){await control.focus();await page.keyboard.press('Space');await expect(control).toHaveAttribute('aria-checked',pressed);await settle(page);stable(before,await measure(page),`${route}/${viewport.width} keyboard ${pressed}`);await expect(control).toBeFocused();}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);expect(before.control.width).toBeGreaterThanOrEqual(44);expect(before.control.height).toBeGreaterThanOrEqual(44);
 await page.keyboard.press('Escape');await expect(trigger).toBeFocused();await expect.poll(()=>page.evaluate(key=>localStorage.getItem(key),key)).toBe('comfortable');
 let enlargedDateInput=null;
 if(route==='date'){
   await trigger.click();await control.click();await expect(control).toHaveAttribute('aria-checked','true');await page.keyboard.press('Escape');
   const input=page.locator('.store-date-search');expect((await input.boundingBox()).height).toBe(44);
   await input.evaluate(node=>{node.style.fontSize='32px';node.style.lineHeight='48px';});
   enlargedDateInput=await input.boundingBox();expect(enlargedDateInput.height,'DATE search grows with200% text').toBeGreaterThanOrEqual(64);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }
 expect(errors).toEqual([]);
 results.push({viewport,route,before,compact,samePointerPosition:true,keyboard:true,focusReturn:true,enlargedDateInput});if(route==='home')await page.screenshot({path:`${output}/home-${viewport.width}.png`});console.log(`PASS stable density controller ${route} ${viewport.width}x${viewport.height}`);
 }finally{await page.close();}}fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
