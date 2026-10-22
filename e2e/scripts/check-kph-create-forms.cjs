// Synthetic Store Fresh forms: material, accessible validation and photo recovery.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4272';
const output = process.env.STORE_CREATE_FORMS_OUTPUT || '.local/kph03-create-forms';
process.env.STORE_KPH_COLORS_OUTPUT = `${output}/contrast`;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jf1sAAAAASUVORK5CYII=', 'base64');
(async () => {
 const browser = await chromium.launch(); const results = [];
 try {
  for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]) {
   const page = await browser.newPage({viewport, serviceWorkers:'block', reducedMotion:'no-preference'});
   const errors=[]; page.on('pageerror', e => errors.push(e.message));
   for (const kind of ['tpcn','tpts']) {
    await page.goto(`${base}/#kph`); const opener=page.locator(`.create-${kind}`); await opener.click();
    const form=page.locator('.store-create-screen'); await expect(form.locator('#product-name')).toBeAttached();
    await page.evaluate(()=>document.fonts.ready);
    await expect(form.locator('.form-section')).toHaveCount(4);
    await expect(form.locator('.form-section').first().getByRole('textbox',{name:'Số lượng',exact:true})).toHaveValue('1');
    await expect(form.getByRole('radio',{name:kind==='tpcn'?'Cận date':'Dập úng',exact:true})).toBeChecked();
    await expect(form.locator('#detected-date')).toHaveAttribute('readonly','');
    await expect(form.locator('#detected-by')).toHaveAttribute('readonly','');
    await expect(form.locator('.form-section').first()).toHaveCSS('border-top-color','rgb(223, 229, 233)');
    const unselected=form.locator('.choice-card').filter({has:page.locator('input:not(:checked)')}).first();
    await expect(unselected).toHaveCSS('border-top-color','rgba(0, 0, 0, 0)');
    expect(await unselected.evaluate(el=>getComputedStyle(el).transitionProperty)).not.toContain('box-shadow');
    expect(await unselected.evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('linear-gradient');
    expect(await form.evaluate(root=>[root,...root.querySelectorAll('*')].some(el=>{const s=getComputedStyle(el);return s.backdropFilter!=='none'&&s.backdropFilter!==''}))).toBe(false);
    const metrics=await form.locator('.create-dialog-form').evaluate(el=>({scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,sections:[...el.querySelectorAll('.form-section')].map(x=>({title:x.querySelector('h3').textContent,height:x.getBoundingClientRect().height}))}));
    await audit(page,'.store-create-screen',`${kind}-${viewport.width}-default`);
    await page.screenshot({path:`${output}/${kind}-${viewport.width}-top.png`});
    await form.getByRole('button',{name:'Xem lại',exact:true}).click();
    const product=form.getByLabel('Tên hàng hóa',{exact:true});
    await expect(product).toHaveAttribute('aria-invalid','true');
    await expect(product).toHaveAccessibleDescription('Nhập SKU/UPC hoặc tên hàng hóa');
    await expect(product).toBeFocused();
    const quantity=form.getByRole('textbox',{name:'Số lượng',exact:true}); await quantity.fill('0');
    await form.getByRole('button',{name:'Xem lại',exact:true}).click();
    await expect(quantity).toHaveAttribute('aria-invalid','true');
    await expect(quantity).toHaveAccessibleDescription('Số lượng phải lớn hơn 0');
    await product.fill('Hàng tổng hợp kiểm thử'); await quantity.fill('2');
    await form.getByRole('group',{name:'Tình trạng',exact:true}).locator('label').filter({has:page.getByRole('radio',{name:'Khác',exact:true})}).click();
    await expect(form.getByLabel('Nội dung tình trạng khác',{exact:true})).toBeVisible();
    const other=form.getByRole('group',{name:'Tình trạng',exact:true}).getByRole('radio',{name:'Khác',exact:true});
    await other.focus();
    const focusBounds=await other.locator('..').boundingBox();
    const footerBounds=await form.locator('.create-dialog-footer').boundingBox();
    expect(focusBounds.y+focusBounds.height).toBeLessThanOrEqual(footerBounds.y);

    await form.getByRole('group',{name:'Biện pháp xử lý',exact:true}).locator('label').filter({has:page.getByRole('radio',{name:'KHÁC',exact:true})}).click();
    await expect(form.getByLabel('Nội dung biện pháp khác',{exact:true})).toBeVisible();
    await form.getByRole('button',{name:'Chọn ngày xử lý (nếu có)',exact:true}).click();
    await expect(page.getByRole('dialog',{name:'Lịch chọn ngày',exact:true})).toBeVisible();
    await page.keyboard.press('Escape'); await expect(form).toBeVisible();
    await expect(page.getByRole('dialog',{name:'Lịch chọn ngày',exact:true})).toHaveCount(0);
    await form.getByRole('button',{name:'Xem lại',exact:true}).click();
    await expect(form.locator('#kph-photo-feedback')).toBeFocused();
    await expect(form.locator('#kph-photo-feedback')).toHaveText('Cần chọn ít nhất 1 ảnh minh chứng');
    const picker=form.getByLabel('Chọn ảnh',{exact:true});
    await picker.setInputFiles([1,2,3,4].map(i=>({name:`synthetic-${i}.png`,mimeType:'image/png',buffer:png})));
    await expect(form.locator('#kph-photo-feedback')).toHaveText('Mỗi phiếu chỉ được tối đa 3 ảnh');
    await picker.setInputFiles([1,2,3].map(i=>({name:`synthetic-${i}.png`,mimeType:'image/png',buffer:png})));
    await expect(form.getByRole('button',{name:'Xem ảnh minh chứng 3',exact:true})).toBeVisible();
    await expect(picker).toBeDisabled();
    for(const remove of await form.locator('.photo-preview-remove').all()) {const r=await remove.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);}
    await form.getByRole('button',{name:'Xóa ảnh 2',exact:true}).click(); await expect(picker).toBeEnabled();
    await expect(form.locator('.photo-preview')).toHaveCount(2);
    await form.getByRole('button',{name:'Xem lại',exact:true}).click();
    await expect(form.getByRole('heading',{name:/Xem lại phiếu/})).toBeVisible();
    await expect(form.locator('.store-form-evidence button')).toHaveCount(2);
    await expect(form.locator('.store-review-section').first()).toHaveCSS('border-top-color','rgb(223, 229, 233)');
    await audit(page,'.store-form-review',`${kind}-${viewport.width}-review`);
    await page.screenshot({path:`${output}/${kind}-${viewport.width}-review.png`});
    await form.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
    await expect(product).toHaveValue('Hàng tổng hợp kiểm thử'); await expect(quantity).toHaveValue('2');
    await expect(form.locator('.photo-preview')).toHaveCount(2);
    await form.locator('.create-dialog-form').evaluate(el=>el.scrollTop=el.scrollHeight);
    await page.screenshot({path:`${output}/${kind}-${viewport.width}-bottom.png`});
    await page.emulateMedia({reducedMotion:'reduce'}); await expect(unselected).toHaveCSS('background-image','none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await form.getByLabel('Ghi chú',{exact:true}).evaluate(el=>{el.style.fontSize='24px';el.style.lineHeight='36px'});
    expect(await form.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await form.getByRole('button',{name:'Đóng',exact:true}).click(); await expect(form).toHaveCount(0); await expect(opener).toBeFocused();
    results.push({viewport,kind,...metrics,material:true,validation:true,photoLimitAndRecovery:true,review:true});
    console.log(`PASS ${kind} ${viewport.width}: material, linked errors, Other/calendar, photo bounds/recovery, review and focus`);
   }
   expect(errors).toEqual([]); await page.close();
  }
  fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
