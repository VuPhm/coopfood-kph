async function setReportPhase(page, value) {
 const labels={all:'Toàn bộ danh mục',attention:'Cần chú ý',EXPIRED:'Hết HSD'};
 await page.getByRole('button',{name:'Lọc danh mục báo cáo',exact:true}).click();
 await page.getByRole('group',{name:'Tình trạng DATE',exact:true}).getByRole('button',{name:labels[value],exact:true}).click();
 await page.getByRole('button',{name:'Xong',exact:true}).click();
}
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4221';
const output = process.env.STORE_REPORT_OUTPUT || '.local/reports-design/evidence-r14/management';
fs.mkdirSync(output, { recursive: true });
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
const results = [];
async function inspect(page, state, width) {
 if(await page.locator('.report-sliding-cap').count()) await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-phase','idle');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${state}: overflow`).toBe(true);
  await audit(page, '.report-composer, .date-report, .date-report-sheet', `${state}-${width}`);
  const targets = await page.locator('.date-report button, .date-report-sheet button').evaluateAll(nodes => nodes.filter(e => e.getBoundingClientRect().width && !e.closest('[aria-hidden="true"], [inert]')).map(e => ({text:e.textContent,h:e.getBoundingClientRect().height,w:e.getBoundingClientRect().width})));
  expect(targets.filter(target => target.h < 43 || target.w < 43), `${state}: touch targets`).toEqual([]);
  await page.screenshot({ path: `${output}/${state}-${width}.png`, fullPage: true });
}
async function create(page, title) {
  await page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true }).click();
  await page.getByLabel('Tên báo cáo', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Tạo và lưu lịch sử', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bản báo cáo DATE', exact: true })).toBeFocused();
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

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{width:390,height:844},{width:1440,height:1024},{width:320,height:844}]) {
      const page = await browser.newPage({viewport,timezoneId:'Asia/Ho_Chi_Minh',reducedMotion:'reduce',serviceWorkers:'block'});
      await page.clock.install({time:new Date('2026-10-14T05:00:00Z')});
      const errors=[]; page.on('pageerror',e=>errors.push(e.message));
      await page.goto(`${base}/#reports`);
      await page.getByRole('button',{name:/^Báo cáo tổng hợp/}).click();
      await bulk(page, 'Bỏ chọn toàn bộ');
      await page.getByRole('checkbox',{name:'Chọn lô C24-118',exact:true}).check();
      await page.getByRole('button',{name:'Lưu thành mẫu',exact:true}).click();
      await page.getByLabel('Tên mẫu',{exact:true}).fill('Quầy A');
      await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
      await page.getByRole('button',{name:'Tạo bản báo cáo',exact:true}).click();
      await page.getByLabel('Tên báo cáo',{exact:true}).fill('  ');
      // Blank input falls back to the generated holder instead of blocking creation.
      await expect(page.getByLabel('Tên báo cáo',{exact:true})).toHaveAttribute('placeholder',/01\/10\/2026/);
      await page.getByLabel('Tên báo cáo',{exact:true}).fill('Kiểm DATE đợt 1');
      await inspect(page,'create-name',viewport.width);
      await page.getByRole('button',{name:'Tạo và lưu lịch sử',exact:true}).click();
      await expect(page.locator('.date-report-document-meta')).toContainText('Kiểm DATE đợt 1');
      await page.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
      await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();
      await page.getByRole('button',{name:'Quản lý mẫu Quầy A',exact:true}).click();
      await page.getByLabel('Tên mẫu',{exact:true}).fill('Báo cáo tổng hợp');
      await page.getByRole('button',{name:'Lưu tên mẫu',exact:true}).click();
      await expect(page.getByRole('alert')).toContainText('đã có');
      await page.getByLabel('Tên mẫu',{exact:true}).fill('Quầy A mới');
      await inspect(page,'rename',viewport.width);
      await page.getByRole('button',{name:'Lưu tên mẫu',exact:true}).click();
      await expect(page.getByRole('button',{name:'Quản lý mẫu Quầy A mới',exact:true})).toBeFocused();
      await page.getByRole('button',{name:'Quản lý mẫu Quầy A mới',exact:true}).click();
      await page.getByRole('button',{name:'Nhân bản',exact:true}).click();
      await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Quầy A mới (bản sao)');
      await page.getByLabel('Tên mẫu',{exact:true}).fill('Bản sao quầy A');
      await page.getByRole('button',{name:'Tạo bản sao',exact:true}).click();
      await expect(page.locator('.report-custom-card')).toHaveCount(2);
      await page.getByRole('button',{name:/^Quầy A mới 1 lô/}).click();
      await setReportPhase(page, 'EXPIRED');
      await page.getByRole('checkbox',{name:'Chọn lô A24-198',exact:true}).check();
      await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
      await expect(page.getByLabel('Cách lưu mẫu',{exact:true})).toHaveAttribute('data-value', 'update');
      await expect(page.getByLabel('Tên mẫu',{exact:true})).toHaveValue('Quầy A mới');
      await inspect(page,'update-template',viewport.width);
      await page.getByRole('button',{name:'Lưu mẫu',exact:true}).click();
      await create(page,'Kiểm quầy A đợt 2');
      await expect(page.locator('.date-report-catalog-heading')).toContainText('2 lô');
      await page.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
      await expect(page.locator('.report-history-card')).toHaveCount(2);
      await page.locator('.report-history-card').last().click();
      await expect(page.locator('.date-report-document-meta')).toContainText('Kiểm DATE đợt 1');
      await expect(page.locator('.date-report-catalog-heading')).toContainText('1 lô');
      await page.getByRole('button',{name:'Về lịch sử báo cáo',exact:true}).click();
      await page.getByRole('button',{name:'Về menu báo cáo',exact:true}).click();
      await page.getByRole('button',{name:/^Bản sao quầy A 1 lô/}).click();
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 1 / 7 lô');
      await page.reload();
      await page.getByRole('button',{name:/^Quầy A mới 2 lô/}).click();
      await expect(page.locator('.report-selection-bar')).toContainText('Đã chọn 2 / 3 lô');
      // Synthetic archive fixtures for month filtering and bounded history rendering.
      await page.evaluate(()=>{
        const key=Object.keys(localStorage).find(key=>key.startsWith('coopfood:mock-date-report-library:'));
        const data=JSON.parse(localStorage.getItem(key));
        const source=data.history[0];
        for(let index=1;index<=11;index++) data.history.push({...source,id:`older-${index}`,title:`Báo cáo tháng 9 - ${index}`,asOf:'2026-09-30',period:{start:'2026-09-01',end:'2026-09-30'},createdAt:'30/09/2026 12:00:00'});
        localStorage.setItem(key,JSON.stringify(data));
      });
      await page.reload();
      await page.getByRole('button',{name:'Lịch sử 13',exact:true}).click();
      await expect(page.locator('.report-history-card')).toHaveCount(10);
      await page.getByRole('button',{name:'Xem thêm báo cáo',exact:true}).click();
      await expect(page.locator('.report-history-card')).toHaveCount(13);
      await pick(page, page.getByLabel('Tháng chốt báo cáo',{exact:true}), '2026-09');
      await expect(page.locator('.report-history-tools')).toContainText('11 / 13 báo cáo');
      await expect(page.locator('.report-history-card')).toHaveCount(10);
      await page.getByLabel('Tìm báo cáo',{exact:true}).fill('kiểm date');
      await expect(page.getByRole('heading',{name:'Không có báo cáo phù hợp',exact:true})).toBeVisible();
      await page.getByRole('button',{name:'Bỏ tìm và lọc',exact:true}).click();
      await page.getByLabel('Tìm báo cáo',{exact:true}).fill(' KIỂM DATE ');
      await expect(page.locator('.report-history-card')).toHaveCount(1);
      await expect(page.locator('.report-history-card')).toContainText('Kiểm DATE đợt 1');
      await inspect(page,'history-search',viewport.width);
      await page.getByRole('button',{name:'Xóa tìm kiếm lịch sử',exact:true}).click();await expect(page.getByLabel('Tìm báo cáo',{exact:true})).toBeFocused();await expect(page.getByLabel('Tìm báo cáo',{exact:true})).toHaveValue('');await expect(page.locator('.report-history-card')).toHaveCount(10);await page.getByLabel('Tìm báo cáo',{exact:true}).fill('kiểm date');await expect(page.locator('.report-history-card')).toHaveCount(1);
      await page.addStyleTag({content:'.date-report :is(p,small,span,label,button,input,select) { font-size:150% !important; }'});
      await inspect(page,'history-large-text',viewport.width);
      expect(errors).toEqual([]);
      results.push({viewport,passed:true,history:13,customTemplates:2,errors});
      console.log(`PASS report management ${viewport.width}×${viewport.height}`);
      await page.close();
    }
  } finally {await browser.close();fs.writeFileSync(`${output}/results.json`,JSON.stringify(results,null,2));}
})().catch(error=>{console.error(error);process.exitCode=1});
