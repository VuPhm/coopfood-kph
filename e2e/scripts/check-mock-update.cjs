const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = 'https://coopfood-demo-20261021.pages.dev';
const profile = '/tmp/coopfood-pub01-existing-client';
const expected = fs.readFileSync('.local/pub01/site/index.html','utf8').match(/<script[^>]+src="([^"]+)"/)[1];
(async()=>{
 const context = await chromium.launchPersistentContext(profile,{headless:true,viewport:{width:390,height:844}});
 try {
  const page = context.pages()[0];
  await page.goto(base+'/#home');
  await expect(page.locator('.store-screen-home')).toBeVisible();
  console.log('Loaded public home; waiting for service worker.');
  await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Service worker not ready after 30s')),30000))]));
  await page.reload();
  await expect.poll(()=>page.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
  const entry = () => page.locator('script[type="module"]').getAttribute('src');
  if(process.argv.includes('--prepare')) {
   const oldEntry = await entry();
   expect(oldEntry).not.toBe(expected);
   fs.writeFileSync('/tmp/coopfood-pub01-upgrade-before.json',JSON.stringify({oldEntry,expected,controlled:true},null,2));
   console.log('PASS old public PWA cached and controlled before publication.');
  } else {
   await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update();});
   if(await entry()!==expected){
    const update=page.getByRole('button',{name:'Cập nhật',exact:true});
    await expect(update).toBeVisible({timeout:60000});
    await update.click();
   }
   await expect.poll(entry,{timeout:60000}).toBe(expected);
   await expect(page.locator('.store-screen-home')).toBeVisible();
   await page.screenshot({path:'/tmp/coopfood-pub01-upgrade-after.png',fullPage:true});
   fs.writeFileSync('/tmp/coopfood-pub01-upgrade-after.json',JSON.stringify({entry:await entry(),expected,controlled:true,updated:true},null,2));
   console.log('PASS existing cached public PWA upgrades to exact POLISH03 entry.');
  }
 } finally {await context.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
