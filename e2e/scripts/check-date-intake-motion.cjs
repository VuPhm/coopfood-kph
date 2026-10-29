const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4398';
const out=process.env.STORE_MOTION_OUTPUT||'/tmp/date06-motion';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(),results=[];
 try{for(const viewport of[{width:390,height:844},{width:1440,height:1024}])for(const reducedMotion of['no-preference','reduce']){
  const touch=viewport.width<900,page=await browser.newPage({viewport,hasTouch:touch,reducedMotion,serviceWorkers:'block'});
  await page.goto(base+'/#date');
  const root=page.locator('.store-date');await expect(root).toBeVisible();
  await expect(root).not.toHaveAttribute('data-store-entering','date');
  await page.evaluate(()=>document.fonts.ready);
  const trigger=page.getByRole('button',{name:'Thêm theo dõi',exact:true});
  for(const top of[0,80,0]){
   await page.evaluate(top=>window.scrollTo({top,behavior:'instant'}),top);
   const before=await page.evaluate(()=>scrollY),r=await trigger.boundingBox();
   // Native coordinate tap avoids locator auto-scroll changing the setup itself.
   if(touch)await page.touchscreen.tap(r.x+r.width/2,r.y+r.height/2);else await page.mouse.click(r.x+r.width/2,r.y+r.height/2);
   const panel=page.getByRole('dialog',{name:'Thêm theo dõi DATE',exact:true});await expect(panel).toBeVisible();
   const frames=await panel.evaluate(el=>new Promise(resolve=>{const samples=[],start=performance.now();function frame(now){const r=el.getBoundingClientRect();samples.push({scroll:scrollY,width:r.width,height:r.height});if(now-start>=320)resolve(samples);else requestAnimationFrame(frame)}requestAnimationFrame(frame)}));
   for(const f of frames){expect(f.scroll).toBe(before);expect(f.width).toBeCloseTo(frames[0].width,0);expect(f.height).toBeCloseTo(frames[0].height,0)}
   expect(await page.getByText('Đang mở form theo dõi…',{exact:true}).count()).toBe(0);
   const bounds=await panel.boundingBox();expect(bounds.y+bounds.height).toBeCloseTo(viewport.height,0);
   const preview=panel.locator('.date-intake-preview'),height=(await preview.boundingBox()).height;
   await panel.getByRole('textbox',{name:'Ngày sản xuất (NSX)',exact:true}).fill('01/10/2026');await panel.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true}).fill('31/10/2026');
   expect((await preview.boundingBox()).height).toBeCloseTo(height,0);
   await panel.getByRole('button',{name:'Hủy',exact:true}).click();await page.getByRole('button',{name:'Bỏ thay đổi',exact:true}).click();
   await expect(panel).toHaveCount(0);await expect(trigger).toBeFocused();expect(await page.evaluate(()=>scrollY)).toBe(before);
  }
  await trigger.click();await page.getByRole('dialog',{name:'Thêm theo dõi DATE',exact:true}).evaluate(el=>Promise.allSettled(el.getAnimations().map(a=>a.finished)));await page.screenshot({path:`${out}/${viewport.width}-${reducedMotion}.png`});
  results.push({viewport,reducedMotion,threeOpenCloseCycles:true,backgroundStable:true,panelGeometryStable:true,previewHeightStable:true,focusRestored:true});console.log(`PASS DATE motion ${viewport.width} ${reducedMotion}`);await page.close();
 }}finally{fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
