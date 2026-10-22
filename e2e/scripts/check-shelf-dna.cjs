// Targeted Home DNA presentation and interaction gate; synthetic dates only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/shelf-dna';
fs.mkdirSync(output, { recursive: true });
const baseUrl = process.env.STORE_APP_URL || 'http://127.0.0.1:5175';
async function bounds(page, scope) {
  const issues = await scope.evaluate(root => {
    const box = root.getBoundingClientRect();
    const issues = [];
    for (const el of root.querySelectorAll('label, input, button, .store-known-toggle strong, .store-result-date, .store-timeline small, .store-timeline time, .store-timeline-today > span')) {
      const r = el.getBoundingClientRect();
      // Icon controls deliberately expose a larger pseudo-element touch target.
      const clippedText = el.textContent.trim() && el.scrollWidth > el.clientWidth + 1;
      if (r.width && (r.left < box.left - 1 || r.right > box.right + 1 || clippedText)) issues.push({ tag: el.tagName, text: el.textContent || el.id || el.className, width: r.width, scroll: el.scrollWidth, client: el.clientWidth });
    }
    const labels = [...root.querySelectorAll('.store-timeline-milestone small')].map(el => el.getBoundingClientRect());
    for (let i = 1; i < labels.length; i++) if (labels[i].left < labels[i - 1].right + 2) issues.push('Overlapping timeline labels');
    return issues;
  });
  expect(issues).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
      const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.clock.install({ time: new Date('2026-10-06T12:00:00+07:00') });
      await page.goto(`${baseUrl}/#home`);
      const homeHeader = await page.locator('.store-page-hero').evaluate(el => getComputedStyle(el).backgroundImage);
      await page.evaluate(() => { location.hash = 'shelf'; });
      const form = page.locator('.store-shelf-form');
      const card = page.getByRole('region', { name: 'Kết quả tra hạn lùi' });
      const history = page.getByRole('region', { name: /^Lịch sử tra cứu/ });
      await expect(form).toBeVisible();
      await expect(page.locator('.store-page-hero')).toHaveCSS('background-image', 'linear-gradient(115deg, rgb(0, 114, 78), rgb(0, 134, 85))');
      await expect(form.locator('.store-known-toggle')).toHaveCSS('background-color', 'rgb(255, 240, 230)');
      await expect(form.getByRole('button', { name: 'Tra cứu', exact: true })).toHaveCSS('background-color', 'rgb(0, 114, 78)');
      await expect(card).toHaveCSS('border-top-left-radius', '18px');
      await expect(history.getByRole('heading', { name: /^Lịch sử tra cứu/ })).toHaveCSS('color', 'rgb(32, 52, 74)');
      expect((await form.getByRole('switch').boundingBox()).height).toBeGreaterThanOrEqual(44);
      await bounds(page, page.locator('.store-shelf'));
      await page.screenshot({ path: `${output}/empty-${viewport.width}.png`, fullPage: true });
      const nsx = form.getByRole('textbox', { name: 'Ngày sản xuất', exact: true });
      const hsd = form.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true });
      await nsx.fill('01/10/2026');
      await hsd.fill('10/10/2026');
      await page.clock.runFor(400);
      await expect(card).toHaveAttribute('data-status', 'WARNING');
      await expect(card.locator('.store-chip')).toHaveCSS('color', 'rgb(136, 67, 18)');
      await bounds(page, page.locator('.store-shelf'));
      await nsx.focus();
      await expect(nsx).toHaveCSS('outline-style', 'solid');
      await expect(nsx).toHaveCSS('border-color', 'rgb(0, 114, 78)');
      await page.keyboard.press('Tab');
      await expect(form.getByRole('button', { name: 'Chọn ngày sản xuất', exact: true })).toBeFocused();
      await page.keyboard.press('Enter');
      const calendar = page.getByRole('dialog', { name: 'Lịch chọn ngày' });
      await expect(calendar).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(calendar).toHaveCount(0);
      await expect(form.getByRole('button', { name: 'Chọn ngày sản xuất', exact: true })).toBeFocused();
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${output}/result-${viewport.width}.png` });
      await form.getByRole('button', { name: 'Làm mới', exact: true }).click();
      await history.getByRole('button', { name: /^Tra lại/ }).click();
      await expect(card).toHaveAttribute('data-status', 'WARNING');
      await hsd.fill('01/10/2026');
      await page.clock.runFor(400);
      await expect(form.getByRole('alert')).toHaveText('HSD phải sau NSX');
      await expect(card).toHaveAttribute('data-status', 'EMPTY');
      await bounds(page, page.locator('.store-shelf'));
      await page.evaluate(() => { location.hash = 'kph'; });
      await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
      const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
      await expect(quick.locator('.store-known-toggle')).toHaveCSS('background-color', 'rgb(255, 240, 230)');
      await expect(quick.getByRole('region', { name: /^Lịch sử tra cứu/ })).toHaveCount(0);
      expect((await quick.getByRole('button', { name: 'Đóng tiện ích' }).boundingBox()).height).toBeGreaterThanOrEqual(44);
      await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
      await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('10/10/2026');
      await page.clock.runFor(400);
      await bounds(page, quick);
      await quick.screenshot({ path: `${output}/quick-${viewport.width}.png` });
      await quick.getByRole('switch').click();
      await bounds(page, quick);
      await page.keyboard.press('Escape');
      await expect(quick).toHaveCount(0);
      await page.evaluate(() => { location.hash = 'home'; });
      await expect(page.locator('.store-page-hero')).toHaveCSS('background-image', homeHeader);
      await expect(page.locator('.store-home-art')).toHaveCount(0);
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: scoped DNA, main/quick empty/result/error, semantic status, history Recall, 44px controls, focus/picker keyboard, no overflow, Home preserved`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
