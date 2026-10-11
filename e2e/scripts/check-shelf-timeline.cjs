const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({ headless:true });
 fs.mkdirSync('.local/shelf-timeline', { recursive:true });
 try {
  for (const viewport of [{width:390,height:844},{width:1440,height:1024}]) {
   const page = await browser.newPage({viewport});
   await page.clock.setFixedTime(new Date('2026-10-06T00:00:00+07:00'));
   await page.goto(process.env.STORE_APP_URL || 'http://127.0.0.1:5175');
   await page.getByRole('button',{name:'Tra cứu lùi hàng',exact:true}).click();
   const nsx=page.getByRole('textbox',{name:'Ngày sản xuất',exact:true});
   const hsd=page.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true});
   await nsx.fill('01/08/2026'); await hsd.fill('09/11/2026');
   await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
   const track=page.locator('.store-timeline-track');
   const positions=await track.evaluate(el=>{
    const rail=el.getBoundingClientRect();
    return [...el.querySelectorAll('.store-timeline-milestone i')].map(i=>{
     const b=i.getBoundingClientRect(); return (b.x+b.width/2-rail.x)/rail.width*100;
    });
   });
   for(let i=0;i<4;i++) expect(Math.abs(positions[i]-[0,60,80,100][i])).toBeLessThan(.2);
   const today=page.getByRole('img',{name:'Hôm nay 06/10/2026',exact:true});
   await expect(today).toBeVisible();
   expect(await today.evaluate(el=>parseFloat(el.style.left))).toBe(66);
   await page.screenshot({path:`.local/shelf-timeline/result-${viewport.width}.png`,fullPage:true});
   // Under ten days: shared expiry/withdrawal marker, no invented warning.
   await nsx.fill('01/10/2026');await hsd.fill('09/10/2026');
   await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(track.locator('.store-timeline-milestone')).toHaveCount(2);
   await expect(track.getByText('Cảnh báo',{exact:true})).toHaveCount(0);
   await expect(track.getByText('Hạn lùi',{exact:true})).toBeVisible();
   await expect(track.getByText('HSD',{exact:true})).toBeVisible();
   // Outside the span, show direction at the edge without extending the scale.
   await nsx.fill('01/11/2026');await hsd.fill('10/11/2026');
   await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(today).toHaveAttribute('data-outside','before');
   await nsx.fill('01/09/2026');await hsd.fill('10/09/2026');
   await page.getByRole('button',{name:'Tra cứu',exact:true}).click();
   await expect(today).toHaveAttribute('data-outside','after');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
   await page.close(); console.log(`PASS timeline ${viewport.width}×${viewport.height}`);
  }
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
