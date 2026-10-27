// Green/cover continuity and focus/async frame stability. Synthetic local fixtures only.
const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4379';
const output=process.env.STORE_UNDERLAY_OUTPUT||'.local/hero01';fs.mkdirSync(output,{recursive:true});
const seed={version:1,storeCode:'0001',templates:[],history:[{id:'hero-fixture',title:'Báo cáo kiểm tra nền xanh',asOf:'2026-10-27',period:{start:'2026-10-01',end:'2026-10-27'},filter:{phase:'all',processing:'all',search:''},rows:[],store:'Cửa hàng mẫu',createdAt:'27/10/2026 12:00:00'}]};
async function settle(p){await p.evaluate(async()=>{await document.fonts.ready;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));});}
async function geometry(p){return p.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};return{hero:box('.store-page-hero'),cap:box('.store-page-surface'),bar:box('.store-header'),scroll:scrollY}});}
async function noOverflow(p){expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
(async()=>{const b=await chromium.launch(),results=[];try{
for(const viewport of[{width:390,height:844},{width:1440,height:1024},{width:320,height:740},{width:900,height:650},{width:844,height:390}]){
 const p=await b.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(data=>localStorage.setItem('coopfood:mock-date-report-library:v1:0001',JSON.stringify(data)),seed);
 for(const route of['home','kph','date','reports','notifications','shelf','login']){
  await p.goto(base+'/#'+route);await p.locator('.store-page-surface').waitFor();if(route==='kph')await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();if(route==='reports')await p.getByRole('heading',{name:'Chọn báo cáo',exact:true}).waitFor();await settle(p);
  const g=await geometry(p);expect(g.bar.height).toBe(72);expect(g.hero.bottom-g.cap.y).toBe(12);expect(g.hero.y).toBe(0);await noOverflow(p);
  const slots=await p.locator('.store-page-hero-content > *').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect()));for(const slot of slots)expect(slot.width).toBeLessThanOrEqual(800.1);
  const trace=await p.evaluate(async()=>{const rows=[];for(const top of[0,16,32,64,96,128,160]){scrollTo({top,behavior:'instant'});await new Promise(requestAnimationFrame);const c=document.querySelector('.store-page-surface').getBoundingClientRect();const h=document.querySelector('.store-page-hero').getBoundingClientRect();rows.push({scroll:scrollY,capY:c.top,heroY:h.top});}return rows;});for(const row of trace){expect(row.heroY).toBe(0);expect(Math.abs(row.capY+row.scroll-g.cap.y)).toBeLessThanOrEqual(1);}
  await p.evaluate(()=>scrollTo(0,0));if([390,1440].includes(viewport.width))await p.screenshot({path:`${output}/${route}-${viewport.width}.png`});results.push({viewport,route,geometry:g,nativeTrace:trace});
 }
 await p.goto(base+'/#kph');await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();await settle(p);const query=p.getByRole('textbox',{name:'Tìm tên hàng hoặc SKU',exact:true});
 await p.evaluate(()=>scrollTo(0,20));await query.focus();expect(await p.evaluate(()=>scrollY)).toBe(20); // exposed: no gratuitous reset
 await p.evaluate(()=>{document.activeElement.blur();scrollTo(0,160)});await query.focus();await settle(p);const visible=await p.evaluate(()=>({scroll:scrollY,cap:document.querySelector('.store-page-surface').getBoundingClientRect().top,bottom:document.activeElement.getBoundingClientRect().bottom}));expect(visible.scroll).toBeGreaterThan(0);expect(visible.cap).toBeGreaterThanOrEqual(visible.bottom+7);
 await p.evaluate(()=>{document.activeElement.blur();scrollTo(0,20)});const before=await geometry(p);await p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true}).click();await p.keyboard.press('Escape');expect((await geometry(p)).scroll).toBe(before.scroll);expect((await geometry(p)).hero.width).toBe(before.hero.width);
 // Route commits begin at the top, before the first painted frame.
 await p.evaluate(()=>{scrollTo(0,200);location.hash='date'});await p.locator('.store-date-search-form').waitFor();expect(await p.evaluate(()=>scrollY)).toBe(0);
 await p.goto(base+'/#reports');await p.getByRole('button',{name:/Lịch sử/}).click();await settle(p);await expect(p.locator('.store-header h1')).toHaveText('Lịch sử báo cáo');await expect(p.getByRole('heading',{name:'Lịch sử báo cáo',exact:true})).toHaveCount(1);await noOverflow(p);if([390,1440].includes(viewport.width))await p.screenshot({path:`${output}/history-${viewport.width}.png`});
 await p.locator('.report-history-card').click();await settle(p);await expect(p.locator('.store-header h1')).toHaveText('Bản báo cáo DATE');await expect(p.locator('.date-report-document-meta')).toContainText(seed.history[0].title);await noOverflow(p);if([390,1440].includes(viewport.width))await p.screenshot({path:`${output}/document-${viewport.width}.png`});
 await p.emulateMedia({media:'print'});await expect(p.locator('.date-report-document-meta')).toBeVisible();await expect(p.locator('.date-report-document-meta')).toContainText(seed.history[0].title);await p.emulateMedia({media:'screen',reducedMotion:'reduce'});
 await p.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();await settle(p);expect(await p.evaluate(()=>scrollY)).toBe(0);await expect(p.locator('.report-sliding-cap')).toHaveCSS('animation-name','none');
 // Async lookup feedback belongs to the white workspace, leaving the cover edge still.
 await p.goto(base+'/#date');const queryDate=p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô',exact:true});await queryDate.fill('0000000000001');const lookupFrame=await geometry(p);await queryDate.press('Enter');await expect(p.locator('.store-date-message')).toContainText('Không tìm thấy');expect((await geometry(p)).cap.y).toBe(lookupFrame.cap.y);await p.getByRole('button',{name:'Xóa tìm kiếm DATE',exact:true}).click();expect((await geometry(p)).cap.y).toBe(lookupFrame.cap.y);
 // At200% the green content grows naturally; all fields and actions remain inside.
 await p.goto(base+'/#date');await p.locator('.store-page-hero').evaluate(root=>{const sizes=[...root.querySelectorAll('h1,p,input,button')].map(n=>({n,font:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}));for(const{n,font,line}of sizes){n.style.fontSize=font*2+'px';if(Number.isFinite(line))n.style.lineHeight=line*2+'px';}});await noOverflow(p);await p.screenshot({path:`${output}/text200-${viewport.width}.png`});expect(errors).toEqual([]);console.log(`PASS underlay ${viewport.width}: seven routes, native scroll trace, minimum focus reveal, modal anchor, subreport hierarchy/print, text200/reduced motion`);await p.close();
}
if(process.env.STORE_UNDERLAY_LOADING==='true')for(const viewport of[{width:390,height:844},{width:1440,height:1024}]){
 const p=await b.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});let release;const gate=new Promise(resolve=>release=resolve);let held=false;
 await p.route(/assets\/store-kph-workspace-[^/]+\.js/,async route=>{held=true;await gate;await route.continue()});
 await p.goto(base+'/#kph',{waitUntil:'domcontentloaded'});await p.locator('.kph-loading-frame').waitFor();const loading=await geometry(p);expect(held).toBe(true);release();await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();const ready=await geometry(p);expect(ready.hero.height).toBe(loading.hero.height);expect(ready.cap.y).toBe(loading.cap.y);results.push({viewport,loadingParity:true,loading,ready});console.log(`PASS loading parity ${viewport.width}: hero/cover delta0`);await p.close();
}
fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
