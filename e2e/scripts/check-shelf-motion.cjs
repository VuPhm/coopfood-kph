// Shelf02 keeps finite entrance feedback; focus/status no longer repaint a glow perimeter.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');const output='.local/shelf-motion';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch();try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1024}]){
  const page=await browser.newPage({viewport,reducedMotion:'no-preference',serviceWorkers:'block'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));
  for(const context of ['main','quick']){
   await page.goto(`${process.env.STORE_APP_URL||'http://127.0.0.1:4276'}/#${context==='main'?'shelf':'kph'}`);
   if(context==='quick')await page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng',exact:true}).click();
   const panel=context==='main'?page.locator('.store-screen-shelf .store-shelf'):page.getByRole('dialog',{name:'Tra cứu lùi hàng nhanh',exact:true});
   const scope=context==='main'?panel:panel.locator('.store-modal-body');
   await expect.poll(()=>panel.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
   const initial=await scope.boundingBox(); const result=scope.getByRole('region',{name:'Kết quả tra hạn lùi',exact:true});const resultBounds=await result.boundingBox();const node=await result.elementHandle();
   const nsx=scope.getByRole('textbox',{name:'Ngày sản xuất',exact:true}),hsd=scope.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true});
   for(const input of await scope.getByRole('textbox').all()){
    await input.focus(); const focused=await scope.boundingBox();
    for(const key of ['x','y','width','height'])expect(Math.abs(focused[key]-initial[key])).toBeLessThanOrEqual(1);
    const repaint=await scope.evaluate(el=>[el,...el.querySelectorAll('*')].flatMap(x=>x.getAnimations()).some(a=>(a.transitionProperty||'').startsWith('--store-shelf-glow')));expect(repaint).toBe(false);
   }
   await nsx.fill('01/01/2030');await hsd.fill('01/01/2031');await scope.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(result).toHaveAttribute('data-status','SAFE');
   await expect.poll(()=>result.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
   await nsx.fill('01/01/2010');await hsd.fill('01/01/2011');await scope.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(result).toHaveAttribute('data-status','EXPIRED');
   await expect.poll(()=>result.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
   expect(await node.evaluate(el=>el.isConnected)).toBe(true);
   const filled=await scope.boundingBox(),after=await result.boundingBox();
   for(const key of ['x','y','width','height']){expect(Math.abs(filled[key]-initial[key])).toBeLessThanOrEqual(1);expect(Math.abs(after[key]-resultBounds[key])).toBeLessThanOrEqual(1)}
   await expect(scope).toHaveCSS('background-image','none');
   expect(await scope.evaluate(el=>[el,...el.querySelectorAll('*')].some(x=>getComputedStyle(x).backdropFilter!=='none'&&getComputedStyle(x).backdropFilter!==''))).toBe(false);
   await scope.screenshot({path:`${output}/${context}-${viewport.width}.png`});
   await page.emulateMedia({reducedMotion:'reduce'});await scope.getByRole('button',{name:'Làm mới',exact:true}).click();await nsx.fill('01/01/2030');await hsd.fill('01/01/2031');await scope.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(result).toHaveAttribute('data-status','SAFE');expect(await result.evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length)).toBe(0);
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  expect(errors).toEqual([]);await page.close();console.log(`PASS static shelf ${viewport.width}: main/quick focus and status, stable holder, no glow/filter, reduced motion`);
 }
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
