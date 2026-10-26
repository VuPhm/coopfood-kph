// Opt-in density: real settings, measured benefit, comfortable parity and workflow.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4340';
const baseline = process.env.STORE_BASELINE_URL || 'http://127.0.0.1:4341';
const output = process.env.STORE_DENSITY_OUTPUT || '.local/compact01/density';
const key = 'coopfood.store-ui.density.v1';
fs.mkdirSync(output, {recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
const viewports = [{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:900,height:650},{width:844,height:390}];
const reportSettings='.store-report-settings, .store-settings-group';
const selectors = {
  home: ['.store-header','.store-page-hero','.store-home-features','.store-module'],
  kph: ['.store-header','.store-kph-underlay','.store-kph-toolbar','.store-create-cta','.store-kph-list-controls','[data-record-id]'],
  date: ['.store-header','.store-date-search-form','.store-date-list-controls','.store-date-lot'],
  reports: ['.store-header','.report-composer-controls',reportSettings,'.report-selection-bar'],
  shelf: ['.store-header','.store-shelf-form','.store-shelf-result'],
  notifications: ['.store-header','.store-notification-section > summary','.store-notification-item'],
  login: ['.store-header','.store-login-form'],
};
async function settle(p) {
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))); });
}
async function route(p, url, screen) {
  await p.goto(`${url}/#${screen}`);
  if (screen === 'kph') await expect(p.locator('[data-record-id]').first()).toBeVisible();
  else if (screen === 'reports') { await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click(); await expect(p.locator(reportSettings)).toBeVisible(); }
  else await expect(p.locator(selectors[screen][0])).toBeVisible();
  await settle(p);
}
async function metrics(p, screen) {
  const data = {};
  for (const selector of selectors[screen]) {
    const locator = p.locator(selector).filter({visible:true}).first();
    if (!await locator.count()) continue;
    data[selector] = await locator.evaluate(el => { const b=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:b.x,y:b.y+scrollY,width:b.width,height:b.height,font:s.fontSize}; });
  }
  return data;
}
async function toggle(p, compact) {
  const trigger=p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true});
  await trigger.click();
  const control=p.getByRole('switch',{name:'Chế độ gọn',exact:true});
  await expect(control).toHaveAttribute('aria-checked', compact?'false':'true');
  await control.focus(); await p.keyboard.press('Space');
  await expect(control).toHaveAttribute('aria-checked',compact?'true':'false');
  await expect(p.locator('html')).toHaveAttribute('data-store-density',compact?'compact':'comfortable');
  await expect.poll(()=>p.evaluate(key=>localStorage.getItem(key),key)).toBe(compact?'compact':'comfortable');
  await p.keyboard.press('Escape'); await expect(trigger).toBeFocused(); await settle(p);
}
async function bounds(p) {
  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'page horizontal overflow').toBe(true);
  for (const dialog of await p.locator('[role="dialog"]:visible').all()) {
    const b=await dialog.boundingBox(); expect(b.x).toBeGreaterThanOrEqual(-1);expect(b.y).toBeGreaterThanOrEqual(-1);
    expect(b.x+b.width).toBeLessThanOrEqual(p.viewportSize().width+1);expect(b.y+b.height).toBeLessThanOrEqual(p.viewportSize().height+1);
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  }
}
async function touch(locator) { const b=await locator.boundingBox();expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44); }
async function formTextReflow(p, form, width) {
  for(const factor of [1.5,2]){
    await form.evaluate((root,factor)=>{
      const nodes=[...root.querySelectorAll('h3,label,legend,input:not(.sr-only),textarea,.choice-card span,button')].filter(n=>n instanceof HTMLElement&&n.getBoundingClientRect().width>1);
      const values=nodes.map(n=>({n,font:parseFloat(getComputedStyle(n).fontSize),line:parseFloat(getComputedStyle(n).lineHeight)}));
      for(const {n,font,line}of values){if(!n.dataset.reflowStyle)n.dataset.reflowStyle=JSON.stringify([n.style.fontSize,n.style.lineHeight]);n.style.fontSize=`${font*factor}px`;if(Number.isFinite(line))n.style.lineHeight=`${line*factor}px`;}
    },factor);
    await bounds(p);
    const clipped=await form.evaluate(root=>[...root.querySelectorAll('h3,legend,.choice-card,button')].filter(n=>{const b=n.getBoundingClientRect();return b.width>1&&b.height>1&&n.scrollWidth>n.clientWidth+1}).map(n=>n.textContent));
    expect(clipped,`Compact form text${factor*100} horizontal reflow`).toEqual([]);
    await p.screenshot({path:`${output}/form-text${factor*100}-${width}.png`});
    await form.evaluate(root=>{for(const n of root.querySelectorAll('[data-reflow-style]')){const [font,line]=JSON.parse(n.dataset.reflowStyle);n.style.fontSize=font;n.style.lineHeight=line;delete n.dataset.reflowStyle;}});
  }
}

(async()=>{
  const browser=await chromium.launch();const results=[];
  try {
    for (const viewport of viewports) {
      const context=await browser.newContext({viewport,timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block',reducedMotion:'reduce'});
      const p=await context.newPage(),ref=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
      const row={viewport,screens:{}};
      for (const screen of Object.keys(selectors)) {
        await route(ref,baseline,screen);const before=await metrics(ref,screen);
        await route(p,base,screen);
        // Return to default through the actual setting when persistence is compact.
        if(screen!=='login'&&await p.locator('html').getAttribute('data-store-density')==='compact')await toggle(p,false);
        const comfortable=await metrics(p,screen);
        for(const [selector,b]of Object.entries(before))for(const prop of ['x','y','width','height'])expect(Math.abs(comfortable[selector][prop]-b[prop]),`${screen} ${selector} comfortable ${prop}`).toBeLessThanOrEqual(1);
        if(screen==='login'){await expect(p.locator('html')).not.toHaveAttribute('data-store-density');continue;}
        await p.screenshot({path:`${output}/${screen}-${viewport.width}-comfortable.png`});
        await toggle(p,true);const compact=await metrics(p,screen);await bounds(p);
        expect(compact['.store-header'].height).toBe(comfortable['.store-header'].height);
        if(screen==='kph'){
          expect(compact['.store-kph-underlay'].height).toBeLessThan(comfortable['.store-kph-underlay'].height);
          const item='[data-record-id]';expect(compact[item].font).toBe(comfortable[item].font);
          // COMPACT02 permits secondary approval text to collapse. At900px this
          // removes baseline wrapping, so a percentage of that tall row is stale.
          // Keep the accepted two-line desktop floor and mobile readable-row floor;
          // the interaction gate below still checks actual44px controls.
          expect(compact[item].height).toBeGreaterThanOrEqual(viewport.width>=900?56:88);
          await touch(p.locator('.create-tpcn'));await touch(p.locator('.create-tpts'));
          await expect(p.locator('.store-scan-trigger')).toHaveCount(0);await expect(p.locator('.store-kph-list-toolbar .store-quick-sort-trigger')).toHaveCount(0);
          await expect(p.locator('.store-create-heading,.store-create-kind-label')).toHaveCount(0);
          await expect(p.locator('.create-tpcn')).toContainText('Tạo TPCN');
          await p.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
          const totalHeight=page=>page.locator('.store-kph-filter-section').evaluateAll(nodes=>nodes.reduce((sum,n)=>sum+n.getBoundingClientRect().height,0));
          await ref.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
          row.kphFilterHeight={comfortable:await totalHeight(ref),compact:await totalHeight(p)};
          await expect(p.locator('.store-kph-filter-section').first()).toHaveCSS('box-shadow','none');
          await p.getByRole('group',{name:'Thứ tự phiếu'}).getByRole('button',{name:'Tên hàng',exact:true}).click();
          await p.getByRole('group',{name:'Thứ tự phiếu'}).getByRole('button',{name:'Mới nhất',exact:true}).click();
          expect(row.kphFilterHeight.compact).toBeLessThan(row.kphFilterHeight.comfortable);await ref.keyboard.press('Escape');
          await bounds(p);await audit(p,'.store-kph-filter',`compact-filter-${viewport.width}`);await p.screenshot({path:`${output}/kph-filter-${viewport.width}.png`});await p.keyboard.press('Escape');
        }
        if(screen==='date'){
          await touch(p.locator('.store-date-search-form > .store-button'));
          await expect(p.locator('.store-date-toolbar .store-quick-sort-trigger,.store-date-add')).toHaveCount(0);
          await p.getByRole('button',{name:'Lọc DATE',exact:true}).click();await bounds(p);await p.keyboard.press('Escape');
        }
        if(screen==='reports'){
          await expect(p.locator('.store-settings-row')).toHaveCount(0);
          await touch(p.locator('.store-report-filter-inline'));
          const settingsGeometry=await p.locator('.store-report-settings-inline').evaluate(el=>{const a=el.querySelectorAll('button');return [...a].map(n=>{const b=n.getBoundingClientRect();return {y:b.y+b.height/2,h:b.height};});});
          expect(Math.abs(settingsGeometry[0].y-settingsGeometry[1].y)).toBeLessThanOrEqual(1);
          const face=await p.locator('.store-report-filter-inline').evaluate(el=>({face:parseFloat(getComputedStyle(el,'::before').width),hit:el.getBoundingClientRect().width}));
          expect(face.hit).toBeGreaterThanOrEqual(44);expect(face.face).toBeLessThan(face.hit);
          expect(compact[reportSettings].height).toBeLessThan(comfortable[reportSettings].height);
          await p.getByRole('button',{name:'Đổi mẫu báo cáo',exact:true}).click();
          const dialog=p.locator('.store-choice-sheet');await expect(dialog).toBeVisible();await touch(dialog.locator('.store-search-field > button').first().or(dialog.locator('.store-choice-actions button').first()).first());
          await bounds(p);await p.screenshot({path:`${output}/choice-${viewport.width}.png`});await p.keyboard.press('Escape');
        }
        if(screen==='reports')await audit(p,'.store-report-settings',`settings-compact-${viewport.width}`);
        await p.screenshot({path:`${output}/${screen}-${viewport.width}-compact.png`});
        // Screen rules must not affect print, including report outputs.
        await p.emulateMedia({media:'print'});await settle(p);const printCompact=await metrics(p,screen);
        await ref.emulateMedia({media:'print'});const printBase=await metrics(ref,screen);
        for(const selector of Object.keys(printBase))expect(printCompact[selector],`${screen} print geometry`).toEqual(printBase[selector]);
        await p.emulateMedia({media:'screen'});await ref.emulateMedia({media:'screen'});
        row.screens[screen]={comfortable,compact};
      }

      // KPH state survives toggling and records remain anchored while scrolled.
      await route(p,base,'kph');await p.getByRole('button',{name:'Chọn',exact:true}).click();
      const checkbox=p.locator('.store-ticket-selector input,tbody .store-kph-table-selector input').filter({visible:true}).first();await checkbox.check();
      const selectedName=await checkbox.getAttribute('aria-label');
      const group=p.locator('.store-kph-day-toggle').nth(1);await group.click();
      const expanded=await p.locator('.store-kph-day-toggle').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-expanded')));
      // Keep account actually reachable: the accepted white cover hides the hero at deep scroll.
      await p.evaluate(()=>scrollTo(0,64));await settle(p);
      expect(await p.locator('.store-account').evaluate(el=>{const b=el.getBoundingClientRect();return el.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2));})).toBe(true);
      const visible=p.locator('[data-record-id]').filter({visible:true});
      const anchor=await visible.evaluateAll(nodes=>{const threshold=document.querySelector('.store-page-hero').getBoundingClientRect().bottom;const el=nodes.find(n=>{const b=n.getBoundingClientRect();return b.bottom>threshold&&b.top<innerHeight});return el?{id:el.dataset.recordId,y:el.getBoundingClientRect().top}:null;});
      await toggle(p,false);await expect(p.getByRole('checkbox',{name:selectedName,exact:true})).toBeChecked();
      expect(await p.locator('.store-kph-day-toggle').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-expanded')))).toEqual(expanded);
      if(anchor){const after=await p.locator(`[data-record-id="${anchor.id}"]`).filter({visible:true}).boundingBox();expect(Math.abs(after.y-anchor.y),'reading anchor').toBeLessThanOrEqual(2);}
      await toggle(p,true);await p.reload();await expect(p.locator('html')).toHaveAttribute('data-store-density','compact');

      // Real filter/query/report selection survive the settings route-less overlay.
      await route(p,base,'reports');await p.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).uncheck();
      const query=p.getByLabel('Tìm mã hàng hoặc lô báo cáo',{exact:true});await query.fill('0008421');
      await toggle(p,false);await expect(query).toHaveValue('0008421');await query.fill('');
      await expect(p.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true})).not.toBeChecked();await toggle(p,true);

      // Narrow viewports and enlarged text: controls grow instead of clipping.
      for(const factor of [1.5,2]){
        await p.evaluate(factor=>{for(const el of document.querySelectorAll('.store-report-period-inline span,.store-report-filter-context,.report-selection-bar button')){if(!el.dataset.densityFont)el.dataset.densityFont=getComputedStyle(el).fontSize;el.style.fontSize=`${parseFloat(el.dataset.densityFont)*factor}px`;el.style.lineHeight='1.5';}},factor);
        await bounds(p);
      }
      await p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true}).click();await p.getByRole('switch',{name:'Chế độ gọn'}).scrollIntoViewIfNeeded();await touch(p.getByRole('switch',{name:'Chế độ gọn'}));await bounds(p);
      await audit(p,'.store-appearance-settings',`appearance-${viewport.width}`);await p.emulateMedia({forcedColors:'active'});await expect(p.getByRole('switch',{name:'Chế độ gọn'})).toHaveAttribute('aria-checked','true');await p.keyboard.press('Escape');
      expect(errors).toEqual([]);results.push(row);fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));await context.close();console.log(`PASS density ${viewport.width}x${viewport.height}: comfortable parity, real toggle, metrics, portals, state, print and reflow`);
    }
    // Business actions under Compact, not merely CSS probes. Synthetic photo only.
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=','base64');
    for(const viewport of viewports.slice(0,2)){
      const p=await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',serviceWorkers:'block',reducedMotion:'reduce'});
      await p.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
      await route(p,base,'date');await toggle(p,true);
      for(const [id,kind]of[['A24-255','tpcn'],['C24-118','tpts']]){
        await p.getByRole('textbox',{name:'Tìm SKU, barcode, tên hàng hoặc lô'}).fill(id);
        const lot=p.locator(`[data-date-lot-id="${id}"]`);await lot.click();
        const detail=p.getByRole('dialog',{name:'Chi tiết lô DATE'});
        await detail.getByRole('button',{name:'Ghi nhận',exact:true}).click();
        await detail.getByRole('radio',{name:kind==='tpcn'?/1 ngày/:/1 tuần/}).check();
        await detail.getByRole('button',{name:'Hẹn báo lại',exact:true}).click();
        await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status','acknowledged');
        await lot.click();
        await detail.getByRole('button',{name:'Xử lý',exact:true}).click();
        const form=p.locator('.store-create-screen');await expect(form.locator('#product-name')).toBeAttached();
        await expect(form).toHaveAttribute('data-kind',kind);await bounds(p);
        if(kind==='tpcn')await formTextReflow(p,form,viewport.width);
        const quantity=form.getByRole('textbox',{name:'Số lượng',exact:true});await quantity.fill('0');
        await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(quantity).toHaveAccessibleDescription('Số lượng phải lớn hơn 0');await expect(quantity).toBeFocused();
        await quantity.fill('1');await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form.locator('#kph-photo-feedback')).toBeFocused();
        await form.getByLabel('Chọn ảnh',{exact:true}).setInputFiles({name:'density-synthetic.png',mimeType:'image/png',buffer:png});
        await expect(form.getByRole('button',{name:'Xem ảnh minh chứng 1',exact:true})).toBeVisible();
        await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form.locator('.store-form-review')).toContainText(id);
        await audit(p,'.store-create-screen',`${kind}-compact-${viewport.width}`);
        await p.screenshot({path:`${output}/${kind}-review-${viewport.width}.png`});await form.getByRole('button',{name:'Gửi phiếu',exact:true}).click();
        await expect(form).toHaveCount(0);await expect(lot).toHaveCount(0);
      }
      await p.evaluate(()=>{location.hash='kph'});await expect(p.locator('[data-record-id]').first()).toBeVisible();
      const created=p.locator('[data-record-id]').filter({visible:true}).first();await expect(created).toContainText('Chờ duyệt');
      await created.locator('.store-ticket-open,.store-kph-row-open').click();await expect(p.getByRole('dialog',{name:'Chi tiết phiếu KPH'})).toContainText('C24-118');await p.keyboard.press('Escape');
      await route(p,base,'reports');
      await p.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();await p.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();await expect(p.locator('.date-report-document-meta')).toBeVisible();
      const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Xuất Excel',exact:true}).click();const download=await downloadPromise;
      const xlsx=`${output}/report-${viewport.width}.xlsx`;await download.saveAs(xlsx);
      const ExcelJS=require('exceljs');const book=new ExcelJS.Workbook();await book.xlsx.readFile(xlsx);const sheet=book.getWorksheet('DATE');expect(sheet.rowCount).toBe(16);expect(sheet.getRow(10).getCell(1).type).toBe(3);
      await p.emulateMedia({media:'print'});await expect(p.locator('.date-report')).toHaveAttribute('data-printing','true');await expect(p.locator('.date-report-table tbody tr')).toHaveCount(7);
      await p.pdf({path:`${output}/report-${viewport.width}.pdf`,format:'A4',landscape:true,printBackground:true});
      await p.emulateMedia({media:'screen'});await p.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();await expect(p.getByRole('region',{name:'Báo cáo đã tạo',exact:true}).getByRole('button').first()).toBeVisible();
      await p.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));await route(p,base,'shelf');
      const form=p.locator('.store-shelf-form'),result=p.locator('.store-shelf-result');
      await form.getByRole('textbox',{name:'Ngày sản xuất',exact:true}).fill('01/10/2026');await form.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true}).fill('10/10/2026');
      await expect(result.locator('.store-result-primary')).toHaveText('Ngày lùi hàng08/10/2026');await bounds(p);await p.close();
      console.log(`PASS Compact actions ${viewport.width}: reminder1/7, TPCN/TPTS validation/photo/review/save, KPH, report Excel/PDF/history and shelf-life`);
    }
    // Storage denied/malformed and leaving Fresh must be safe in a real browser.
    for(const mode of ['invalid','denied']){
      const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
      await context.addInitScript(({key,mode})=>{if(mode==='invalid')localStorage.setItem(key,'unknown-density');else{Storage.prototype.getItem=()=>{throw new Error('denied')};Storage.prototype.setItem=()=>{throw new Error('denied')};}},{key,mode});
      const p=await context.newPage();await route(p,base,'home');await expect(p.locator('html')).toHaveAttribute('data-store-density','comfortable');
      await p.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true}).click();await p.getByRole('switch',{name:'Chế độ gọn'}).click();await expect(p.locator('html')).toHaveAttribute('data-store-density','compact');
      if(mode==='denied')await expect(p.getByRole('status').filter({hasText:'Đang áp dụng trong phiên này'})).toBeVisible();
      await p.getByRole('button',{name:'Xem trang đăng nhập',exact:true}).click();await expect(p.locator('.store-login')).toBeVisible();await expect(p.locator('html')).not.toHaveAttribute('data-store-density');
      await p.getByRole('button',{name:'Vào bản dùng thử',exact:true}).click();await expect(p.locator('html')).toHaveAttribute('data-store-density','compact');await context.close();
    }
    fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
