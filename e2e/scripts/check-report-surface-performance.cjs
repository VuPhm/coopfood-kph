const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4221';const output=process.env.STORE_REPORT_OUTPUT||'.local/reports-design/evidence-r14/performance';fs.mkdirSync(output,{recursive:true});const results=[];
async function gestureProbe(page,cdp){
 await page.emulateMedia({reducedMotion:'no-preference'});
 const handle=await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).boundingBox();
 await page.evaluate(()=>{window.gesturePerf={childChanges:0,longTasks:[],frames:[]};window.gestureMutation=new MutationObserver(records=>{window.gesturePerf.childChanges+=records.filter(r=>r.type==='childList').length;});window.gestureMutation.observe(document.querySelector('.report-composer'),{subtree:true,childList:true});window.gestureTasks=new PerformanceObserver(list=>window.gesturePerf.longTasks.push(...list.getEntries().map(e=>e.duration)));window.gestureTasks.observe({type:'longtask'});let previous=0;window.trackFrames=true;function tick(t){if(previous)window.gesturePerf.frames.push(t-previous);previous=t;if(window.trackFrames)requestAnimationFrame(tick);}requestAnimationFrame(tick);});
 const x=handle.x+handle.width/2,y=handle.y+20;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y+i*4}]});await new Promise(resolve=>setTimeout(resolve,18));}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(page.locator('.report-composer')).toBeVisible();
 const sample=await page.evaluate(()=>{window.trackFrames=false;window.gestureMutation.disconnect();window.gestureTasks.disconnect();return {childChanges:window.gesturePerf.childChanges,maxTaskMs:Math.max(0,...window.gesturePerf.longTasks),maxFrameGapMs:Math.max(0,...window.gesturePerf.frames)};});expect(sample.childChanges).toBe(0);expect(sample.maxTaskMs).toBeLessThan(150);
 await page.emulateMedia({reducedMotion:'reduce'});return sample;
}

(async()=>{const browser=await chromium.launch();try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1024}]){
  const page=await browser.newPage({viewport,hasTouch:true,timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.route('**/src/store-app-mock.ts',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nfor(let i=0;i<993;i++) mockDateLots.push({...mockDateLots[i%7],id:`STRESS-${i}`,name:`Lô thử hiệu năng ${i}`});\n'});});
  await page.goto(`${base}/#reports`);const open=page.getByRole('button',{name:/^Báo cáo tổng hợp/});await open.waitFor();const started=Date.now();await open.click();await expect(page.locator('.report-composer')).toBeVisible();await expect(page.locator('.report-selection-bar')).toContainText('1000 / 1000 lô');
  const openMs=Date.now()-started;const nodes=await page.locator('*').count();const visible=page.locator(viewport.width<1100?'.date-report-card':'.date-report-table tbody tr');await expect(visible).toHaveCount(40);expect(openMs).toBeLessThan(3000);expect(nodes).toBeLessThan(3500);
  const gesture=await gestureProbe(page,cdp);
  await page.getByRole('button',{name:'Xem thêm 40 lô',exact:true}).click();await expect(visible).toHaveCount(80);
  const query=page.getByLabel('Tìm mã hàng hoặc lô báo cáo',{exact:true});await query.fill('STRESS-992');await expect(visible).toHaveCount(1);await expect(page.getByRole('checkbox',{name:'Chọn lô STRESS-992',exact:true})).toBeChecked();await query.fill('');await expect(visible).toHaveCount(40);
  await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();await page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
  const count=await page.evaluate(()=>{const key=Object.keys(localStorage).find(key=>key.startsWith('coopfood:mock-date-report-library:v1:'));const library=JSON.parse(localStorage.getItem(key));return library.history[0].rows.length;});expect(count).toBe(1000);await expect(visible).toHaveCount(40);
  const printStart=Date.now();await page.emulateMedia({media:'print'});await expect(page.locator('.date-report-table tbody tr')).toHaveCount(1000,{timeout:15000});const printMs=Date.now()-printStart;await expect(page.locator('.date-report-table svg')).toHaveCount(0);await page.emulateMedia({media:'screen'});await expect(visible).toHaveCount(40);
  await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();await expect(page.locator('.report-stage, .report-composer')).toHaveCount(0);
  // Warm caches first, then detect retained surfaces/nodes over repeated open/close.
  await cdp.send('HeapProfiler.collectGarbage');const before=(await cdp.send('Runtime.getHeapUsage')).usedSize;const baseNodes=await page.locator('*').count();
  for(let i=0;i<6;i++){await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await expect(page.locator('.report-composer')).toBeVisible();await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();await expect(page.locator('.report-stage, .report-composer')).toHaveCount(0);}
  await cdp.send('HeapProfiler.collectGarbage');const retainedBytes=(await cdp.send('Runtime.getHeapUsage')).usedSize-before;expect(retainedBytes).toBeLessThan(6*1024*1024);expect(await page.locator('*').count()).toBeLessThanOrEqual(baseNodes+10);
  const result={viewport,cpuRate:4,lots:1000,openMs,nodes,screenRows:40,printRows:1000,printMs,retainedBytes,cycles:6,gesture};results.push(result);console.log('PASS bounded report performance',result);await page.close();
 }
}finally{await browser.close();fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));}})().catch(e=>{console.error(e);process.exitCode=1});
