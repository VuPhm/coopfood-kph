// Responsive contract checks for the R2 Store App. Screenshots are review evidence, not pixel snapshots.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
fs.mkdirSync('.local/figma-mobile', {recursive:true});
const manifest = JSON.parse(fs.readFileSync('docs/delivery/figma-mobile-implementation/assets-r3.json', 'utf8'));
manifest.assets = Object.values(Object.fromEntries([...manifest.assets, ...JSON.parse(fs.readFileSync('docs/delivery/figma-mobile-implementation/assets-r7.json', 'utf8')).assets].map(asset => [asset.slot, asset])));
const viewports = [
  {width:390,height:844}, {width:599,height:900}, {width:600,height:900}, {width:899,height:900},
  {width:900,height:900}, {width:1440,height:900}, {width:1440,height:1024},
];
async function capture(page, name) {
  await page.waitForFunction(() => [...document.images].filter(i => i.getBoundingClientRect().width && i.getBoundingClientRect().height).every(i => i.complete && i.naturalWidth > 0));
  const errors = await page.evaluate(expected => {
    const images = [...document.querySelectorAll('img[data-figma-asset-slot]')];
    return images.flatMap(img => {
      const slot = img.dataset.figmaAssetSlot;
      const record = expected.find(item => item.slot === slot);
      const rect = img.getBoundingClientRect();
      if (!record) return [{slot, reason:'missing manifest'}];
      if (!rect.width || !rect.height) return [];
      const renderSize = innerWidth >= 900 && record.renderDesktop ? record.renderDesktop : record.render;
      if (Math.abs(rect.width - renderSize.width) > .5 || Math.abs(rect.height - renderSize.height) > .5) return [{slot, actual:[rect.width,rect.height], expected:[renderSize.width,renderSize.height]}];
      return [];
    });
  }, manifest.assets);
  if (errors.length) throw new Error(`Figma asset geometry: ${JSON.stringify(errors)}`);
  const dimensions = await page.evaluate(() => ({width:innerWidth, scroll:document.documentElement.scrollWidth, height:innerHeight}));
  if (dimensions.scroll > dimensions.width) throw new Error(`Horizontal overflow at ${name}: ${JSON.stringify(dimensions)}`);
  await page.screenshot({path:`.local/figma-mobile/${name}.png`, fullPage:true});
}
async function homeNavigate(page, viewport, label) {
  const launcher = viewport.width >= 900 ? '.store-launcher-desktop' : '.store-launcher-mobile';
  await page.locator(launcher).getByRole('button', {name:label, exact:true}).click();
}
async function checkScreen(page, viewport) {
  const tag = `${viewport.width}x${viewport.height}`;
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.STORE_APP_URL || 'http://127.0.0.1:5175');
  await page.locator(viewport.width >= 900 ? '.store-launcher-desktop' : '.store-launcher-mobile').waitFor();
  if (viewport.width >= 900) {
    const desktopShell = await page.evaluate(() => {
      const app = document.querySelector('.store-app').getBoundingClientRect();
      const rail = document.querySelector('.store-desktop-rail').getBoundingClientRect();
      const profile = getComputedStyle(document.querySelector('.store-profile-meta strong')).color;
      return {appLeft:app.left,appWidth:app.width,railLeft:rail.left,railWidth:rail.width,profile};
    });
    if (desktopShell.appLeft !== 0 || desktopShell.appWidth !== viewport.width || desktopShell.railLeft !== 0 || Math.abs(desktopShell.railWidth - 224) > 1 || desktopShell.profile === 'rgb(255, 255, 255)') throw new Error(`Desktop shell geometry/identity contrast at ${tag}: ${JSON.stringify(desktopShell)}`);
  }
  await capture(page,`home-${tag}`);
  await homeNavigate(page,viewport,'KPH');
  await page.getByRole('heading',{name:'Phiếu khai báo'}).waitFor();
  const tableVisible = await page.locator('.store-kph-table-wrap').evaluate(el => getComputedStyle(el).display !== 'none');
  if (tableVisible !== (viewport.width >= 900)) throw new Error(`KPH composition breakpoint mismatch at ${tag}`);
  await capture(page,`kph-${tag}`);
  const firstRecord = page.locator(viewport.width >= 900 ? '.store-kph-row-open' : '.store-ticket-open').first();
  if (viewport.width >= 900) { await firstRecord.focus(); await page.keyboard.press('Space'); }
  else await firstRecord.click();
  await page.getByRole('heading',{name:'Chi tiết phiếu KPH'}).waitFor();
  await capture(page,`kph-detail-${tag}`);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Lọc phiếu KPH'}).click();
  await page.getByRole('button',{name:'Chờ duyệt', exact:true}).click();
  await page.getByRole('button',{name:'Đóng', exact:true}).click();
  const visibleTickets = await page.locator(viewport.width >= 900 ? '.store-kph-table tbody tr' : '.store-ticket').count();
  if (!visibleTickets) throw new Error(`Pending KPH filter returned no rows at ${tag}`);
  await page.getByRole('button',{name:'Lọc phiếu KPH'}).click();
  await page.getByRole('button',{name:'Đặt lại bộ lọc'}).click();
  await page.getByRole('button',{name:'Đóng',exact:true}).click();
  await page.getByRole('button',{name:'Về trang chủ'}).click();
  if (viewport.width >= 900) {
    await homeNavigate(page,viewport,'Tra cứu');
    await page.getByRole('textbox',{name:'Mã hàng, tên hàng hoặc lô'}).fill('0008421');
    await page.locator('#store-content').getByRole('button',{name:'Tra cứu',exact:true}).click();
    await page.getByRole('heading',{name:'Bánh quy bơ hộp 300 g'}).waitFor();
    await capture(page,`lookup-${tag}`);
    await page.getByRole('button',{name:'Về trang chủ'}).click();
    await page.locator('.store-desktop-rail').getByRole('button',{name:'DATE',exact:true}).click();
  } else {
    await homeNavigate(page,viewport,'Quản lý DATE');
  }
  await page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng'}).click();
  await page.getByRole('dialog',{name:'Tra cứu lùi hàng nhanh'}).waitFor();
  await capture(page,`quick-${tag}`);
  await page.keyboard.press('Escape');
  const focusRestored = await page.getByRole('button',{name:'Mở tiện ích tra cứu lùi hàng'}).evaluate(el => document.activeElement === el);
  if (!focusRestored) throw new Error(`Quick-panel focus did not return at ${tag}`);
  await capture(page,`date-${tag}`);
  const dateIconGeometry = await page.evaluate(() => {
    const field = document.querySelector('.store-date-search-wrap').getBoundingClientRect();
    const search = document.querySelector('[data-figma-asset-slot="date-search"]');
    const scan = document.querySelector('[data-figma-asset-slot="date-scan"]');
    const holder = scan.parentElement.getBoundingClientRect();
    const searchRect = search.getBoundingClientRect();
    const scanRect = scan.getBoundingClientRect();
    return {
      searchSource: new URL(search.src).pathname.split('/').pop(), search: [searchRect.width, searchRect.height, searchRect.left - field.left, searchRect.top - field.top],
      scanSource: new URL(scan.src).pathname.split('/').pop(), scan: [scanRect.width, scanRect.height], holder: [holder.width, holder.height],
      scanButton: document.querySelector('button[aria-label="Quét mã để tìm lô DATE"]')?.getAttribute('aria-label')
    };
  });
  if (JSON.stringify(dateIconGeometry.search) !== JSON.stringify([18,18,12,15]) || dateIconGeometry.searchSource !== '0d9947bc-6df8-489b-b0f1-4d3264da3d36.svg' || JSON.stringify(dateIconGeometry.scan) !== JSON.stringify([20,20]) || JSON.stringify(dateIconGeometry.holder) !== JSON.stringify([36,36]) || dateIconGeometry.scanSource !== '29585ac6-4af7-4f2f-a308-2b24ab118b3e.svg' || dateIconGeometry.scanButton !== 'Quét mã để tìm lô DATE') throw new Error(`DATE icon source/geometry mismatch at ${tag}: ${JSON.stringify(dateIconGeometry)}`);
  await page.getByRole('button',{name:'Quét mã để tìm lô DATE'}).click();
  await page.getByRole('dialog').getByText('Quét mã SKU / UPC').waitFor();
  await page.getByRole('button',{name:'Nhập mã thủ công'}).click();
  const dateSearch = page.getByRole('textbox',{name:'Tìm mã hàng hoặc lô'});
  await dateSearch.fill('089332');
  if (await dateSearch.inputValue() !== '089332') throw new Error(`DATE scanner manual fallback did not populate the search field at ${tag}`);
  await dateSearch.fill('');
  await page.getByRole('button',{name:'Về trang chủ'}).click();
  if (viewport.width >= 900) await page.getByRole('button',{name:'Tra hạn lùi hàng',exact:true}).click();
  else await homeNavigate(page,viewport,'Tra cứu lùi hàng');
  await page.getByRole('textbox',{name:'Ngày sản xuất'}).fill('18/01/2026');
  await page.getByRole('textbox',{name:'Hạn sử dụng (HSD)'}).fill('18/10/2026');
  await page.locator('#store-content').getByRole('button',{name:'Tra cứu',exact:true}).click();
  await page.getByText('24/08/2026',{exact:true}).waitFor();
  await capture(page,`shelf-${tag}`);
  if(errors.length) throw new Error(`Browser errors at ${tag}: ${errors.join('; ')}`);
  console.log(`PASS ${tag}: responsive shell, KPH filter/layout, lookup/DATE route, DATE Feather icon geometry and scanner manual fallback ${JSON.stringify(dateIconGeometry)}, quick-panel keyboard, shelf calculation, no overflow`);
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try { for (const viewport of viewports) { const page=await browser.newPage({viewport}); page.setDefaultTimeout(7000); await checkScreen(page,viewport); await page.close(); } }
  finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1);});
