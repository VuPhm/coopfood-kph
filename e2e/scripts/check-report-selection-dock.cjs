const {chromium,expect}=require('@playwright/test');
const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4221';
const output=process.env.STORE_REPORT_OUTPUT||'.local/reports-design/evidence-r14/selection-dock';fs.mkdirSync(output,{recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT=output;const {audit}=require('./check-kph-colors.cjs');
async function inspect(page,state,width){
 if(await page.locator('.report-sliding-cap').count()) await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),state+' page bounds').toBe(true);
 await audit(page,'.report-composer, .date-report, .date-report-sheet, .store-choice-sheet, .store-dropdown',`${state}-${width}`);
 for(const popup of await page.locator('[role="listbox"], [role="menu"]').all()){
  const box=await popup.boundingBox();expect(box.x).toBeGreaterThanOrEqual(11);expect(box.x+box.width).toBeLessThanOrEqual(width-11);expect(box.y).toBeGreaterThanOrEqual(11);expect(box.y+box.height).toBeLessThanOrEqual(page.viewportSize().height-11);
 }
 await page.screenshot({path:`${output}/${state}-${width}.png`});
}
async function choose(page, name){await page.getByRole('button',{name:'Tùy chọn chọn lô',exact:true}).click();await page.getByRole('menuitem',{name,exact:true}).click();}
async function dockBounds(page){
 await expect(page.locator(".report-composer")).toBeVisible();
 const dock=page.getByRole('region',{name:'Thao tác báo cáo'});
 const navControl=page.locator('.store-mobile-toolbar:visible');
 await expect.poll(async()=>{const box=await dock.boundingBox();const nav=await navControl.count()?await navControl.boundingBox():null;return !!box&&box.x>=0&&box.y>=0&&box.x+box.width<=page.viewportSize().width+1&&box.y+box.height<=(nav?.y??page.viewportSize().height)-8;}).toBe(true);
 const box=await dock.boundingBox();const nav=await navControl.count()?await navControl.boundingBox():null;
 expect(box.x).toBeGreaterThanOrEqual(0);expect(box.y).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(page.viewportSize().width+1);expect(box.y+box.height).toBeLessThanOrEqual((nav?.y??page.viewportSize().height)-8);
 await expect(dock.getByRole('button',{name:'Tạo bản báo cáo',exact:true})).toBeInViewport();
 return dock;
}
(async()=>{const browser=await chromium.launch();try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]){
  const page=await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});await page.clock.install({time:new Date('2026-10-14T05:00:00Z')});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(viewport.width===1440)await page.setViewportSize({width:1440,height:844});
  await page.goto(`${base}/#reports`);await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
  const dock=await dockBounds(page);await expect(dock).toHaveAttribute('data-floating','true');await expect(page.getByRole('button',{name:'Tạo bản báo cáo',exact:true})).toHaveCount(1);
  await inspect(page,'initial-dock',viewport.width);
  const scope=page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true});await scope.click();
  const phase=page.getByRole('group',{name:'Tình trạng DATE',exact:true});await phase.getByRole('button',{name:'Cần chú ý',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Xong',exact:true}).click();await expect(scope).toBeFocused();await expect(scope).toContainText('Cần chú ý');
  await scope.click();await page.getByRole('button',{name:'Đặt lại bộ lọc',exact:true}).click();await page.getByRole('button',{name:'Xong',exact:true}).click();
  const master=page.getByRole('checkbox',{name:'Chọn tất cả lô đang hiển thị',exact:true});await expect(master).toBeChecked();await master.uncheck();
  await expect(dock.getByRole('button',{name:'Tạo bản báo cáo',exact:true})).toBeDisabled();await expect(dock).toContainText('Chọn ít nhất 1 lô');
  await page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).check();await expect(master).toHaveAttribute('aria-checked','mixed');
  const query=page.getByLabel('Tìm mã hàng hoặc lô báo cáo',{exact:true});await query.fill('0008421');
  await page.getByRole('button',{name:'Tùy chọn chọn lô',exact:true}).click();await expect(page.getByRole('menuitem',{name:'Bỏ chọn kết quả đang xem',exact:true})).toBeDisabled();await inspect(page,'scoped-selection-menu',viewport.width);await page.keyboard.press('Escape');
  await choose(page,'Chọn kết quả đang xem');await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 4 / 7 lô');await expect(master).toBeChecked();
  await master.uncheck();await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 1 / 7 lô');
  await choose(page,'Đảo lựa chọn đang xem');await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 4 / 7 lô');
  await choose(page,'Bỏ chọn toàn bộ');await choose(page,'Chọn toàn bộ danh mục');await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 7 / 7 lô');
  await query.fill('');await page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).focus();
  // Scroll-margin keeps a keyboard-focused row control clear of the dock.
  const focused=page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true});
  await expect.poll(async()=>{const box=await focused.boundingBox();const actions=await dock.boundingBox();return box.y+box.height<=actions.y-8;}).toBe(true);
  expect(await focused.evaluate(node=>{const b=node.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)===node;})).toBe(true);
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await expect(dock).toHaveAttribute('data-floating','false');await dockBounds(page);await inspect(page,'settled-actions',viewport.width);
  await page.evaluate(()=>window.scrollTo(0,0));await expect(dock).toHaveAttribute('data-floating','true');
  await dock.getByRole('button',{name:'Lưu thành mẫu',exact:true}).click();
  const mode=page.getByRole('combobox',{name:'Danh mục cho lần sau',exact:true});await mode.click();await page.getByRole('option',{name:'Đúng 7 lô đang chọn',exact:true}).click();await expect(mode).toBeFocused();
  await expect(page.getByRole('dialog',{name:'Lưu mẫu báo cáo'})).toBeVisible();await inspect(page,'nested-dropdown',viewport.width);await page.keyboard.press('Escape');
  await expect(dock.getByRole('button',{name:'Lưu thành mẫu',exact:true})).toBeFocused();
  await page.addStyleTag({content:'.date-report button,.date-report strong,.date-report label {font-size:150%!important;line-height:1.5!important}'});
  await dockBounds(page);await inspect(page,'large-actions',viewport.width);
  await page.setViewportSize({width:viewport.width,height:viewport.height-120});await dockBounds(page);await inspect(page,'short-viewport',viewport.width);
  if(viewport.width===390){await page.setViewportSize({width:1440,height:1024});await dockBounds(page);await page.setViewportSize({width:320,height:844});await dockBounds(page);}
  expect(errors).toEqual([]);await page.close();console.log(`PASS selection and flexible action dock ${viewport.width}×${viewport.height}`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
