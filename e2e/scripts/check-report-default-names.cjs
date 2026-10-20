const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4221';
const output=process.env.STORE_REPORT_OUTPUT||'.local/reports-design/evidence-r14/default-names';
fs.mkdirSync(output,{recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT=output;
const {audit}=require('./check-kph-colors.cjs');
const results=[];
async function inspect(page,name,width){
 if(await page.locator('.report-sliding-cap').count()) await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await audit(page,'.report-composer, .date-report, .date-report-sheet',`${name}-${width}`);
  const box=await page.getByRole('dialog').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);
  expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height+1);
  await page.screenshot({path:`${output}/${name}-${width}.png`});
}

async function pick(page, control, value) {
 await control.click();
 await page.locator(`[role="option"][data-option-value="${value}"]`).click();
 await expect(control).toHaveAttribute('aria-expanded','false');
}
async function bulk(page, name) {
 await page.getByRole('button',{name:'Tùy chọn chọn lô',exact:true}).click();
 await page.getByRole('menuitem',{name,exact:true}).click();
}

(async()=>{
 const browser=await chromium.launch();
 try{
  for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]){
   const page=await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});
   await page.clock.install({time:new Date('2026-10-14T05:00:00Z')});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(`${base}/#reports`);
   await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
   await page.getByRole('button',{name:'Lưu thành mẫu',exact:true}).click();
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Tổng hợp DATE');
   await expect(page.getByRole('button',{name:'Lưu mẫu',exact:true})).toBeFocused();
   await inspect(page,'template-ready',viewport.width);
   await page.keyboard.press('Enter');
   await expect(page.getByRole('dialog')).toHaveCount(0);
   await expect(page.getByRole('button',{name:'Lưu thành mẫu',exact:true})).toBeFocused();
   await page.getByRole('button',{name:'Lưu thành mẫu',exact:true}).click();
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Tổng hợp DATE (2)');
   await page.getByLabel('Tên mẫu',{exact:true}).fill('');
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveAttribute('placeholder','Tổng hợp DATE (2)');
   await inspect(page,'template-holder',viewport.width);
   await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
   await page.getByRole('button',{name:'Lưu thành mẫu',exact:true}).click();
   await pick(page, page.getByLabel('Danh mục cho lần sau',{exact:true}), 'items');
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Tổng hợp DATE · 7 lô');
   await page.getByLabel('Tên mẫu',{exact:true}).fill('Mẫu ca sáng');
   await pick(page, page.getByLabel('Danh mục cho lần sau',{exact:true}), 'filter');
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Mẫu ca sáng');
   await page.keyboard.press('Escape');
   await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();
   const defaultTitle='Báo cáo tổng hợp · 01/10/2026 – 31/10/2026';
   await expect(page.getByLabel('Tên báo cáo',{exact:true})).toHaveValue(defaultTitle);
   await expect(page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true})).toBeFocused();
   await inspect(page,'report-ready',viewport.width);
   await page.keyboard.press('Enter');
   await expect(page.locator('.date-report-document-meta')).toContainText(defaultTitle);
   await page.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
   await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();
   await page.getByRole('button',{name:/^Tổng hợp DATE Theo điều kiện/}).click();
   await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Tổng hợp DATE');
   await page.getByLabel('Tên mẫu',{exact:true}).fill('');
   await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
   await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();
   await expect(page.locator('.report-custom-card')).toHaveCount(2); // update, not a duplicate
   await page.getByRole('button',{name:'Quản lý mẫu Tổng hợp DATE',exact:true}).click();
   await expect(page.getByRole('button',{name:'Lưu tên mẫu',exact:true})).toBeFocused();
   await page.getByRole('button',{name:'Nhân bản',exact:true}).click();
   await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Tổng hợp DATE (bản sao)');
   await page.getByLabel('Tên mẫu',{exact:true}).fill('');
   await page.getByRole('button',{name:'Tạo bản sao',exact:true}).click();
   await expect(page.locator('.report-custom-card')).toHaveCount(3);
   await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
   await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();
   await page.getByLabel('Tên báo cáo',{exact:true}).fill('  ');
   await page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();
   await expect(page.locator('.date-report-document-meta')).toContainText(defaultTitle);
   await page.reload();
   await expect(page.locator('.report-custom-card')).toHaveCount(3);
   await page.getByRole('button',{name:'Lịch sử 2',exact:true}).click();
   await expect(page.locator('.report-history-card')).toHaveCount(2);
   await expect(page.locator('.report-history-card').first()).toContainText(defaultTitle);
   expect(errors).toEqual([]);
   results.push({viewport,passed:true,history:2,templates:3,errors});
   console.log(`PASS ready names ${viewport.width}×${viewport.height}`);await page.close();
  }
 }finally{await browser.close();fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1});
