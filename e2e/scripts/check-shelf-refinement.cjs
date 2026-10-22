// Shelf02 main/quick material, input recovery, responsive controls and scoped contrast.
const {chromium,expect}=require('@playwright/test');const fs=require('node:fs');
const base=process.env.STORE_APP_URL||'http://127.0.0.1:4276';const output='.local/shelf02/refinement';
process.env.STORE_KPH_COLORS_OUTPUT=`${output}/contrast`;const {audit}=require('./check-kph-colors.cjs');fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch();const results=[];try{
 for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:740}]){
  for(const mode of ['main','quick']){
   const page=await browser.newPage({viewport,serviceWorkers:'block',reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));
   await page.goto(`${base}/#${mode==='main'?'shelf':'home'}`);
   if(mode==='quick')await page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng',exact:true}).click();
   const scope=mode==='main'?page.locator('.store-shelf'):page.getByRole('dialog',{name:'Tra cứu lùi hàng nhanh',exact:true});
   const form=scope.locator('.store-shelf-form'),result=scope.locator('.store-shelf-result');await expect(form).toBeVisible();await page.evaluate(()=>document.fonts.ready);
   await expect(result).toHaveCSS('border-top-color','rgb(223, 229, 233)');await expect(result).toHaveCSS('border-radius','18px');
   expect(await scope.evaluate(el=>[el,...el.querySelectorAll('*')].some(x=>{const s=getComputedStyle(x);return s.backdropFilter&&s.backdropFilter!=='none'}))).toBe(false);
   const initial=await scope.evaluate(el=>({height:el.getBoundingClientRect().height,form:el.querySelector('form').getBoundingClientRect().toJSON(),result:el.querySelector('.store-shelf-result').getBoundingClientRect().toJSON()}));
   await audit(page,mode==='main'?'.store-shelf':'.store-quick-panel',`${mode}-${viewport.width}-empty`);
   await page.screenshot({path:`${output}/${mode}-${viewport.width}-empty.png`});
   const nsx=form.getByRole('textbox',{name:'Ngày sản xuất',exact:true}),hsd=form.getByRole('textbox',{name:'Hạn sử dụng (HSD)',exact:true});
   await form.getByRole('button',{name:'Tra cứu',exact:true}).click();await expect(hsd).toHaveAttribute('aria-invalid','true');await expect(hsd).toBeFocused();
   const described=await hsd.getAttribute('aria-describedby');await expect(page.locator(`[id="${described}"]`)).toHaveAttribute('role','alert');
   await nsx.fill('01/10/2026');await hsd.fill('10/10/2026');await expect(result).toHaveAttribute('data-status','WARNING');
   await expect(result.locator('.store-result-primary')).toHaveText('Ngày lùi hàng08/10/2026');
   await audit(page,mode==='main'?'.store-shelf':'.store-quick-panel',`${mode}-${viewport.width}-warning`);
   await page.screenshot({path:`${output}/${mode}-${viewport.width}-result.png`});
   await hsd.fill('01/10/2026');await expect(form.getByRole('alert')).toHaveText('HSD phải sau NSX');
   await expect(hsd).toHaveAccessibleDescription('HSD phải sau NSX');await expect(result).toHaveAttribute('data-status','EMPTY');
   await audit(page,mode==='main'?'.store-shelf':'.store-quick-panel',`${mode}-${viewport.width}-error`);
   await hsd.fill('10/10/2026');await expect(form.getByRole('alert')).toHaveCount(0);await expect(result).toHaveAttribute('data-status','WARNING');
   await form.getByRole('switch').click();await expect(form.getByRole('textbox',{name:'Ngày sản xuất',exact:true})).toHaveCount(0);
   await form.getByRole('textbox',{name:'HSD (Số ngày)',exact:true}).fill('');await form.getByRole('button',{name:'Tra cứu',exact:true}).click();
   const days=form.getByRole('textbox',{name:'HSD (Số ngày)',exact:true});await expect(days).toBeFocused();await expect(days).toHaveAccessibleDescription(/Nhập thời hạn/);
   await days.fill('9');await expect(result.locator('.store-result-date')).toHaveText('10/10/2026');
   await form.getByRole('button',{name:'Chọn hạn sử dụng',exact:true}).click();await expect(page.getByRole('dialog',{name:'Lịch chọn ngày',exact:true})).toBeVisible();
   await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'Lịch chọn ngày',exact:true})).toHaveCount(0);await expect(form.getByRole('button',{name:'Chọn hạn sử dụng',exact:true})).toBeFocused();
   // Enlarge form type without double-scaling inherited fonts, including buttons.
   await form.evaluate(el=>{const nodes=[el,...el.querySelectorAll('*')].filter(x=>x instanceof HTMLElement);const sizes=nodes.map(x=>{const c=getComputedStyle(x);return [x,parseFloat(c.fontSize),parseFloat(c.lineHeight)]});for(const [x,f,l]of sizes){x.style.fontSize=`${f*1.5}px`;if(Number.isFinite(l))x.style.lineHeight=`${l*1.5}px`}});
   const clipped=await form.evaluate(el=>[...el.querySelectorAll('button,.store-known-toggle strong,label')].filter(x=>x.textContent.trim()&&x.scrollWidth>x.clientWidth+1).map(x=>x.textContent));
   expect(clipped,'150% form text fits controls').toEqual([]);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`${output}/${mode}-${viewport.width}-text150.png`});
   await form.getByRole('button',{name:'Làm mới',exact:true}).click();await expect(result).toHaveAttribute('data-status','EMPTY');
   if(mode==='quick'){
    await scope.getByRole('button',{name:'Đóng tiện ích',exact:true}).click();await expect(scope).toHaveCount(0);await expect(page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng',exact:true})).toBeFocused();
   }
   expect(errors).toEqual([]);results.push({viewport,mode,...initial});console.log(`PASS shelf refinement ${mode} ${viewport.width}: material, contrast, date/duration errors, picker, text150 and focus`);await page.close();
  }
 }
 fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
