// Shared header geometry and the native raised surface gate. Synthetic dates only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/store-header'; fs.mkdirSync(output, { recursive: true });
const base = process.env.STORE_APP_URL || 'http://127.0.0.1:5175';
async function box(locator) {
  const r = await locator.boundingBox();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
}
async function geometry(page) {
  return page.evaluate(() => {
    const h = document.querySelector('.store-header').getBoundingClientRect();
    const m = document.querySelector('#store-content').getBoundingClientRect();
    return { headerTop: h.top, headerBottom: h.bottom, headerX: h.x, headerWidth: h.width, contentTop: m.top, contentX: m.x, contentWidth: m.width, contentHeight: m.height, scroll: scrollY };
  });
}
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 844, height: 390 }, { width: 1024, height: 768 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.setDefaultTimeout(8000);
      await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+07:00'));
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`${base}/#home`);
      await page.evaluate(() => document.fonts.ready);
      const account = page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true });
      const avatar = page.locator('.store-header .store-profile-avatar');
      const homeAvatar = await box(avatar), homeAccount = await box(account);
      expect(homeAvatar.width).toBe(40); expect(homeAvatar.height).toBe(40);
      expect(homeAccount.width).toBe(44); expect(homeAccount.height).toBe(44);
      const nav = page.locator(viewport.width < 900 ? '.store-mobile-toolbar' : '.store-desktop-rail');
      const navigation = await box(nav);
      let back;
      for (const screen of ['shelf', 'lookup', 'kph', 'date', 'home']) {
        await page.evaluate(screen => location.hash = screen, screen);
        await expect(page.locator(`.store-screen-${screen}`)).toBeVisible();
        await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
        expect(await box(avatar)).toEqual(homeAvatar);
        await expect(avatar).toHaveCSS('border-radius', '50%');
        await expect(avatar).toHaveCSS('display', 'grid');
        await expect(avatar).toHaveCSS('align-items', 'center');
        await expect(avatar).toHaveCSS('justify-items', 'center');
        expect(await box(account)).toEqual(homeAccount);
        expect(await box(nav)).toEqual(navigation);
        if (screen !== 'home') {
          const position = await box(page.getByRole('button', { name: 'Về trang chủ', exact: true }));
          expect(position.width).toBe(44); expect(position.height).toBeGreaterThanOrEqual(44);
          if (back) expect(position).toEqual(back); else back = position;
          const collision = await page.locator('.store-header').evaluate(el => {
            const account = el.querySelector('.store-account').getBoundingClientRect();
            const title = el.querySelector('h1').getBoundingClientRect();
            return title.top < account.bottom && title.right > account.left;
          });
          expect(collision).toBe(false);
        }
      }
      await page.evaluate(() => location.hash = 'shelf');
      await expect(page.locator('.store-screen-shelf')).toBeVisible();
      const initial = await geometry(page);
      expect(initial.headerBottom - initial.contentTop).toBe(20);
      expect(initial.contentX).toBe(initial.headerX);
      expect(initial.contentWidth).toBe(initial.headerWidth);
      expect(initial.contentHeight).toBeGreaterThanOrEqual(viewport.height);
      await page.screenshot({ path: `${output}/initial-${viewport.width}.png` });
      await page.mouse.move(viewport.width - 30, viewport.height / 2);
      await page.mouse.wheel(0, 90);
      await expect.poll(async () => (await geometry(page)).scroll).toBeGreaterThan(40);
      const midway = await geometry(page);
      expect(midway.headerTop).toBe(initial.headerTop);
      expect(midway.contentTop).toBeCloseTo(initial.contentTop - midway.scroll, 0);
      expect(await page.locator('#store-content').evaluate(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.top + 12));
      })).toBe(true);
      await page.screenshot({ path: `${output}/midway-${viewport.width}.png` });
      await page.evaluate(() => scrollTo(0, 100000));
      await expect.poll(async () => (await geometry(page)).contentTop).toBeLessThanOrEqual(1);
      expect((await geometry(page)).headerTop).toBe(initial.headerTop);
      expect(await account.evaluate(el => {
        const r = el.getBoundingClientRect();
        return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      })).toBe(false);
      await page.screenshot({ path: `${output}/raised-${viewport.width}.png` });
      await account.focus(); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: 'Tài khoản', exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole('button', { name: 'Đóng', exact: true }).click();
      await expect(dialog).toHaveCount(0); await expect(account).toBeFocused();
      expect(await box(avatar)).toEqual(homeAvatar);
      await page.getByRole('link', { name: 'Đến nội dung' }).focus(); await page.keyboard.press('Enter');
      await expect(page.locator('#store-content')).toBeFocused();
      const nsx = page.getByRole('textbox', { name: 'Ngày sản xuất', exact: true });
      const hsd = page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true });
      await nsx.fill('01/10/2026'); await hsd.fill('31/10/2026');
      await expect(page.getByRole('region', { name: 'Kết quả tra hạn lùi' })).toHaveAttribute('data-status', 'SAFE');
      const calendarTrigger = page.getByRole('button', { name: 'Chọn hạn sử dụng', exact: true });
      await calendarTrigger.click();
      const calendar = page.getByRole('dialog', { name: 'Lịch chọn ngày', exact: true });
      await expect(calendar).toBeVisible();
      const cb = await box(calendar);
      expect(cb.x).toBeGreaterThanOrEqual(0); expect(cb.x + cb.width).toBeLessThanOrEqual(viewport.width);
      expect(cb.y + cb.height).toBeLessThanOrEqual(viewport.height);
      await page.keyboard.press('Escape'); await expect(calendarTrigger).toBeFocused();
      expect(await hsd.inputValue()).toBe('31/10/2026');
      await page.getByRole('button', { name: 'Về trang chủ', exact: true }).click();
      await expect(page).toHaveURL(/#home$/); await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      expect(await box(avatar)).toEqual(homeAvatar);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: shared avatar/back/navigation anchors, native shelf scroll/layer, focus/account, lookup/picker, route reset`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
