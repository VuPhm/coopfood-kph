// Cache-enabled recovery on real Vite dev/preview servers. No storage clearing or hard reload.
const { chromium, expect } = require('@playwright/test');
const http = require('node:http');
const assert = require('node:assert/strict');
const { mkdirSync, writeFileSync, readFileSync } = require('node:fs');
const output='.local/verification/preview-freshness';
const cases=[
 ['admin-dev-root',4175,'/sw.js','login',1440],
 ['admin-dev-custom',4175,'/old/worker.js?build=old','login',390],
 ['store-dev-root',4173,'/sw.js','login',390],
 ['store-dev-custom',4173,'/pilot/service-worker.js?build=old','login',1440],
 ['admin-no-register-page',4175,'/abandoned-worker.js','login',1440,true],
 ['store-no-register-page',4173,'/abandoned-worker.js','login',390,true],
 ['admin-preview-custom',4183,'/old/worker.js?build=old','login',1440],
 ['store-preview-custom',4182,'/pilot/service-worker.js?build=old','mock',390],
];
async function check(browser,[name,port,script,kind,width,noRegisterPage=false]) {
 let old=true,upgrades=0;
 const oldHtml=`<!doctype html><html><head><title>Stale shell</title></head><body><h1>Stale shell ${name}</h1><script>navigator.serviceWorker.register(${JSON.stringify(script)},{scope:'/'});</script></body></html>`;
 const cachedHtml=noRegisterPage?oldHtml.replace(/<script>[\s\S]*?<\/script>/,''):oldHtml;
 const worker=`self.addEventListener('install',()=>self.skipWaiting());self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));self.addEventListener('fetch',event=>{if(event.request.mode==='navigate')event.respondWith(new Response(${JSON.stringify(cachedHtml)},{headers:{'Content-Type':'text/html'}}));});`;
 const proxy=http.createServer((req,res)=>{
  if(old) { const isScript=req.headers['service-worker']==='script';res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',isScript?'application/javascript':'text/html');res.setHeader('Service-Worker-Allowed','/');res.end(isScript?worker:oldHtml);return; }
  if(req.headers['service-worker']==='script')upgrades++;
  const upstream=http.request({host:'127.0.0.1',port,path:req.url,method:req.method,headers:{...req.headers,host:`127.0.0.1:${port}`}},response=>{res.writeHead(response.statusCode,response.headers);response.pipe(res);});
  upstream.on('error',error=>{res.statusCode=502;res.end(error.message);});req.pipe(upstream);
 });
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${proxy.address().port}`;
 const context=await browser.newContext({viewport:{width,height:width===390?844:1024},serviceWorkers:'allow'}),page=await context.newPage();
 try {
  await page.goto(origin+'/#home');
  await page.evaluate(async()=>{
   await navigator.serviceWorker.ready;
   localStorage.setItem('preview-proof','keep-local');sessionStorage.setItem('preview-proof','keep-session');document.cookie='preview-proof=keep-cookie; SameSite=Lax';
   const cache=await caches.open('preview-proof');await cache.put('/proof',new Response('keep-cache'));
   await new Promise((resolve,reject)=>{const request=indexedDB.open('preview-proof',1);request.onupgradeneeded=()=>request.result.createObjectStore('records');request.onerror=reject;request.onsuccess=()=>{const db=request.result,tx=db.transaction('records','readwrite');tx.objectStore('records').put('keep-record','proof');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=reject;};});
  });
  await page.reload();await expect(page.getByRole('heading',{name:`Stale shell ${name}`,exact:true})).toBeVisible();
  assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));
  old=false;await page.reload();
  const current=kind==='login'?page.getByRole('button',{name:'Đăng nhập',exact:true}):page.getByRole('heading',{name:'Công việc cửa hàng',exact:true});
  await expect(current).toBeVisible({timeout:15000});
  await expect.poll(()=>page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(items=>items.length))).toBe(0);
  assert.equal(await page.evaluate(()=>!!navigator.serviceWorker.controller),false);
  await expect(page.locator('meta[name="coopfood-local-preview"]')).toHaveAttribute('content','fresh');
  await page.screenshot({path:`${output}/${name}.png`});
  // Repeated normal reloads must stay current, including built Store which normally registers a PWA.
  for(let index=0;index<2;index++) {const response=await page.reload();assert.match(response.headers()['cache-control'],/no-store/);await expect(current).toBeVisible();}
  let navigations=0;page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
  await page.waitForTimeout(800);assert.equal(navigations,0,'No retirement/re-registration reload loop');
  assert.equal(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(items=>items.length)),0);
  const proof=await page.evaluate(async()=>({local:localStorage.getItem('preview-proof'),session:sessionStorage.getItem('preview-proof'),cookie:document.cookie,cache:await(await caches.open('preview-proof')).match('/proof').then(value=>value.text()),record:await new Promise((resolve,reject)=>{const r=indexedDB.open('preview-proof');r.onerror=reject;r.onsuccess=()=>{const db=r.result,q=db.transaction('records').objectStore('records').get('proof');q.onsuccess=()=>{db.close();resolve(q.result);};q.onerror=reject;};})}));
  assert.equal(proof.local,'keep-local');assert.equal(proof.session,'keep-session');assert.match(proof.cookie,/preview-proof=keep-cookie/);assert.equal(proof.cache,'keep-cache');assert.equal(proof.record,'keep-record');
  const scriptResponse=await context.request.get(origin+script,{headers:{'Service-Worker':'script'}});assert.equal(scriptResponse.status(),200);assert.match(scriptResponse.headers()['content-type'],/javascript/);assert.match(scriptResponse.headers()['cache-control'],/no-store/);assert.ok(upgrades>0);
  console.log(`PASS ${name}: stale controlled page -> current; custom/root worker retired; 2 normal reloads stable; all browser data preserved`);
  return {name,result:'PASS',upgrades};
 } catch(error) {await page.screenshot({path:`${output}/${name}-failure.png`}).catch(()=>{});throw error;}
 finally {await context.close();await new Promise(resolve=>proxy.close(resolve));}
}
(async()=>{
 mkdirSync(output,{recursive:true});
 const builtHtml=readFileSync('apps/store-pwa/dist/index.html','utf8'),builtWorker=readFileSync('apps/store-pwa/dist/sw.js','utf8');
 assert.ok(!builtHtml.includes('coopfood-local-preview'),'Production output must not contain local retirement bootstrap');
 assert.ok(!builtWorker.includes('registration.unregister'),'Production service worker stays a real Workbox worker');
 const browser=await chromium.launch();try {const results=[];for(const value of cases)results.push(await check(browser,value));writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2)+'\n');}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
