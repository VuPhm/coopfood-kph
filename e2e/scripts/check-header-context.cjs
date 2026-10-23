const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4330';
const output = process.env.STORE_HEADER_OUTPUT || '.local/header03/context';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
async function hit(locator) {
  await expect(locator).toBeVisible();
  const r = await locator.boundingBox();
  expect(r.width).toBeGreaterThanOrEqual(44); expect(r.height).toBeGreaterThanOrEqual(44);
  expect(await locator.evaluate(el => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)); })).toBe(true);
}
(async () => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  try {
    for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:740},{width:900,height:650}]) {
      const page = await browser.newPage({ viewport, serviceWorkers:'block', reducedMotion:'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const desktop = viewport.width >= 900;
      await page.goto(`${base}/#home`);
      await expect(page.locator('.store-home-welcome')).toBeVisible();
      await expect(page.locator('.store-header h1')).toHaveText('Trang chủ');
      expect((await page.locator('.store-header h1').boundingBox()).width).toBeLessThanOrEqual(1);
      await expect(page.locator('.store-header p')).toHaveCount(0);
      await expect(page.locator('.store-header-brand')).toBeVisible();
      await page.screenshot({path:`${output}/home-${viewport.width}.png`});
      for (const route of ['date','kph','shelf','notifications','reports']) {
        await page.goto(`${base}/#${route}`);
        await expect(page.locator('.store-header h1')).toBeVisible();
        await expect(page.getByRole('button',{name:'Tài khoản và cửa hàng',exact:true})).toBeEnabled();
        const header = page.locator('.store-header');
        const location = header.getByRole('navigation', { name:'Vị trí hiện tại' });
        await expect(location.locator('[aria-current="page"]')).toHaveCount(1);
        if (desktop) {
          await expect(header.locator('.store-back')).toBeHidden();
          const home = location.getByRole('button',{name:'Trang chủ',exact:true});
          await hit(home); await home.focus(); await page.keyboard.press('Enter');
        } else {
          const back = header.getByRole('button',{name:'Về trang chủ',exact:true});
          await expect(back).toHaveCSS('border-width','0px');
          await expect(back).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
          await hit(back); await back.click();
        }
        await expect(page).toHaveURL(/#home$/);
      }
      await page.goto(`${base}/#reports`);
      await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
      const header = page.locator('.store-header');
      await expect(header.locator('h1')).toHaveText('Báo cáo tổng hợp');
      await audit(page,'.store-header',`composer-${viewport.width}`);
      await page.screenshot({path:`${output}/composer-${viewport.width}.png`});
      const parent = header.getByRole('button',{name:'Về menu báo cáo',exact:true});
      await hit(parent); await parent.click();
      await expect(page.getByRole('heading',{name:'Chọn báo cáo',exact:true})).toBeVisible();
      await page.goto(`${base}/#date`);
      await page.addStyleTag({content:'.store-header h1{font-size:30px;line-height:39px}.store-header p{font-size:18px;line-height:24px}.store-header-ancestor>button{font-size:19.5px;line-height:39px}'});
      await audit(page,'.store-header',`large-${viewport.width}`);
      expect(await header.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
      await page.screenshot({path:`${output}/large-date-${viewport.width}.png`});
      expect(errors).toEqual([]); await page.close();
      console.log(`PASS context header ${viewport.width}: Home copy hidden, mobile plain Back/desktop ancestors, touch/keyboard navigation, report parent,150% text`);
    }
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
