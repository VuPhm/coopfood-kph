const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4221';
const output=process.env.STORE_REPORT_OUTPUT||'.local/reports-design/evidence-r14/fresh';
fs.mkdirSync(output,{recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT=output;
const {audit}=require('./check-kph-colors.cjs');
const props=(locator,keys)=>locator.evaluate((node,keys)=>Object.fromEntries(keys.map(key=>[key,getComputedStyle(node)[key]])),keys);
async function inspect(page,state,width){
 if(await page.locator('.report-sliding-cap').count()) await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),state+' page bounds').toBe(true);
 const dialog=page.getByRole('dialog');
 if(await dialog.count()){
  const box=await dialog.boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(width+1);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height+1);
  expect(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth+1),state+' dialog reflow').toBe(true);
 }
 await audit(page,'.report-composer, .date-report, .date-report-sheet',`${state}-${width}`);
 await page.screenshot({path:`${output}/${state}-${width}.png`,fullPage:!(await dialog.count())});
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
  await page.goto(`${base}/#date`);await expect(page.locator('.store-date')).toBeVisible();
  const heading=await props(page.locator('.store-date h2').first(),['fontSize','lineHeight','fontWeight']);
  const search=await props(page.locator('.store-date-search'),['height','borderRadius','borderColor','backgroundColor']);
  await page.getByRole('button',{name:'Lọc DATE',exact:true}).click();
  const choices=await props(page.locator('.store-date-filter .store-choices .is-selected').first(),['backgroundColor','color','fontSize','minHeight']);
  await page.keyboard.press('Escape');
  await page.goto(`${base}/#reports`);await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
  expect(await props(page.locator('.date-report-heading h2'),['fontSize','lineHeight','fontWeight'])).toEqual(heading);
  await inspect(page,'menu',viewport.width);
  await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
  const heroSearch=await props(page.locator('.report-composer-search input'),['height','borderRadius','borderColor','backgroundColor']);expect(heroSearch.height).toBe(search.height);expect(heroSearch.borderRadius).toBe(search.borderRadius);expect(heroSearch.backgroundColor).toBe(search.backgroundColor);
  // Both queries share the compact green plate and its inverse control boundary.
  expect(heroSearch.borderColor).toBe(search.borderColor);
  const list=page.locator(viewport.width<1100?'.date-report-cards':'.date-report-table');
  await expect(list.locator('.ui-list-item-marker')).toHaveCount(7);
  await expect(list.locator('[data-processing-status]')).toHaveCount(7);
  const bars=await list.locator('.ui-list-item-marker').evaluateAll(nodes=>nodes.map(node=>{const bar=node.getBoundingClientRect();const cell=node.parentElement.getBoundingClientRect();return {w:bar.width,h:bar.height,gutter:bar.x-cell.x};}));
  expect(bars.every(bar=>bar.w===3&&bar.h===(viewport.width<900?36:24)&&bar.gutter>=12)).toBe(true);
  await inspect(page,'composer',viewport.width);
  await bulk(page, 'Bỏ chọn toàn bộ');await page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).check();
  await page.getByLabel('Tìm mã hàng hoặc lô báo cáo',{exact:true}).fill('C24-118');
  await page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true}).click();
  expect(await props(page.locator('.date-report-sheet .store-choices .is-selected').first(),['backgroundColor','color','fontSize','minHeight'])).toEqual(choices);
  await page.getByRole('group',{name:'Tình trạng DATE',exact:true}).getByRole('button',{name:'Hết HSD',exact:true}).click();
  await page.getByRole('group',{name:'Trạng thái xử lý',exact:true}).getByRole('button',{name:'Mở',exact:true}).click();
  await inspect(page,'filter',viewport.width);
  // Make all choice rows scroll, while the native DATE filter footer stays reachable.
  await page.addStyleTag({content:'.date-report-sheet button,.date-report-sheet h3 {font-size:150%!important;line-height:1.5!important}'});
  await page.getByRole('button',{name:'Xong',exact:true}).scrollIntoViewIfNeeded();
  await inspect(page,'filter-large',viewport.width);
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await expect(page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true})).toBeFocused();
  await expect(page.locator('#report-filter-summary')).toContainText('Hết HSD');
  await expect(page.locator('.store-settings-badge')).toHaveText('2');
  await expect(page.getByLabel('Tìm mã hàng hoặc lô báo cáo',{exact:true})).toHaveValue('C24-118');
  await expect(page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true})).toBeChecked();
  await page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true}).click();
  await page.getByRole('button',{name:'Đặt lại bộ lọc',exact:true}).click();
  await page.getByRole('button',{name:'Xong',exact:true}).click();
  await expect(page.locator('.store-settings-badge')).toHaveCount(0);
  await page.getByRole('button',{name:'Chọn kỳ báo cáo',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tháng này',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Tuần này',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tuần này',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Tháng này',exact:true}).click();
  await inspect(page,'period',viewport.width);await page.getByRole('button',{name:'Áp dụng kỳ',exact:true}).click();
  await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();
  await expect(page.getByRole('region',{name:'Phạm vi báo cáo',exact:true})).toContainText('1 lô');
  await expect(page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true})).toBeFocused();
  await inspect(page,'create',viewport.width);await page.keyboard.press('Enter');
  await expect(page.locator('.date-report-document-meta')).toBeVisible();
  await page.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
  await inspect(page,'history',viewport.width);
  expect(errors).toEqual([]);await page.close();console.log(`PASS Fresh report alignment ${viewport.width}×${viewport.height}`);
 }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
