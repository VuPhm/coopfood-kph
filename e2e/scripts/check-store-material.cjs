// Home reference, bright field states and bounded static decoration cost.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4364';
const output=process.env.STORE_MATERIAL_OUTPUT||'.local/fresh01/r2/material';fs.mkdirSync(output,{recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT=output+'/contrast';const {audit}=require('./check-kph-colors.cjs');
async function settle(p){await p.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})))});}
async function paint(n){return n.evaluate(el=>{const s=getComputedStyle(el);return {bg:s.backgroundColor,image:s.backgroundImage,edge:s.borderColor,shadow:s.boxShadow,opacity:s.opacity}});}
function cssBytes(dir){return fs.readdirSync(path.join(dir,'assets')).filter(n=>n.endsWith('.css')).reduce((sum,n)=>sum+zlib.gzipSync(fs.readFileSync(path.join(dir,'assets',n))).length,0);}
(async()=>{const browser=await chromium.launch(),results=[];try{
 for(const width of[390,1440,320]){
  const p=await browser.newPage({viewport:{width,height:width===1440?1024:844},serviceWorkers:'block',reducedMotion:'reduce'});
  await p.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
  await p.goto(base+'/#home');await expect(p.locator('.store-module')).toHaveCount(4);await settle(p);
  const decor=await p.locator('.store-module,.store-module-icon,.store-mobile-toolbar').evaluateAll(ns=>ns.map(n=>{const s=getComputedStyle(n);return {image:s.backgroundImage,blur:s.backdropFilter,animation:s.animationName,willChange:s.willChange}}));
  expect(decor.every(d=>d.blur==='none'&&d.animation==='none'&&d.willChange==='auto')).toBe(true);
  await p.screenshot({path:`${output}/home-${width}.png`});
  await p.goto(base+'/#date');await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô',exact:true}).fill('A24-255');
  await p.locator('[data-date-lot-id="A24-255"]').click();await p.getByRole('dialog',{name:'Chi tiết lô DATE',exact:true}).getByRole('button',{name:'Xử lý',exact:true}).click();
  const form=p.locator('.store-create-screen');await form.locator('#product-name').waitFor();const input=form.getByRole('textbox',{name:'Số lượng',exact:true});const readonly=form.locator('input[readonly]').first();await settle(p);
  const active=await paint(input),read=await paint(readonly);expect(active.bg).toBe('rgb(255, 255, 255)');expect(active.shadow).toBe('none');expect(read.bg).toBe('rgb(249, 251, 250)');expect(read.opacity).toBe('1');await expect(readonly).not.toBeDisabled();
  await input.hover();await settle(p);expect((await paint(input)).bg).toBe(active.bg);await input.focus();await expect(input).toBeFocused();expect((await paint(input)).bg).toBe(active.bg);
  // Probe the native disabled style on the real field; restore before real validation.
  await input.evaluate(n=>n.disabled=true);await settle(p);const disabled=await paint(input);expect(disabled.bg).toBe('rgb(228, 236, 231)');expect(disabled.bg).not.toBe(active.bg);await input.evaluate(n=>n.disabled=false);
  await input.fill('0');await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(input).toHaveAttribute('aria-invalid','true');await expect(input).toBeFocused();const error=await paint(input);expect(error.bg).toBe('rgb(254, 243, 242)');
  await audit(p,'.store-create-screen',`fields-${width}`);await p.screenshot({path:`${output}/fields-error-${width}.png`});
  await input.fill('1');await form.locator('.form-section').first().evaluate(n=>n.scrollIntoView({block:'start'}));await p.screenshot({path:`${output}/fields-${width}.png`});
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);results.push({width,decor,active,read,disabled,error});await p.close();console.log('PASS Home static gradients and active/readonly/disabled/error fields',width);
 }
 const oldDir=process.env.STORE_MATERIAL_BASELINE_BUILD||'.local/fresh01/build',newDir=process.env.STORE_MATERIAL_BUILD||'.local/fresh01/r2/build';
 let css=null;if(fs.existsSync(oldDir)&&fs.existsSync(newDir)){const before=cssBytes(oldDir),after=cssBytes(newDir);css={before,after,gzipDelta:after-before};expect(css.gzipDelta,'decorative CSS gzip growth budget4KiB').toBeLessThan(4096);console.log('PASS CSS payload budget',JSON.stringify(css));}
 // Diagnostic only: throttled scrolling cannot establish real-device frame rate.
 const p=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block',reducedMotion:'no-preference'});await p.goto(base+'/#kph');await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();await settle(p);expect(await p.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity).length)).toBe(0);const cdp=await p.context().newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 const frames=await p.evaluate(async()=>{const frames=[];let prev=performance.now();for(let i=0;i<45;i++){await new Promise(r=>requestAnimationFrame(r));const now=performance.now();frames.push(now-prev);prev=now;scrollBy(0,18);}return frames.sort((a,b)=>a-b)});const scroll={cpuRate:4,samples:frames.length,median:frames[Math.floor(frames.length*.5)],p95:frames[Math.floor(frames.length*.95)]};await p.close();
 fs.writeFileSync(output+'/results.json',JSON.stringify({results,css,scroll},null,2));console.log('Diagnostic throttled scroll',JSON.stringify(scroll));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
