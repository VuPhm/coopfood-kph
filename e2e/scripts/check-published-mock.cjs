const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.MOCKUP_URL || 'http://127.0.0.1:4297';
const output = process.env.STORE_PUBLIC_OUTPUT || '/tmp/coopfood-pub01-smoke';
fs.mkdirSync(output, {recursive:true});
(async () => {
  const browser = await chromium.launch({headless: true});
  const results = [];
  try {
    for (const viewport of [{width:390,height:844},{width:1440,height:1024}]) {
      const page = await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',acceptDownloads:true});
      const errors = [], badResponses = [], apiRequests = [], external = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('response', r => {if(r.status() >= 400) badResponses.push(`${r.status()} ${r.url()}`);});
      page.on('request', r => {if(new URL(r.url()).pathname.startsWith('/api')) apiRequests.push(r.url()); if(!r.url().startsWith(base) && !r.url().startsWith('blob:') && !r.url().startsWith('data:')) external.push(r.url());});
      await page.goto(base);
      await expect(page.locator('.store-screen-home')).toBeVisible();
      for (const route of ['home','kph','date','shelf','reports','notifications','login']) {
        await page.goto(`${base}/#${route}`);
        await expect(page.locator(route==='login'?'.store-login':`.store-screen-${route}`)).toBeVisible();
        if(route==='kph') await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
        await page.evaluate(()=>document.fonts.ready);
        if(route==='home') {
          await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
          const toast=page.getByRole('button',{name:'Đóng thông báo PWA',exact:true});
          if(await toast.isVisible()) await toast.click();
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),`${route} overflow`).toBe(true);
        await expect.poll(()=>page.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.getBoundingClientRect().width && (!i.complete || i.naturalWidth===0)).map(i=>i.src)),{message:`${route} images`,timeout:15000}).toEqual([]);
        await page.screenshot({path:path.join(output,`${route}-${viewport.width}.png`),fullPage:route!=='kph'});
      }
      await page.getByRole('button',{name:'Vào bản dùng thử',exact:true}).click();
      await expect(page.locator('.store-screen-home')).toBeVisible();
      await page.goto(`${base}/#kph`);
      const search=page.getByRole('textbox',{name:'Tìm tên hàng hoặc SKU',exact:true});
      await search.fill('0011730');
      await page.keyboard.press('Enter');
      await expect(page.locator('.store-result-count')).toHaveText('1 phiếu');
      await search.fill('');
      await page.keyboard.press('Escape');
      for(const kind of ['tpcn','tpts']) {
        await page.locator(`.store-create-actions .create-${kind}`).click();
        await expect(page.locator('#product-name')).toBeVisible();
        await page.locator('.store-create-screen').getByRole('button',{name:'Đóng',exact:true}).click();
      }
      await page.goto(`${base}/#shelf`);
      await page.getByRole('textbox',{name:'Ngày sản xuất',exact:true}).fill('01/10/2026');
      await page.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true}).fill('30/10/2026');
      await page.locator('#store-content').getByRole('button',{name:'Tra cứu',exact:true}).click();
      await expect(page.locator('.store-shelf-result')).not.toHaveAttribute('data-status','EMPTY');
      await page.screenshot({path:path.join(output,`shelf-result-${viewport.width}.png`),fullPage:true});
      await page.goto(`${base}/#reports`);
      await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
      const pwaNotice=page.getByRole('button',{name:'Đóng thông báo PWA',exact:true});
      if(await pwaNotice.isVisible()) await pwaNotice.click();
      await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();
      await page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();
      await expect(page.locator('.date-report-document-meta')).toBeVisible();
      const [download] = await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Xuất Excel',exact:true}).click()]);
      await download.saveAs(path.join(output,`download-${viewport.width}.xlsx`));
      expect(fs.statSync(path.join(output,`download-${viewport.width}.xlsx`)).size).toBeGreaterThan(1000);
      await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
      expect(errors,'JS errors').toEqual([]);
      expect(badResponses,'HTTP errors').toEqual([]);
      expect(apiRequests,'API calls').toEqual([]);
      expect(external,'external requests').toEqual([]);
      results.push({viewport,routes:7,kphSearchAndForms:true,shelfCalculation:true,reportSaveAndExcel:true,serviceWorkerReady:true,errors,badResponses,apiRequests,external});
      console.log(`PASS POLISH03 mockup ${viewport.width}×${viewport.height}: routes, KPH, Tra hạn, reports/Excel, PWA; no API/external requests`);
      await page.close();
    }
    fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify(results,null,2));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
