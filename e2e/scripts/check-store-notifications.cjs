// Current DATE alerts and reminders, grouped in the notification page. Synthetic fixtures only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4280';
const output = process.env.STORE_NOTIFICATIONS_OUTPUT || '.local/date03/notifications';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
async function route(page, target) { await page.evaluate(target => { location.hash = target; }, target); }
async function noClip(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('.store-notification-groups').evaluate(root => [root, ...root.querySelectorAll('button,summary,strong,small,p,h2,h3')].filter(el =>
    !el.closest('.sr-only,[aria-hidden="true"]') && el.clientWidth && el.scrollWidth > el.clientWidth + 1
  ).map(el => el.className))).toEqual([]);
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', error => errors.push(error.message));
      await page.clock.setFixedTime(new Date('2026-09-12T08:00:00+07:00'));
      await page.goto(`${base}/#notifications`);
      const module = page.getByRole('region', { name: 'DATE', exact: true });
      await expect(module).toBeVisible();
      await expect(page.locator('[data-notification-group="warning"]')).toBeVisible();
      await audit(page, '.store-notifications-body', `warning-${viewport.width}`);
      await page.screenshot({ path: `${output}/warning-${viewport.width}.png`, fullPage: true });
      await page.clock.setFixedTime(new Date('2026-10-07T08:00:00+07:00'));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await expect(page.locator('[data-notification-group]')).toHaveCount(2);
      await expect(page.locator('[data-notification-group="withdrawal"]')).toBeVisible();
      await expect(page.locator('[data-notification-group="dates"]')).toBeVisible();
      await expect(page.locator('[data-notification-lot]')).toHaveCount(4);
      await expect(page.locator('[data-notification-lot="A24-301"]')).toHaveCount(0); // already acknowledged
      const group = page.locator('[data-notification-group="withdrawal"]');
      await group.locator('summary').focus(); await page.keyboard.press('Enter');
      await expect(group).not.toHaveAttribute('open', '');
      await expect(group.locator('.store-notification-item').first()).toBeHidden();
      await page.keyboard.press('Enter'); await expect(group).toHaveAttribute('open', '');
      await noClip(page); await audit(page, '.store-notifications-body', `groups-${viewport.width}`);
      await page.screenshot({ path: `${output}/groups-${viewport.width}.png`, fullPage: true });
      const notice = page.locator('[data-notification-lot="C24-118"]');
      await notice.focus(); await page.keyboard.press('Enter');
      const detail = page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
      await expect(detail).toContainText('Lô C24-118');
      await expect(page.locator('[data-date-lot-id="C24-118"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(detail.getByRole('button', { name: 'Ghi nhận', exact: true })).toBeEnabled();
      await detail.getByRole('button', { name: 'Ghi nhận', exact: true }).click();
      await detail.getByRole('button', { name: 'Hẹn báo lại', exact: true }).click();
      await route(page, 'notifications');
      await expect(page.locator('[data-notification-lot="C24-118"]')).toHaveCount(0);
      await page.clock.setFixedTime(new Date('2026-10-08T00:00:00+07:00'));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await expect(page.locator('[data-notification-group="reminder"]')).toBeVisible();
      await expect(page.locator('[data-notification-lot="C24-118"]')).toHaveCount(1);
      await expect(page.locator('[data-notification-lot="C24-118"]')).toContainText('Đến lịch báo lại 08/10/2026');
      await page.clock.setFixedTime(new Date('2026-10-23T08:00:00+07:00'));
      await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
      await expect(page.locator('[data-notification-group="expired"]')).toBeVisible();
      await noClip(page); await audit(page, '.store-notifications-body', `expired-reminder-${viewport.width}`);
      await page.screenshot({ path: `${output}/expired-reminder-${viewport.width}.png`, fullPage: true });
      await page.locator('.store-notification-groups').evaluate(root => {
        const styles = [root, ...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
        for (const { el, font, line } of styles) { el.style.fontSize = `${font * 1.5}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`; }
      });
      await noClip(page); await page.screenshot({ path: `${output}/text150-${viewport.width}.png`, fullPage: true });
      await route(page, 'date');
      await expect(page.getByRole('group', {name:'Loại thực phẩm'}).getByRole('button')).toHaveCount(2);
      await expect(page.getByRole('button', { name: /^Đã xử lý/ })).toHaveCount(0);
      await page.getByRole('button', { name: 'Lọc DATE', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('button', { name: 'Đã xử lý', exact: true })).toHaveCount(0);
      await page.keyboard.press('Escape');
      expect(errors).toEqual([]); results.push({ viewport, groups: true, exactLot: true, remindSuppressAndDue: true, text150: true, noResolvedDateGroup: true });
      console.log(`PASS notifications ${viewport.width}: groups/collapse, exact DATE target, reminder/suppression/deduplication, DATE two statuses, contrast/text150`);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
