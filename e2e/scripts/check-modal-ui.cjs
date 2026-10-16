// Shared modal chrome and quick lookup interaction; synthetic fixtures only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_APP_URL || 'http://127.0.0.1:5175';
const output = '.local/modal-unification'; fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.setDefaultTimeout(10000);
      await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      let accountReference;
      async function chrome(dialog, name, fullScreen = false) {
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute('data-slot', 'dialog-content');
        const overlay = page.locator('[data-slot="dialog-overlay"]');
        await expect(overlay).toHaveCSS('background-color', 'rgba(28, 38, 28, 0.55)');
        await expect(overlay).toHaveCSS('backdrop-filter', 'none');
        await expect(overlay).toHaveCSS('animation-name', 'none');
        await expect(dialog).toHaveCSS('animation-name', 'none');
        const header = dialog.locator(name === 'account' ? '.store-account-hero' : '[data-slot="dialog-header"]');
        await expect(header).toHaveCSS('background-image', accountReference.background);
        // Create uses the same sheet header gutter.
        if (name !== 'create') await expect(header).toHaveCSS('padding-left', accountReference.padding);
        const title = header.locator('[data-slot="dialog-title"]');
        await expect(title).toHaveCSS('color', accountReference.color);
        if (!fullScreen && name !== 'create') {
          await expect(title).toHaveCSS('font-size', accountReference.size);
          await expect(title).toHaveCSS('font-weight', accountReference.weight);
        }
        const b = await dialog.boundingBox();
        expect(b.x).toBeGreaterThanOrEqual(-1); expect(b.y).toBeGreaterThanOrEqual(-1);
        expect(b.x + b.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(b.y + b.height).toBeLessThanOrEqual(viewport.height + 1);
        if (!fullScreen) await expect(dialog).toHaveCSS('border-top-left-radius', '24px');
        const close = dialog.locator('[data-slot="dialog-close"]');
        if (await close.isVisible()) {
          await expect(close).toHaveAttribute('data-close-tone', 'inverse');
          const c = await close.boundingBox();
          expect(c.width).toBe(44); expect(c.height).toBe(44);
          expect(c.x).toBeGreaterThanOrEqual(b.x); expect(c.x + c.width).toBeLessThanOrEqual(b.x + b.width);
          expect(await close.evaluate(el => {
            const r = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
          })).toBe(true);
        }
        const before = await page.evaluate(() => scrollY);
        await page.mouse.move(2, 2); await page.mouse.wheel(0, 200);
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(before);
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
        }
        await page.screenshot({ path: `${output}/${name}-${viewport.width}.png` });
      }
      async function closeWithEscape(dialog, opener) {
        await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
      }
      await page.goto(`${base}/#kph`);
      if (process.env.PWA_FIRST_INSTALL === 'true') {
        await page.evaluate(async () => { await navigator.serviceWorker.ready; });
        await page.getByRole('button', { name: 'Đóng thông báo PWA', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).click();
      const account = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
      accountReference = await account.evaluate(el => {
        const header = getComputedStyle(el.querySelector('.store-account-hero'));
        const title = getComputedStyle(el.querySelector('[data-slot="dialog-title"]'));
        return { background: header.backgroundImage, padding: header.paddingLeft, color: title.color, size: title.fontSize, weight: title.fontWeight };
      });
      await page.keyboard.press('Escape'); await expect(account).toHaveCount(0);
      const fab = page.locator('.store-quick-fab');
      await fab.click();
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh', exact: true });
      await chrome(quick, 'quick');
      await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
      await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('31/10/2026');
      await expect(quick.getByRole('region', { name: 'Kết quả tra hạn lùi' })).toHaveAttribute('data-status', 'SAFE');
      const picker = quick.getByRole('button', { name: 'Chọn hạn sử dụng', exact: true });
      await picker.click();
      const calendar = page.getByRole('dialog', { name: 'Lịch chọn ngày', exact: true });
      await expect(calendar).toBeVisible();
      await calendar.getByRole('button', { name: '30 tháng 10, 2026', exact: true }).click();
      await expect(calendar).toHaveCount(0); await expect(quick).toBeVisible();
      await expect(quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true })).toHaveValue('30/10/2026');
      await picker.click(); await page.keyboard.press('Escape');
      await expect(calendar).toHaveCount(0); await expect(quick).toBeVisible();
      await expect(picker).toBeFocused();
      await page.mouse.click(2, 2); await expect(quick).toHaveCount(0); await expect(fab).toBeFocused();
      await fab.click();
      await expect(quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true })).toHaveValue('30/10/2026');
      await expect(quick.getByRole('region', { name: 'Kết quả tra hạn lùi' })).toHaveAttribute('data-status', 'SAFE');
      await quick.getByRole('button', { name: 'Đóng tiện ích', exact: true }).click();
      await expect(fab).toBeFocused();
      for (const scenario of [
        { name: 'account', title: 'Tài khoản', opener: () => page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }) },
        { name: 'filter', title: 'Lọc & sắp xếp', opener: () => page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }) },
        { name: 'detail', title: 'Chi tiết phiếu KPH', opener: () => page.locator(viewport.width < 900 ? '.store-ticket-open' : '.store-kph-table tbody button').first() },
        { name: 'create', title: /phiếu/i, opener: () => page.locator('.store-create-actions .create-tpts') },
      ]) {
        const opener = scenario.opener(); await opener.click();
        const dialog = page.getByRole('dialog', { name: scenario.title });
        // Wait for the body to become interactive inside the persistent dialog.
        if (scenario.name === 'create') await expect(dialog.locator('.create-dialog-form')).toBeVisible();
        await chrome(dialog, scenario.name, scenario.fullScreen);
        if (scenario.name === 'create' && !scenario.fullScreen) {
          await dialog.locator('#product-name').fill('Phiếu chưa lưu');
          await page.mouse.click(2, 2);
          await expect(dialog).toBeVisible();
          await expect(dialog.locator('#product-name')).toHaveValue('Phiếu chưa lưu');
        }
        await closeWithEscape(dialog, opener);
      }
      await page.evaluate(() => location.hash = 'date');
      await expect(page.locator('.store-screen-date')).toBeVisible();
      const dateFilter = page.getByRole('button', { name: 'Lọc DATE', exact: true });
      await dateFilter.click();
      const dateDialog = page.getByRole('dialog', { name: 'Lọc DATE', exact: true });
      await chrome(dateDialog, 'date-filter'); await closeWithEscape(dateDialog, dateFilter);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: unified scrim/chrome/motion, scroll lock/focus, quick state/picker/backdrop/X, account/KPH/DATE`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
