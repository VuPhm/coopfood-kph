// Real browser decode/stamp/gallery/export using synthetic images only.
const {chromium,expect}=require('@playwright/test');
const ExcelJS=require('exceljs');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const base=process.env.STORE_PREVIEW_URL||'http://127.0.0.1:4394';
const output=process.env.STORE_PHOTO_OUTPUT||'/tmp/kph04-evidence';
fs.mkdirSync(output,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
async function previewBytes(page,locator){
 return await locator.evaluate(async img=>{const blob=await(await fetch(img.src)).blob();let bytes=new Uint8Array(await blob.arrayBuffer());let bitmap=await createImageBitmap(blob);const result={mime:blob.type,width:bitmap.width,height:bitmap.height,size:blob.size,base64:btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''))};bitmap.close();return result});
}
async function enlarged(root){await root.evaluate(root=>{const sizes=[root,...root.querySelectorAll('*')].map(el=>({el,font:parseFloat(getComputedStyle(el).fontSize),line:parseFloat(getComputedStyle(el).lineHeight)}));for(const{el,font,line}of sizes){el.style.fontSize=font*2+'px';if(Number.isFinite(line))el.style.lineHeight=line*2+'px'}})}
(async()=>{
 const browser=await chromium.launch(),results=[];
 try{for(const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:740},{width:844,height:390}]){
  const touch=viewport.width<900;
  const page=await browser.newPage({viewport,reducedMotion:'reduce',serviceWorkers:'block',hasTouch:touch});page.setDefaultTimeout(12000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.stampDraws=[];window.encodes=0;window.createdPhotoUrls=0;
   const fill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){window.stampDraws.push({text,x,y,width:this.canvas.width,height:this.canvas.height});return fill.call(this,text,x,y,...rest)};
   const encode=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(callback,...args){return encode.call(this,blob=>{callback(blob);window.encodes++},...args)};
   const create=URL.createObjectURL;URL.createObjectURL=function(...args){window.createdPhotoUrls++;return create.apply(this,args)};
  });
  await page.goto(base+'/#kph');await expect(page.locator('.store-kph:not(.kph-loading-frame)')).toBeVisible();
  const fixtures=await page.evaluate(()=>[[1920,1080,'#3e6c92'],[900,1600,'#b06f48'],[600,400,'#50866c']].map(([width,height,color],i)=>{const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,width,height);ctx.fillStyle='#fff';ctx.font='bold 48px sans-serif';ctx.fillText('SYNTHETIC '+(i+1),70,100);const result=c.toDataURL('image/png').split(',')[1];c.width=c.height=0;return result}));
  const files=fixtures.map((data,i)=>({name:`synthetic-${i+1}.png`,mimeType:'image/png',buffer:Buffer.from(data,'base64')}));
  await page.locator('.create-tpcn').click();const form=page.locator('.store-create-screen');await expect(form.locator('#product-name')).toBeAttached();
  const name=`Kiểm tra ảnh ${viewport.width}`;await form.locator('#product-name').fill(name);
  const picker=form.getByLabel('Chọn ảnh',{exact:true}),camera=form.getByLabel('Chụp ảnh',{exact:true});
  await expect(camera).toHaveAttribute('capture','environment');await expect(picker).toHaveAttribute('multiple','');expect(await picker.getAttribute('accept')).toContain('.heic');
  await picker.setInputFiles({name:'invalid.jpg',mimeType:'image/jpeg',buffer:Buffer.from('invalid-image')});
  await expect(form.locator('#kph-photo-feedback')).toContainText('Không thể đọc ảnh');await expect(form.locator('#product-name')).toHaveValue(name);await expect(form.locator('.photo-preview')).toHaveCount(0);
  await picker.setInputFiles([...files,files[0]]);await expect(form.locator('#kph-photo-feedback')).toContainText('tối đa 3 ảnh');
  await picker.setInputFiles(files);await expect(form.locator('.photo-preview')).toHaveCount(3);await expect(picker).toBeDisabled();
  const sizes=[];
  for(let i=0;i<3;i++){const data=await previewBytes(page,form.locator('.photo-preview img').nth(i));expect(data.mime).toBe('image/jpeg');expect(data.size).toBeLessThanOrEqual(550*1024);sizes.push([data.width,data.height]);fs.writeFileSync(`${output}/stamped-${viewport.width}-${i+1}.jpg`,Buffer.from(data.base64,'base64'))}
  expect(sizes).toEqual([[1280,720],[405,720],[600,400]]);
  const draws=await page.evaluate(()=>window.stampDraws);expect(draws.some(item=>/Cửa hàng mẫu/.test(item.text))).toBe(true);expect(draws.some(item=>/^\d\d:\d\d$/.test(item.text))).toBe(true);expect(draws.some(item=>/^\d\d\/\d\d\/\d{4}$/.test(item.text))).toBe(true);
  await form.getByRole('button',{name:'Xem ảnh minh chứng 2',exact:true}).click();let viewer=page.getByRole('dialog',{name:'Xem ảnh minh chứng',exact:true});
  const image=viewer.locator('.evidence-viewer-image');await expect(image).toBeVisible();await expect(viewer).toContainText('Ảnh 2 / 3');
  const rect=await image.boundingBox();expect(Math.abs(rect.width/rect.height-405/720)).toBeLessThan(.01);
  if(touch){const cdp=await page.context().newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rect.x+rect.width*.45,y:rect.y+rect.height*.6}]});await expect(page.locator('.evidence-zoom-lens')).toHaveClass(/is-visible/);await page.screenshot({path:`${output}/lens-${viewport.width}.png`});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await image.hover({position:{x:rect.width*.45,y:rect.height*.6}});await expect(page.locator('.evidence-zoom-lens')).toHaveClass(/is-visible/);await page.screenshot({path:`${output}/lens-${viewport.width}.png`});}
  await viewer.getByRole('button',{name:'Ảnh sau',exact:true}).click();await expect(viewer).toContainText('Ảnh 3 / 3');await expect(page.locator('.evidence-zoom-lens')).not.toHaveClass(/is-visible/);await expect(viewer.getByRole('button',{name:'Ảnh sau',exact:true})).toBeDisabled();
  await viewer.getByRole('button',{name:'Ảnh trước',exact:true}).click();await viewer.getByRole('button',{name:'Xóa ảnh đang xem',exact:true}).click();await expect(viewer).toHaveCount(0);await expect(form.locator('.photo-preview')).toHaveCount(2);await expect(picker).toBeEnabled();
  // Use the capture input without requiring physical camera hardware in headless.
  await camera.setInputFiles(files[1]);await expect(form.locator('.photo-preview')).toHaveCount(3);
  const expectedMedia=[];for(const img of await form.locator('.photo-preview img').all()){const data=await previewBytes(page,img);expectedMedia.push(hash(Buffer.from(data.base64,'base64')))}
  await form.locator('.photo-previews').scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/form-${viewport.width}.png`});
  await form.getByRole('button',{name:'Xem lại',exact:true}).click();await expect(form).toHaveAttribute('data-reviewing','true');
  await form.getByRole('button',{name:'Xem ảnh minh chứng 1',exact:true}).click();viewer=page.getByRole('dialog',{name:'Xem ảnh minh chứng',exact:true});await expect(viewer.getByRole('button',{name:'Xóa ảnh đang xem',exact:true})).toHaveCount(0);
  await enlarged(viewer);expect(await viewer.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  const nav=await viewer.locator('.store-viewer-navigation').boundingBox();expect(nav.y+nav.height).toBeLessThanOrEqual(viewport.height+1);await page.screenshot({path:`${output}/gallery-text200-${viewport.width}.png`});
  await viewer.getByRole('button',{name:'Đóng ảnh minh chứng',exact:true}).click();await form.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();await expect(form.locator('.photo-preview')).toHaveCount(3);
  await form.getByRole('button',{name:'Xem lại',exact:true}).click();await form.getByRole('button',{name:'Gửi phiếu',exact:true}).click();await expect(form).toHaveCount(0);
  const rows=page.locator(viewport.width>=900?'.store-kph-table tbody tr[data-record-id]':'.store-ticket'),row=rows.filter({hasText:name});await row.getByRole('button').click();
  const detail=page.getByRole('dialog',{name:'Chi tiết phiếu KPH',exact:true});await detail.getByRole('button',{name:'Xem ảnh minh chứng 1',exact:true}).click();viewer=page.getByRole('dialog',{name:'Xem ảnh minh chứng',exact:true});
  await viewer.getByRole('button',{name:'Ảnh sau',exact:true}).click();await viewer.getByRole('button',{name:'Ảnh sau',exact:true}).click();await expect(viewer).toContainText('Ảnh 3 / 3');await expect(viewer.getByRole('button',{name:'Xóa ảnh đang xem',exact:true})).toHaveCount(0);await page.screenshot({path:`${output}/saved-gallery-${viewport.width}.png`});
  await viewer.getByRole('button',{name:'Đóng ảnh minh chứng',exact:true}).click();await detail.getByRole('button',{name:'Duyệt phiếu',exact:true}).click();await detail.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('button',{name:'Chọn',exact:true}).click();await row.getByRole('checkbox').check();await page.getByRole('button',{name:'Xuất Excel',exact:true}).click();
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Tải xuống',exact:true}).click()]);const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(await download.path());
  const sheet=workbook.getWorksheet('Thực phẩm khô & khác');expect(sheet).toBeTruthy();const exported=sheet.getImages().map(item=>({col:item.range.tl.col,bytes:workbook.model.media[Number(item.imageId)].buffer})).sort((a,b)=>a.col-b.col);expect(exported).toHaveLength(3);expect(exported.map(item=>hash(item.bytes))).toEqual(expectedMedia);expect(sheet.getCell('D9').value).toBe(name);
  // Close the draft while a real image decode is paused; its late result must not enter a new draft.
  await page.locator('.create-tpcn').click();await expect(form.locator('#product-name')).toBeAttached();
  await page.evaluate(()=>{window.originalBitmap=createImageBitmap;window.decodeQueue=[];window.createImageBitmap=(...args)=>new Promise(resolve=>window.decodeQueue.push(()=>window.originalBitmap(...args).then(resolve)))});
  await form.getByLabel('Chọn ảnh',{exact:true}).setInputFiles(files[0]);await expect(form.locator('#kph-photo-feedback')).toContainText('Đang tối ưu');
  const before=await page.evaluate(()=>({urls:window.createdPhotoUrls,encodes:window.encodes}));
  await form.getByRole('button',{name:'Đóng',exact:true}).click();await page.locator('.create-tpcn').click();await expect(form.locator('#product-name')).toHaveValue('');
  await page.evaluate(()=>window.decodeQueue.shift()());await expect.poll(()=>page.evaluate(()=>window.encodes)).toBeGreaterThan(before.encodes);
  await expect(form.locator('.photo-preview')).toHaveCount(0);expect(await page.evaluate(()=>window.createdPhotoUrls)).toBe(before.urls);
  await expect(form.getByLabel('Chọn ảnh',{exact:true})).toBeEnabled();await form.getByRole('button',{name:'Đóng',exact:true}).click();
  expect(errors).toEqual([]);results.push({viewport,sizes,stampedJpeg:true,storeDateTimeStamp:true,threePhotoLimit:true,errorRetry:true,lens:touch?'touch':'mouse',orderedWorkbookHashes:expectedMedia,readonlySavedGallery:true,text200:true,staleDecodeDiscarded:true});
  console.log(`PASS photos ${viewport.width}: real stamp/resize, gallery/lens/remove, capture input, review/save, Excel bytes/order, decode failure and stale cancel`);await page.close();
 }}finally{fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
