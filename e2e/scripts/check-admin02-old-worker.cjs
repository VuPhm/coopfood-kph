// Reproduce a reused preview origin already controlled by an offline Pilot.
const { chromium, expect } = require('@playwright/test');
const http = require('node:http');
const assert = require('node:assert/strict');
let old = true;
let workerUpgrades = 0;
const oldHtml = `<!doctype html><title>Old Pilot</title><h1>Old Pilot</h1><script>navigator.serviceWorker.register('/sw.js');</script>`;
const oldWorker = `self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.mode==='navigate')e.respondWith(new Response(${JSON.stringify(oldHtml)},{headers:{'Content-Type':'text/html'}}));});`;
const server = http.createServer((req,res) => {
  if (old) {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type',req.url === '/sw.js' ? 'application/javascript' : 'text/html');
    return res.end(req.url === '/sw.js' ? oldWorker : oldHtml);
  }
  if (req.url === '/sw.js') workerUpgrades++;
  const upstream = http.request({host:'127.0.0.1',port:4175,path:req.url,method:req.method,headers:{...req.headers,host:'127.0.0.1:4175'}}, response => {
    res.writeHead(response.statusCode,response.headers); response.pipe(res);
  });
  upstream.on('error',()=>{res.statusCode=502;res.end();});req.pipe(upstream);
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch();
  try {
    const context=await browser.newContext(); const page=await context.newPage();
    await page.goto(origin+'/#identity');
    await page.evaluate(async()=>{
      await navigator.serviceWorker.ready;
      localStorage.setItem('pilot-preserve-proof','keep-local-data');
      document.cookie='pilot-preserve-proof=keep-cookie; SameSite=Lax';
      const cache=await caches.open('pilot-preserve-proof');await cache.put('/proof',new Response('keep-cache-data'));
      await new Promise((resolve,reject)=>{const r=indexedDB.open('pilot-preserve-proof',1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onerror=reject;r.onsuccess=()=>{const db=r.result;const t=db.transaction('records','readwrite');t.objectStore('records').put('keep-record','proof');t.oncomplete=()=>{db.close();resolve();};t.onerror=reject;};});
    });
    await page.reload();
    await expect(page.getByRole('heading',{name:'Old Pilot',exact:true})).toBeVisible();
    assert.ok(await page.evaluate(()=>!!navigator.serviceWorker.controller));
    old=false;
    // Cache stays enabled; normal reload invokes the browser's worker update.
    await page.reload();
    await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeVisible({timeout:30000});
    assert.ok(workerUpgrades>0,'Browser requested replacement of the old /sw.js');
    assert.equal(await page.evaluate(()=>navigator.serviceWorker.getRegistrations().then(x=>x.length)),0);
    await page.reload();
    await expect(page.getByRole('button',{name:'Đăng nhập',exact:true})).toBeVisible();
    const proof=await page.evaluate(async()=>({
      local:localStorage.getItem('pilot-preserve-proof'),cookie:document.cookie,
      cache:await (await caches.open('pilot-preserve-proof')).match('/proof').then(x=>x.text()),
      record:await new Promise((resolve,reject)=>{const r=indexedDB.open('pilot-preserve-proof');r.onerror=reject;r.onsuccess=()=>{const db=r.result;const q=db.transaction('records').objectStore('records').get('proof');q.onsuccess=()=>{db.close();resolve(q.result);};q.onerror=reject;};})
    }));
    assert.equal(proof.local,'keep-local-data');assert.match(proof.cookie,/pilot-preserve-proof=keep-cookie/);
    assert.equal(proof.cache,'keep-cache-data');assert.equal(proof.record,'keep-record');
    console.log('PASS old offline worker -> normal reload -> current Admin -> second normal reload; no registration remains; IndexedDB/localStorage/cookie/CacheStorage preserved.');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
