// Session-only main-screen history: synthetic inputs, no operational data.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/shelf-history';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date('2026-10-10T12:00:00+07:00') });
      await page.goto(`${process.env.STORE_APP_URL || 'http://127.0.0.1:5175'}/#shelf`);
      const history = page.getByRole('region', { name: /^Lịch sử tra cứu/ });
      const rows = history.getByRole('listitem');
      const form = page.locator('.store-shelf-form');
      const result = page.getByRole('region', { name: 'Kết quả tra hạn lùi' });
      const nsx = form.getByRole('textbox', { name: 'Ngày sản xuất', exact: true });
      const hsd = form.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true });
      const navigate = async hash => { await page.evaluate(hash => { location.hash = hash; }, hash); await expect(page).toHaveURL(new RegExp(`#${hash}$`)); };
      const fits = async () => {
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
        const issues = await history.evaluate(section => {
          const box = section.getBoundingClientRect();
          return [...section.querySelectorAll('dd, time, button, .ui-list-label')].filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.left < box.left || rect.right > box.right || el.scrollWidth > el.clientWidth + 1;
          }).map(el => el.textContent);
        });
        expect(issues, 'history content fits without clipping').toEqual([]);
        for (const button of await history.getByRole('button').all()) expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
      };
      await expect(history.getByText('Chưa có lịch sử tra cứu')).toBeVisible();
      await page.screenshot({ path: `${output}/empty-${viewport.width}.png` });
      await nsx.fill('01/10/2026');
      await hsd.fill('01/10/2026');
      await page.clock.runFor(400);
      await expect(form.getByRole('alert')).toHaveText('HSD phải sau NSX');
      await expect(rows).toHaveCount(0);
      for (let day = 1; day <= 22; day++) {
        await hsd.fill(`${String(day).padStart(2, '0')}/11/2026`);
        await page.clock.runFor(400);
        await expect(rows).toHaveCount(Math.min(day, 20));
      }
      await expect(rows.first().locator('dd').nth(1)).toHaveText('22/11/2026');
      await expect(rows.last().locator('dd').nth(1)).toHaveText('03/11/2026');
      await form.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await expect(rows).toHaveCount(20);
      await expect(rows.last().locator('dd').nth(1)).toHaveText('03/11/2026'); // Duplicate didn't evict oldest.
      await fits();
      const formBox = await form.boundingBox();
      const resultBox = await result.boundingBox();
      if (viewport.width >= 1200) {
        expect(resultBox.x).toBeGreaterThan(formBox.x + formBox.width);
        expect(Math.abs(resultBox.y - formBox.y)).toBeLessThan(1);
        expect((await history.boundingBox()).y).toBeGreaterThan(resultBox.y + resultBox.height);
      } else expect(resultBox.y).toBeGreaterThan(formBox.y + formBox.height);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${output}/populated-${viewport.width}.png`, fullPage: true });
      if (viewport.width < 1200) await history.scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/history-${viewport.width}.png` });
      // Restore an older record and recalculate against today's clock, preserving its historical badge.
      const historical = await rows.nth(1).locator('.ui-list-label').textContent();
      await page.clock.setFixedTime(new Date('2026-12-01T12:00:00+07:00'));
      await form.getByRole('button', { name: 'Làm mới', exact: true }).click();
      await expect(result).toHaveAttribute('data-status', 'EMPTY');
      await expect(rows).toHaveCount(20); // Form Reset doesn't erase the session history.
      await rows.nth(1).getByRole('button', { name: /^Tra lại/ }).click();
      await expect(nsx).toHaveValue('01/10/2026');
      await expect(hsd).toHaveValue('21/11/2026');
      await expect(result).toHaveAttribute('data-status', 'EXPIRED');
      await expect(rows.nth(2).locator('.ui-list-label')).toHaveText(historical);
      // Unknown-NSX mode and month input are restored too.
      await form.getByRole('switch').click();
      await form.getByRole('textbox', { name: 'HSD (Số tháng)', exact: true }).fill('2');
      await page.clock.runFor(400);
      await expect(rows.first().locator('dd small')).toHaveText('Suy từ 2 tháng');
      await form.getByRole('button', { name: 'Làm mới', exact: true }).click();
      await rows.first().getByRole('button', { name: /^Tra lại/ }).click();
      await expect(form.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      await expect(form.getByRole('textbox', { name: 'HSD (Số tháng)', exact: true })).toHaveValue('2');
      await expect(result).toHaveAttribute('data-status', 'EXPIRED');
      const beforePopup = await rows.allTextContents();
      await navigate('kph');
      await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
      await expect(quick.getByRole('region', { name: /^Lịch sử tra cứu/ })).toHaveCount(0);
      await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/12/2026');
      await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('20/12/2026');
      await page.clock.runFor(400);
      await expect(quick.getByRole('region', { name: 'Kết quả tra hạn lùi' })).toHaveAttribute('data-status', 'SAFE');
      await navigate('shelf');
      await expect(history).toBeVisible();
      expect(await rows.allTextContents()).toEqual(beforePopup);
      await fits();
      // Intermediate desktop widths use stacked cards to avoid squeezed columns.
      if (viewport.width === 1440) for (const width of [900, 1024, 1200]) {
        await page.setViewportSize({ width, height: 1024 });
        await fits();
        await page.screenshot({ path: `${output}/layout-${width}.png` });
      }
      await page.reload();
      await expect(history.getByText('Chưa có lịch sử tra cứu')).toBeVisible();
      await expect(rows).toHaveCount(0);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: empty/invalid, automatic 20 limit/order/dedup, Recall known/month mode/fresh status, Reset, route/session persistence, popup excluded, reload cleared, responsive layout`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
