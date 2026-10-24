// Real actions, material/state parity and chrome boundaries; synthetic preview only.
const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4306';
const baseline=process.env.STORE_BASELINE_URL||'http://127.0.0.1:4304';
const output=process.env.STORE_BUTTON_OUTPUT||'.local/form01/r4-buttons';fs.mkdirSync(output,{recursive:true});
process.env.STORE_KPH_COLORS_OUTPUT=`${output}/contrast`;const{audit}=require('./check-kph-colors.cjs');
async function props(el){return el.evaluate(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{w:r.width,h:r.height,x:r.x,y:r.y,image:s.backgroundImage,fill:s.backgroundColor,ink:s.color,edge:s.borderColor,shadow:s.boxShadow,opacity:s.opacity,radius:s.borderRadius,translate:s.translate,filter:s.filter};});}
async function parity(a,b){await Promise.all([a,b].map(el=>el.evaluate(async e=>Promise.all(e.ownerDocument.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{}))))));const[x,y]=await Promise.all([props(a),props(b)]);expect(Math.abs(x.w-y.w)).toBeLessThanOrEqual(1);expect(Math.abs(x.h-y.h)).toBeLessThanOrEqual(1);return{x:x.w,y:x.h};}
async function ready(p,url,route){await p.goto(`${url}/#${route}`);await expect(p.locator(route==='login'?'.store-login':`.store-app.store-screen-${route}`)).toBeVisible();if(route==='kph')await expect(p.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();if(route==='home')await expect(p.locator('.store-home-welcome')).toBeVisible();if(route==='reports')await expect(p.locator('.report-type-card').first()).toBeVisible();await p.evaluate(()=>document.fonts.ready);}
async function fits(p){expect(await p.locator('html').evaluate(e=>e.scrollWidth<=e.clientWidth+1)).toBe(true);}
(async()=>{const browser=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});const results=[];let sharedMarkup='';try{
 for(const viewport of[{width:390,height:844},{width:1440,height:1024},{width:320,height:844},{width:375,height:812},{width:844,height:390}]){
  const p=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'}),old=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'no-preference'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await ready(p,base,'kph');await ready(old,baseline,'kph');
  const cap=await parity(p.locator('.store-page-surface'),old.locator('.store-page-surface'));
  if(viewport.width>=900){await parity(p.locator('.store-desktop-rail'),old.locator('.store-desktop-rail'));expect((await props(p.locator('.store-desktop-rail'))).shadow).not.toBe('none');}
  else{await parity(p.locator('.store-mobile-toolbar'),old.locator('.store-mobile-toolbar'));expect((await props(p.locator('.store-mobile-toolbar'))).shadow).not.toBe('none');}
  await p.locator('.create-tpts').click();await old.locator('.create-tpts').click();await expect(p.locator('#supplier')).toBeVisible();await expect(old.locator('#supplier')).toBeVisible();
  const form=p.locator('.store-create-screen'),oldForm=old.locator('.store-create-screen');await parity(form,oldForm);
  const action=form.getByRole('button',{name:'Xem lại',exact:true}),oldAction=oldForm.getByRole('button',{name:'Xem lại',exact:true});const geometry=await parity(action,oldAction);
  await expect(action).toHaveAttribute('data-variant','primary');await expect(action).not.toHaveCSS('background-image','none');await expect(action).toHaveCSS('border-radius','16px');
  sharedMarkup=await action.evaluate(e=>e.outerHTML);const normal=await props(action);await audit(p,'.create-dialog-footer',`primary-${viewport.width}`);
  await action.hover();await audit(p,'.create-dialog-footer',`hover-${viewport.width}`);expect((await props(action)).image).not.toBe(normal.image);
  const box=await action.boundingBox();await p.mouse.down();await audit(p,'.create-dialog-footer',`pressed-${viewport.width}`);expect((await props(action)).filter).toBe('none');
  const active=await action.boundingBox();expect(active.y).toBe(box.y);await p.mouse.move(1,1);await p.mouse.up();
  await p.keyboard.press('Tab');await action.focus();await expect(action).toHaveCSS('outline-width','3px');await audit(p,'.create-dialog-footer',`focus-${viewport.width}`);
  await p.screenshot({path:`${output}/kph-${viewport.width}.png`});await p.keyboard.press('Escape');await old.keyboard.press('Escape');
  const select=p.locator('.store-compact');await select.click();await expect(select).toHaveAttribute('aria-pressed','true');await expect(select).not.toHaveCSS('background-image','none');await select.click();
  await p.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();await old.getByRole('button',{name:'Lọc phiếu KPH',exact:true}).click();
  const dialog=p.getByRole('dialog'),oldDialog=old.getByRole('dialog');await parity(dialog,oldDialog);await expect(dialog).not.toHaveCSS('box-shadow','none');
  const done=dialog.getByRole('button',{name:'Xong',exact:true});await expect(done).not.toHaveCSS('background-image','none');await audit(p,'.store-kph-sheet',`filter-${viewport.width}`);await p.screenshot({path:`${output}/filter-${viewport.width}.png`});await p.keyboard.press('Escape');await old.keyboard.press('Escape');
  // Native login and shared report actions use the same disabled/enabled tokens.
  await ready(p,base,'login');const login=p.getByRole('button',{name:'Đăng nhập',exact:true});await expect(login).toBeDisabled();await expect(login).toHaveCSS('opacity','1');await expect(login).toHaveCSS('background-image','none');const disabled=await props(login);
  await p.getByLabel('Tên đăng nhập',{exact:true}).fill('button-preview');await p.getByLabel('Mật khẩu',{exact:true}).fill('synthetic-password');await expect(login).toBeEnabled();await expect(login).not.toHaveCSS('background-image','none');
  await login.click();await expect(p.getByRole('status')).toContainText('chưa khả dụng');await expect(p.getByLabel('Mật khẩu',{exact:true})).toHaveValue('synthetic-password');
  await ready(p,base,'reports');await p.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();await p.getByRole('checkbox',{name:'Chọn tất cả lô đang hiển thị',exact:true}).uncheck();
  const create=p.getByRole('button',{name:'Tạo bản báo cáo',exact:true});await expect(create).toBeDisabled();await expect(create).toHaveCSS('background-color',disabled.fill);await expect(create).toHaveCSS('color',disabled.ink);const sharedDisabled=await props(create);expect(sharedDisabled.fill).toBe(disabled.fill);expect(sharedDisabled.ink).toBe(disabled.ink);expect(sharedDisabled.opacity).toBe('1');
  await p.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).check();await expect(create).toBeEnabled();await expect(create).not.toHaveCSS('background-image','none');await audit(p,'.store-action-dock',`report-action-${viewport.width}`);await fits(p);
  await p.screenshot({path:`${output}/reports-${viewport.width}.png`});
  await p.emulateMedia({reducedMotion:'reduce'});await ready(p,base,'shelf');const lookup=p.getByRole('button',{name:'Tra cứu',exact:true});await expect(lookup).toHaveCSS('box-shadow','none');await expect(p.locator('.store-page-surface')).toHaveCSS('box-shadow','none');
  await p.emulateMedia({contrast:'more'});await lookup.focus();await expect(lookup).toHaveCSS('outline-width','3px');await expect(lookup).toHaveCSS('background-image','none');await fits(p);
  await p.emulateMedia({forcedColors:'active'});await fits(p);expect(errors).toEqual([]);results.push({viewport,cap,geometry,nativeSharedDisabledParity:true,primaryStates:true,chrome:true});
  await p.close();await old.close();console.log(`PASS button system ${viewport.width}x${viewport.height}: primary/hover/press/focus, native/shared disabled recovery, selection, cap/modal/navigation geometry, reduced/contrast preferences`);
 }
 // Shared marker is inert without a Fresh surface, with all application styles still loaded.
 const isolated=await browser.newPage();await isolated.goto(`${base}/#login`);await isolated.locator('.store-login').evaluate(e=>e.remove());await isolated.locator('body').evaluate((e,html)=>e.innerHTML=html,sharedMarkup);await expect(isolated.locator('button')).toHaveCSS('background-image','none');await expect(isolated.locator('button')).toHaveCSS('background-color','rgb(0, 102, 51)');await isolated.close();
 fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
