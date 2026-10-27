// Small controls must still grow with large text; charts retain their own geometry.
const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4362';const output=process.env.STORE_REFLOW_OUTPUT||'.local/fresh01/reflow';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch(),results=[];try{for(const width of[390,1440,320])for(const route of['home','reports','shelf']){
 const page=await browser.newPage({viewport:{width,height:width===1440?1024:844},serviceWorkers:'block',reducedMotion:'reduce'});await page.goto(base+'/#'+route);if(route==='reports')await page.locator('.report-type-card').first().waitFor();await page.locator('.store-page-surface').waitFor();
 const root=page.locator('.store-page-surface').first();
 for(const factor of[1.5,2]){
  await root.evaluate((r,f)=>{const values=[...r.querySelectorAll('h2,h3,button,strong,small,p,label,input:not([type=checkbox]):not([type=radio]),dt,dd')].filter(n=>!n.closest('.store-timeline')).map(n=>({n,font:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}));for(const{n,font,line}of values){n.dataset.oldReflow=n.getAttribute('style')||'';n.style.fontSize=font*f+'px';if(Number.isFinite(line))n.style.lineHeight=line*f+'px';}},factor);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  const clipped=await root.evaluate(r=>[...r.querySelectorAll('button,h2,h3,strong,small,p,label')].filter(n=>!n.closest('.store-timeline')&&n.getBoundingClientRect().width>0&&n.scrollWidth>n.clientWidth+1).map(n=>({class:n.className,text:n.textContent})));expect(clipped,`${route}/${width} text${factor*100}`).toEqual([]);
  await page.screenshot({path:`${output}/${route}-${width}-${factor*100}.png`});await root.locator('[data-old-reflow]').evaluateAll(ns=>ns.forEach(n=>{n.setAttribute('style',n.dataset.oldReflow);delete n.dataset.oldReflow}));
 }
 results.push({width,route,text150200:true});await page.close();console.log('PASS Store reflow150/200',route,width);
}fs.writeFileSync(output+'/results.json',JSON.stringify(results,null,2));}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
