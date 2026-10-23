const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4280';const baseline=process.env.STORE_BASELINE_URL||'http://127.0.0.1:4279';
const output=process.env.STORE_CHROME_OUTPUT||'.local/header02/chrome';fs.mkdirSync(output,{recursive:true});process.env.STORE_KPH_COLORS_OUTPUT=output;
const {audit}=require('./check-kph-colors.cjs');const green='linear-gradient(115deg, rgb(0, 107, 75), rgb(0, 122, 82))';
async function ready(p,url){await p.goto(url);await expect(p.locator('.store-header')).toBeVisible();await p.evaluate(()=>document.fonts.ready)}
async function chart(p){return p.locator('.store-date-milestones .store-timeline').evaluate(root=>[root,...root.querySelectorAll('*')].flatMap(el=>[null,'::before','::after'].map(pseudo=>{const s=getComputedStyle(el,pseudo);return{cls:el.className,pseudo,color:s.color,bg:s.backgroundColor,image:s.backgroundImage,border:s.borderColor}})))}
(async()=>{const b=await chromium.launch();const results=[];try{
 for(const viewport of[{width:390,height:844},{width:1440,height:1024},{width:320,height:740}]){
  const p=await b.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
  for(const route of['home','date','kph','reports','shelf','notifications','login']){
   await ready(p,`${base}/#${route}`);if(route==='reports')await p.getByRole('heading',{name:'Chọn báo cáo',exact:true}).waitFor();
   await expect(p.locator('.store-page-hero')).toHaveCSS('background-image',green);
   expect(await p.locator('.store-page-hero').evaluate(root=>[root,...root.querySelectorAll('*')].filter(el=>getComputedStyle(el).backdropFilter!=='none').length)).toBe(0);
   const end=p.locator('.store-page-hero-content').or(p.locator('.store-header')).last();const last=await end.boundingBox();const cover=await p.locator('.store-page-surface').boundingBox();expect(cover.y-last.y-last.height).toBe(8);
   const lead=await p.locator('.store-header-brand,.store-back').boundingBox();expect(lead.width).toBe(44);expect(lead.height).toBe(44);
   if(route!=='login'){const avatar=await p.locator('.store-header .store-profile-avatar').boundingBox();expect(avatar.y+avatar.height/2).toBe(lead.y+lead.height/2)}
   await audit(p,'.store-page-hero',`${route}-${viewport.width}`);
   await p.screenshot({path:`${output}/${route}-${viewport.width}.png`});
  }
  await ready(p,`${base}/#home`);await p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true}).click();await expect(p.locator('.store-account-hero')).toHaveCSS('background-image',green);await audit(p,'.store-account-hero',`account-${viewport.width}`);await p.keyboard.press('Escape');
  await ready(p,`${base}/#date`);await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('A24-301');await p.locator('.store-date-lot').click();const colors=await chart(p);
  if(viewport.width<900){await expect(p.locator('.store-date-lot-sheet .store-sheet-heading')).toHaveCSS('background-image',green);await audit(p,'.store-date-lot-sheet .store-sheet-heading',`detail-header-${viewport.width}`);await p.keyboard.press('Escape')}
  const old=await b.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});await old.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));await ready(old,`${baseline}/#date`);await old.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill('A24-301');await old.locator('.store-date-lot').click();expect(colors).toEqual(await chart(old));await old.close();
  await ready(p,`${base}/#kph`);await p.locator('.create-tpcn').click();await expect(p.locator('.store-create-screen #product-name')).toBeAttached();await expect(p.locator('.store-create-screen .create-dialog-header')).toHaveCSS('background-image',green);await audit(p,'.create-dialog-header',`create-header-${viewport.width}`);await p.keyboard.press('Escape');
  await ready(p,`${base}/#home`);await p.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng'}).click();await expect(p.locator('.store-quick-panel > [data-slot="dialog-header"]')).toHaveCSS('background-image',green);await p.keyboard.press('Escape');
  await ready(p,`${base}/#reports`);await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await expect(p.locator('.store-header h1')).toHaveText('Báo cáo tổng hợp');await audit(p,'.store-page-hero',`composer-${viewport.width}`);await p.screenshot({path:`${output}/composer-${viewport.width}.png`});
  await p.emulateMedia({media:'print'});await expect(p.locator('.store-app')).toHaveCSS('background-color','rgb(255, 255, 255)');
  expect(errors).toEqual([]);results.push({viewport,sevenScreens:true,sharedModalGreen:true,chartColorsUnchanged:true,noBlur:true,printWhite:true});await p.close();console.log(`PASS Store chrome ${viewport.width}: seven screens, spacing/anchors/contrast, modal/composer headers, chart parity and print`);
 }
 fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
