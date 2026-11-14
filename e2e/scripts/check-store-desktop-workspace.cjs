// Store desktop follows Admin workspace composition; mobile keeps the Fresh hero.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const out = '.local/verification/desktop-r8';
fs.mkdirSync(out, { recursive: true });
const routes = { home: 'Trang chủ', kph: 'KPH', date: 'DATE', shelf: 'Tra cứu lùi hàng', reports: 'Báo cáo', notifications: 'Thông báo' };
const results = [];
(async () => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  try {
    for (const width of [1440, 900, 390]) {
      const page = await browser.newPage({ viewport: { width, height: width === 1440 ? 1024 : 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const [route, title] of Object.entries(routes)) {
        await page.goto(`http://127.0.0.1:4180/#${route}`);
        await expect(page.getByRole('heading', { name: title, level: 1, exact: true })).toHaveCount(1);
        if (route === 'reports') await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeVisible();
        const state = await page.evaluate(() => {
          const layout = document.querySelector('.store-page-layout');
          const hero = document.querySelector('.store-page-hero');
          const surface = document.querySelector('.store-page-surface');
          const heading = document.querySelector('.store-desktop-page-heading');
          return { image: getComputedStyle(layout).backgroundImage, hero: getComputedStyle(hero).display, position: getComputedStyle(hero).position,
            margin: getComputedStyle(surface).marginTop, headingBottom: heading?.getBoundingClientRect().bottom,
            surfaceTop: surface.getBoundingClientRect().top, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(state.overflow, `${route}/${width} overflow`).toBe(false);
        if (width >= 900) {
          expect(state.image).toBe('none'); expect(state.hero).toBe('contents'); expect(state.position).toBe('static'); expect(state.margin).toBe('0px');
          expect(state.surfaceTop).toBeGreaterThanOrEqual(state.headingBottom);
          await expect(page.locator('.store-desktop-page-heading h1')).toBeVisible();
          if (route === 'kph' || route === 'date') {
            const search = page.locator('.store-page-hero-content input').first();
            const create = page.locator('.store-page-hero-content').getByRole('button', { name: route === 'date' ? 'Thêm theo dõi DATE' : 'Tạo phiếu TP khô & khác', exact: true });
            await expect(search).toBeVisible(); await expect(create).toBeVisible();
            const initial = await create.evaluate(e => getComputedStyle(e).backgroundColor);
            await create.hover();
            await expect.poll(() => create.evaluate(e => getComputedStyle(e).backgroundColor)).not.toBe(initial);
            await page.mouse.move(1, 1);
            await page.evaluate(() => window.scrollTo(0, 150));
            const scroll = await page.evaluate(() => scrollY);
            await search.evaluate(e => e.focus({ preventScroll: true }));
            expect(await page.evaluate(() => scrollY)).toBe(scroll);
            await page.evaluate(() => window.scrollTo(0, 0));
          }
        } else {
          expect(state.image).toContain('linear-gradient'); expect(state.position).toBe('sticky'); expect(state.margin).toBe('-12px');
          await expect(page.locator('.store-desktop-page-heading')).toHaveCount(0);
        }
        await page.screenshot({ path: `${out}/${route}-${width}.png` });
        results.push({ route, width, result: 'PASS', ...state });
      }
      await page.goto('http://127.0.0.1:4180/#reports');
      await page.getByRole('button', { name: 'Lịch sử', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Lịch sử báo cáo', exact: true })).toBeVisible();
      await expect(page.locator('.report-sliding-cap')).toHaveAttribute('data-pull-enabled', String(width < 900));
      await expect(page.locator('.report-cap-handle')).toHaveCount(width < 900 ? 1 : 0);
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeFocused();
      await page.getByRole('button', { name: /^Báo cáo tổng hợp/ }).click();
      await expect(page.locator('.report-composer')).toBeVisible();
      await page.getByRole('button', { name: 'Đổi mẫu báo cáo', exact: true }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Tạo bản báo cáo', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Tạo và lưu lịch sử', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Phạm vi bản báo cáo', exact: true })).toBeVisible();
      if (width >= 900) {
        const contrast = await page.locator('.date-report-document-meta p').first().evaluate(e => {
          const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => { const s = n / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4; }).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
          const ink = luminance(getComputedStyle(e).color), background = luminance(getComputedStyle(e.closest('.store-page-hero-content')).backgroundColor);
          return (Math.max(ink, background) + .05) / (Math.min(ink, background) + .05);
        });
        expect(contrast).toBeGreaterThanOrEqual(4.5);
      }
      await page.screenshot({ path: `${out}/report-document-${width}.png` });
      await page.locator('.date-report-back').click();
      await expect(page.locator('.report-history-list')).toBeVisible();
      await page.getByRole('button', { name: 'Về menu báo cáo', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Chọn báo cáo', exact: true })).toBeFocused();
      expect(errors).toEqual([]);
      await page.close();
    }
    fs.writeFileSync(`${out}/workspace-results.json`, JSON.stringify(results, null, 2) + '\n');
    console.log('PASS: 18 route/viewports, desktop canvas/toolbar/focus/hover, mobile hero, report picker/create/document/history/navigation/focus.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
