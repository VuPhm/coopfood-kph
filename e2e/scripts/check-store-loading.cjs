// Deferred KPH uses the same one-screen frame and neutral records before loading.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4362';
const output=process.env.STORE_LOADING_OUTPUT||'.local/fresh01/loading';
fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch(),results=[];try{
 for(const width of[390,1440]){
  const p=await browser.newPage({viewport:{width,height:width===390?844:1024},serviceWorkers:'block',reducedMotion:'reduce'});
  let release;const hold=new Promise(resolve=>release=resolve);
  await p.route(/store-kph-workspace-.*\.js$/,async route=>{await hold;await route.continue()});
  await p.goto(base+'/#kph');const root=p.locator('.store-kph-list-loading');await root.waitFor();
  await expect(root).toHaveAttribute('aria-hidden','true');
  const neutral=await root.locator('.ui-list-label[data-label-kind]').evaluateAll(ns=>ns.map(n=>({color:getComputedStyle(n).color,icon:n.querySelector('.ui-list-label-icon')?getComputedStyle(n.querySelector('.ui-list-label-icon')).visibility:null})));
  expect(neutral.length).toBeGreaterThan(0);for(const paint of neutral){expect(paint.color).toBe('rgba(0, 0, 0, 0)');if(paint.icon)expect(paint.icon).toBe('hidden')}
  const selector='.store-create-cta';const before=await p.locator(selector).evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));
  await p.screenshot({path:`${output}/loading-${width}.png`});release();await expect(root).toHaveCount(0);await expect(p.locator('[data-record-id]').first()).toBeVisible();
  const after=await p.locator(selector).evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}}));expect(after).toEqual(before);
  expect(await p.locator('.ui-list-label[data-label-kind]').first().evaluate(n=>getComputedStyle(n).color)).not.toBe('rgba(0, 0, 0, 0)');
  await expect(p.locator('html')).not.toHaveAttribute('data-store-density',/.+/);results.push({width,neutral,sameActions:true});await p.close();console.log('PASS neutral loading, stable actions and live labels',width);
 }
 fs.writeFileSync(output+'/results.json',JSON.stringify(results,null,2));
}finally{await browser.close()}})().catch(error=>{console.error(error);process.exitCode=1});
