// Seven acceptance checks for the quick utility, with synthetic dates only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/shelf-auto';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.clock.install({ time: new Date('2026-10-06T12:00:00+07:00') });
      await page.goto(`${process.env.STORE_APP_URL || 'http://127.0.0.1:5175'}/#kph`);
      const fab = page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true });
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
      const holder = quick.getByRole('region', { name: 'Kết quả tra hạn lùi' });
      const nsx = quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true });
      const hsd = quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true });
      const days = quick.getByRole('textbox', { name: 'HSD (Số ngày)', exact: true });
      const date = holder.locator('.store-result-date');
      const fitsPanel = async () => {
        const geometry = await quick.evaluate(el => {
          const panel = el.getBoundingClientRect();
          const card = el.querySelector('.store-shelf-result').getBoundingClientRect();
          return { overflow: el.scrollHeight - el.clientHeight, top: card.top - panel.top, bottom: panel.bottom - card.bottom, scrollTop: el.scrollTop };
        });
        expect(geometry.overflow, 'utility needs no vertical scroll').toBeLessThanOrEqual(1);
        expect(geometry.top).toBeGreaterThanOrEqual(0);
        expect(geometry.bottom, 'entire result fits inside utility').toBeGreaterThanOrEqual(0);
        expect(geometry.scrollTop).toBe(0);
      };
      await fab.click();
      await expect(holder).toHaveAttribute('data-status', 'EMPTY');
      await expect(holder.getByRole('heading', { name: 'Chưa có kết quả' })).toBeVisible();
      await expect(holder.locator('.store-result-facts')).toHaveCount(0);
      await expect(holder.locator('.store-timeline-track')).toHaveCount(0);
      await fitsPanel();
      await expect(quick).toHaveCSS('--store-shelf-glow-width', '24px');
      const restingBounds = await quick.boundingBox();
      for (const input of await quick.getByRole('textbox').all()) {
        await input.focus();
        await expect(quick).toHaveCSS('--store-shelf-glow-width', '12px');
        const focusedBounds = await quick.boundingBox();
        for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(restingBounds[key] - focusedBounds[key])).toBeLessThan(1);
        await fitsPanel();
      }
      await quick.getByRole('button', { name: 'Đóng tiện ích' }).focus();
      await expect(quick).toHaveCSS('--store-shelf-glow-width', '24px');
      const original = await holder.elementHandle();
      const bounds = await holder.boundingBox();
      const panelBounds = await quick.boundingBox();
      await holder.scrollIntoViewIfNeeded();
      await quick.screenshot({ path: `${output}/holder-${viewport.width}.png` });
      await nsx.fill('01/10/2026');
      await hsd.fill('10/10/2026');
      await expect(date).toHaveText('08/10/2026'); // No submit.
      await fitsPanel();
      expect(await original.evaluate(el => el === document.querySelector('.store-shelf-result'))).toBe(true);
      await quick.evaluate(el => { el.scrollTop = 0; });
      const filledBounds = await holder.boundingBox();
      const filledPanelBounds = await quick.boundingBox();
      for (const key of ['x', 'y', 'width', 'height']) {
        expect(Math.abs(bounds[key] - filledBounds[key]), `holder ${key}`).toBeLessThan(1);
        expect(Math.abs(panelBounds[key] - filledPanelBounds[key]), `panel ${key}`).toBeLessThan(1);
      }
      // Selecting either date runs immediately, before a 350ms debounce.
      await quick.getByRole('button', { name: 'Chọn hạn sử dụng', exact: true }).click();
      await expect(quick).toHaveCSS('--store-shelf-glow-width', '12px');
      await page.getByRole('dialog', { name: 'Lịch chọn ngày' }).getByRole('button', { name: '11 tháng 10, 2026', exact: true }).click();
      await expect(date).toHaveText('09/10/2026', { timeout: 200 });
      await quick.getByRole('button', { name: 'Chọn ngày sản xuất', exact: true }).click();
      await page.getByRole('dialog', { name: 'Lịch chọn ngày' }).getByRole('button', { name: '2 tháng 10, 2026', exact: true }).click();
      await expect(date).toHaveText('09/10/2026', { timeout: 200 });
      await expect(nsx).toHaveValue('02/10/2026');
      await fitsPanel();
      await quick.getByRole('switch').click();
      await expect(quick.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
      await expect(date).toHaveText('09/10/2026', { timeout: 200 });
      await days.fill('9');
      await expect(date).toHaveText('11/10/2026');
      await fitsPanel();
      // Close button and Escape unmount without resetting; desktop FAB also toggles.
      for (const close of [() => quick.getByRole('button', { name: 'Đóng tiện ích' }).click(), () => page.keyboard.press('Escape')]) {
        await close();
        await expect(quick).toHaveCount(0);
        await fab.click();
        await expect(quick.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
        await expect(hsd).toHaveValue('11/10/2026');
        await expect(days).toHaveValue('9');
        await expect(date).toHaveText('11/10/2026');
      }
      // Mode switch back to known uses the derived NSX.
      await quick.getByRole('switch').click();
      await expect(nsx).toHaveValue('03/10/2026');
      await expect(date).toHaveText('11/10/2026', { timeout: 200 });
      await hsd.fill('03/10/2026');
      await expect(holder).toHaveAttribute('data-status', 'EMPTY');
      await expect(quick.getByRole('alert')).toHaveText('HSD phải sau NSX');
      await expect(date).toHaveCount(0);
      await expect(holder.getByRole('heading', { name: 'Kiểm tra thông tin' })).toBeVisible();
      await fitsPanel();
      await hsd.fill('');
      await expect(holder).toHaveAttribute('data-status', 'EMPTY');
      await expect(quick.getByRole('alert')).toHaveCount(0);
      // Reset while a new calculation is pending.
      await days.fill('10');
      await quick.getByRole('button', { name: 'Làm mới' }).click();
      await page.clock.runFor(500);
      await expect(holder).toHaveAttribute('data-status', 'EMPTY');
      for (const field of [nsx, hsd, days, quick.getByRole('textbox', { name: 'HSD (Số tháng)', exact: true })]) await expect(field).toHaveValue('');
      await expect(quick.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
      await fitsPanel();
      await holder.scrollIntoViewIfNeeded();
      await quick.screenshot({ path: `${output}/reset-${viewport.width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: holder/layout, auto input, picker, reopen, modes, invalid/incomplete, Reset, full panel without vertical scroll, glow 24px/12px on focus without layout shift`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
