// Targeted presentation and interaction checks. All API responses are synthetic.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const read = name => JSON.parse(fs.readFileSync(`contracts/fixtures/api/${name}.json`, 'utf8'));
const mock = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4213';
const admin = process.env.ADMIN_UI_REVIEW_URL || 'http://127.0.0.1:4214';
const online = process.env.ONLINE_PREVIEW_URL || 'http://127.0.0.1:4215';
const output = '.local/list-label-rollout/evidence'; fs.mkdirSync(output, { recursive: true });
const results = [];
async function inspect(page, name, viewport) {
  const cues = page.locator('.ui-list-item-marker').filter({ visible: true });
  expect(await cues.count(), `${name}: markers`).toBeGreaterThan(0);
  for (const cue of await cues.all()) {
    await expect(cue).toHaveAttribute('aria-hidden', 'true');
    const box = await cue.boundingBox();
    expect(box.width).toBe(3); expect(box.height).toBe(viewport.width >= 900 ? 24 : 36);
    expect(await cue.evaluate(el => {
      const b = el.getBoundingClientRect(), host = el.parentElement.getBoundingClientRect();
      return b.left >= host.left + 12 && b.left <= host.left + 14 && b.top >= host.top && b.bottom <= host.bottom;
    }), `${name}: inset/containment`).toBe(true);
  }
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: page overflow`).toBe(true);
  const labels = page.locator('.ui-list-label').filter({ visible: true });
  expect(await labels.count(), `${name}: labels`).toBeGreaterThan(0);
  expect(await labels.evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1 || el.querySelector('.ui-list-label-text').scrollWidth > el.querySelector('.ui-list-label-text').clientWidth + 1).map(el => el.textContent)), `${name}: readable labels`).toEqual([]);
  const contrast = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width=canvas.height=1; const context=canvas.getContext('2d', { willReadFrequently: true });
    const rgb = value => { context.clearRect(0,0,1,1); context.fillStyle=value; context.fillRect(0,0,1,1); const v=[...context.getImageData(0,0,1,1).data]; return [v[0],v[1],v[2],v[3]/255]; };
    const luminance = value => value.slice(0, 3).map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }).reduce((s,v,i) => s + v * [.2126,.7152,.0722][i], 0);
    const ratio = (a,b) => { a=luminance(a); b=luminance(b); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); };
    const surface = el => {
      const colors = []; for (; el; el=el.parentElement) colors.push(rgb(getComputedStyle(el).backgroundColor));
      return colors.reverse().reduce((bg,fg) => { const alpha = fg[3] ?? 1; return bg.map((v,i) => fg[i] * alpha + v * (1-alpha)); }, [255,255,255]);
    };
    const visible = el => el.getBoundingClientRect().width > 0;
    return { text: [...document.querySelectorAll('.ui-list-label')].filter(visible).map(el => ratio(rgb(getComputedStyle(el).color), surface(el))),
      bar: [...document.querySelectorAll('.ui-list-item-marker')].filter(visible).map(el => ratio(rgb(getComputedStyle(el).backgroundColor), surface(el.parentElement))) };
  });
  expect(Math.min(...contrast.text), `${name}: label contrast`).toBeGreaterThanOrEqual(4.5);
  expect(Math.min(...contrast.bar), `${name}: bar contrast`).toBeGreaterThanOrEqual(3);
  await page.screenshot({ path: `${output}/${name}-${viewport.width}.png`, fullPage: true });
  // Increase actual label text, including narrow cards, without hiding or truncating it.
  const style = await page.addStyleTag({ content: '.ui-list-label[data-tone] { font-size: 18px; line-height: 27px; }' });
  expect(await labels.evaluateAll(els => els.filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.textContent)), `${name}: 150% label text`).toEqual([]);
  expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1), `${name}: large text overflow`).toBe(true);
  await style.evaluate(el => el.remove());
  results.push({ name, viewport, markers: await cues.count(), labels: await labels.count(), contrast });
  console.log(`PASS ${name} ${viewport.width}×${viewport.height}`);
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Asia/Ho_Chi_Minh' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date('2026-10-12T05:00:00+07:00') });
      await page.goto(`${mock}/#date`);
      await page.getByRole('button', { name: /Theo dõi DATE/ }).click();
      const lots = page.locator('.store-date-lot');
      await expect(lots.first()).toBeVisible();
      for (const lot of await lots.all()) await expect(lot.locator('.ui-list-item-marker')).toHaveAttribute('data-tone', await lot.locator('[data-date-phase]').getAttribute('data-tone'));
      const lot = lots.filter({ hasText: 'Cải thìa' }).first();
      const tone = await lot.locator('.ui-list-item-marker').getAttribute('data-tone');
      await lot.click();
      await page.getByRole('button', { name: 'Đã xử lý', exact: true }).click();
      await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status', 'resolved');
      await expect(lot.locator('.ui-list-item-marker')).toHaveAttribute('data-tone', tone);
      if (viewport.width < 900 && await page.getByRole('dialog').count()) await page.getByRole('dialog').getByRole('button', { name: /Đóng/ }).click();
      await inspect(page, 'date', viewport);
      await page.goto(`${mock}/#shelf`);
      const form = page.locator('.store-shelf-form');
      await form.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
      await form.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('01/11/2026');
      await page.clock.runFor(400);
      const history = page.locator('.store-shelf-history-list');
      await expect(history.locator('li')).toHaveCount(1);
      await expect(history.locator('[data-snapshot-status]')).toHaveAttribute('data-snapshot-status', 'SAFE');
      await page.clock.setFixedTime(new Date('2026-12-01T05:00:00+07:00'));
      await expect(history.locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'success');
      await inspect(page, 'shelf-history', viewport);
      expect(errors).toEqual([]); await page.close();

      const ap = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block', timezoneId: 'Asia/Ho_Chi_Minh' });
      await ap.clock.install({ time: new Date('2026-10-12T05:00:00+07:00') });
      const session = read('session'); session.user.globalRoles = ['CHAIN_ADMIN', 'CATALOG_ADMIN'];
      const batches = ['REJECTED', 'VALIDATED', 'STAGED', 'PUBLISHED'].map((status, i) => ({ ...read('catalog-imports')[0], id: `batch-${i}`, status, rowCount: 3, validRowCount: status === 'REJECTED' ? 1 : 3, errorRowCount: status === 'REJECTED' ? 2 : 0, originalFilename: `catalog-${status}.csv` }));
      const schedules = ['SCHEDULED', 'SCHEDULED', 'EXECUTED', 'CANCELLED'].map((status, i) => ({ ...read('lifecycle-schedules')[0], id: `schedule-${i}`, status, effectiveDate: i === 0 ? '2026-12-01' : '2026-10-01', target: { ...read('lifecycle-schedules')[0].target, name: `Chi nhánh ${i}` } }));
      const users = [...read('admin-users'), { ...read('admin-users')[1], id: 'disabled-user', username: 'inactive.demo', active: false }];
      let mutations = 0;
      await ap.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (route.request().method() !== 'GET') mutations++;
        if (path.endsWith('/auth/session')) return route.fulfill({ json: session });
        if (path.endsWith('/catalog/imports')) return route.fulfill({ json: batches });
        if (path.includes('/catalog/imports/')) {
          const detail = read('catalog-import-detail'); detail.batch = batches.find(b => path.endsWith(b.id));
          detail.rows.push({ ...detail.rows[0], rowNumber: 4, status: 'VALID', validationMessages: [] });
          return route.fulfill({ json: detail });
        }
        if (path.endsWith('/lifecycle/schedules')) return route.fulfill({ json: schedules });
        if (path.endsWith('/lifecycle/targets')) return route.fulfill({ json: read('lifecycle-targets') });
        if (path.endsWith('/admin/users')) return route.fulfill({ json: users });
        return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
      });
      await ap.goto(admin);
      const batchesUi = ap.locator('button.ui-list-marker-card'); await expect(batchesUi).toHaveCount(4);
      await expect(batchesUi.nth(0).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'danger');
      await expect(batchesUi.nth(1).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'success');
      await expect(batchesUi.nth(2).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'process');
      await expect(batchesUi.nth(3).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'info');
      const before = await batchesUi.first().locator('.ui-list-item-marker').boundingBox(); await batchesUi.first().click();
      await expect(ap.getByText('UPC bị lặp trong cùng file.').filter({ visible: true }).first()).toBeVisible();
      const after = await batchesUi.first().locator('.ui-list-item-marker').boundingBox(); expect(after.x).toBe(before.x);
      await expect(ap.getByText(/0890123456789/).filter({ visible: true }).first()).toBeVisible();
      await inspect(ap, 'admin-catalog', viewport);
      await ap.getByRole('button', { name: 'Lifecycle', exact: true }).click();
      const cards = ap.locator('article.ui-list-marker-card'); await expect(cards).toHaveCount(4);
      await expect(cards.nth(0).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'process');
      await expect(cards.nth(1).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'warning');
      await expect(cards.nth(0).getByRole('button', { name: /^Chờ đến/ })).toBeDisabled();
      await expect(cards.nth(1).getByRole('button', { name: 'Thực thi', exact: true })).toBeEnabled();
      await inspect(ap, 'admin-lifecycle', viewport);
      await ap.getByRole('button', { name: 'Tài khoản', exact: true }).click();
      const disabled = ap.locator('article').filter({ hasText: 'inactive.demo' });
      await expect(disabled.locator('.ui-list-item-marker')).toHaveAttribute('data-tone', 'neutral');
      await expect(disabled.getByRole('button', { name: 'Đã vô hiệu hóa', exact: true })).toBeDisabled();
      await inspect(ap, 'admin-identity', viewport);
      expect(mutations, 'decorative labels do not trigger writes').toBe(0); await ap.close();

      const op = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const os = read('session'); const records = ['NEAR_EXPIRY', 'EXPIRED', 'OTHER'].map((condition, i) => ({ ...read('kph-record'), id: `synthetic-${i}`, condition, conditionDetail: i === 2 ? 'Khác — cần kiểm tra tên dài và ghi chú' : null, photos: [], catalogSnapshot: { ...read('kph-record').catalogSnapshot, productName: `Sản phẩm nhãn màu ${i}` } }));
      await op.route('**/api/**', route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/auth/session')) return route.fulfill({ json: os });
        if (url.pathname.endsWith('/kph')) {
          expect(url.pathname).toBe(`/api/v1/stores/${os.user.stores[0].id}/kph`);
          return route.fulfill({ json: { items: records, page: 1, pageSize: 25, totalItems: 3, totalPages: 1, typeTotals: { tpcn: 3, tpts: 0 } } });
        }
        return route.fulfill({ status: 404, json: { code: 'NOT_FOUND' } });
      });
      await op.goto(online);
      const rows = op.locator(viewport.width >= 900 ? '.record-row' : '.record-card').filter({ visible: true }); await expect(rows).toHaveCount(3);
      for (const [i, tone] of ['warning', 'danger', 'neutral'].entries()) await expect(rows.nth(i).locator('.ui-list-item-marker')).toHaveAttribute('data-tone', tone);
      const markerX = (await rows.first().locator('.ui-list-item-marker').boundingBox()).x;
      await rows.first().getByRole('checkbox').check();
      await expect(rows.first()).toHaveClass(/is-selected/);
      expect((await rows.first().locator('.ui-list-item-marker').boundingBox()).x).toBe(markerX);
      await inspect(op, 'online-kph', viewport);
      os.user.stores[0].role = 'EMPLOYEE';
      await op.reload();
      await expect(rows).toHaveCount(3);
      await expect(rows.first().locator('[data-label-kind="approval"]')).toHaveCount(1);
      await expect(rows.first().getByRole('combobox', { name: /^Trạng thái duyệt/ })).toHaveCount(0);
      await inspect(op, 'online-readonly', viewport);
      await op.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
