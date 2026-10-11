// Themed calendar and real keyboard editing regression at both viewports.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync('.local/date-picker', { recursive: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, hasTouch: viewport.width === 390 });
      page.setDefaultTimeout(7000);
      await page.goto(process.env.STORE_APP_URL || 'http://127.0.0.1:5175');
      await page.getByRole('button', { name: 'KPH', exact: true }).click();
      await page.getByRole('button', { name: 'Lọc phiếu KPH' }).click();
      const text = page.getByRole('textbox', { name: 'Từ ngày', exact: true });
      await text.click();
      await page.keyboard.type('06102026');
      await expect(text).toHaveValue('06/10/2026');
      const trigger = page.getByRole('button', { name: 'Chọn từ ngày', exact: true });
      await trigger.focus();
      await trigger.press('Enter');
      const fallback = page.getByRole('dialog', { name: 'Lịch chọn ngày', exact: true });
      await expect(fallback).toBeVisible();
      await page.evaluate(async () => {
        await Promise.all(document.getAnimations().filter(a => a.effect.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => {})));
      });
      await page.screenshot({ path: `.local/date-picker/filter-${viewport.width}.png` });
      const bounds = await fallback.boundingBox();
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height);
      await page.keyboard.press('Escape');
      await expect(fallback).toBeHidden();
      await expect(trigger).toBeFocused();
      // Delete a day digit in-place, then complete it: year and caret stay put.
      await text.evaluate(el => { el.focus(); el.setSelectionRange(2, 2); });
      await page.keyboard.press('Backspace');
      await expect(text).toHaveValue('0/10/2026');
      await page.keyboard.type('2');
      await expect(text).toHaveValue('02/10/2026');
      await text.evaluate(el => el.setSelectionRange(4, 5));
      await page.keyboard.press('Delete');
      await expect(text).toHaveValue('02/1/2026');
      await page.keyboard.type('1');
      await expect(text).toHaveValue('02/11/2026');
      await text.evaluate(el => el.setSelectionRange(3, 5));
      await page.keyboard.press('Backspace');
      await expect(text).toHaveValue('02//2026');
      await page.keyboard.type('12');
      await expect(text).toHaveValue('02/12/2026');
      await trigger.click();
      await fallback.getByRole('button', { name: '15 tháng 12, 2026', exact: true }).click();
      await expect(text).toHaveValue('15/12/2026');
      await expect(fallback).toBeHidden();
      await text.fill('');
      await expect(text).toHaveValue('');
      await page.close();
      console.log(`PASS ${viewport.width}×${viewport.height}: typing, button-only themed picker, in-place day/month editing, selection, Escape`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
