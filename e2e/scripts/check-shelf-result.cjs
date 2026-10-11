// Targeted DOM/interaction/visual gate for the lookup-result reference.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/shelf-result';
fs.mkdirSync(output, { recursive: true });
const scenarios = [
  { name: 'safe', today: '2026-06-29', status: 'SAFE', badge: 'An toàn' },
  { name: 'warning', today: '2026-06-30', status: 'WARNING', badge: 'Sắp đến hạn lùi' },
  { name: 'withdrawal-today', today: '2026-08-24', status: 'DANGER', badge: 'Đến hạn lùi hôm nay' },
  { name: 'reference', today: '2026-09-30', status: 'DANGER', badge: 'Ngày lùi hàng', facts: ['Đã qua hạn lùi37 ngày', 'HSD còn18 ngày'] },
  { name: 'expiry-today', today: '2026-10-18', status: 'DANGER', badge: 'Ngày lùi hàng', facts: ['Đã qua hạn lùi55 ngày', 'HSD hôm nay0 ngày'] },
  { name: 'expired', today: '2026-10-19', status: 'EXPIRED', badge: 'Đã hết hạn sử dụng', outside: 'after', facts: ['Đã qua hạn lùi56 ngày', 'Qua HSD1 ngày'] },
  { name: 'before-manufacture', today: '2026-01-17', status: 'SAFE', badge: 'An toàn', outside: 'before' },
  { name: 'short-safe', today: '2026-10-06', nsx: '02/10/2026', hsd: '10/10/2026', status: 'SAFE', badge: 'An toàn', short: true },
  { name: 'short-expiry-today', today: '2026-10-10', nsx: '02/10/2026', hsd: '10/10/2026', status: 'DANGER', badge: 'Đến hạn lùi hôm nay', short: true },
  { name: 'short-expired', today: '2026-10-11', nsx: '02/10/2026', hsd: '10/10/2026', status: 'EXPIRED', badge: 'Đã hết hạn sử dụng', short: true, outside: 'after' },
  { name: 'ten-day-warning', today: '2026-10-06', nsx: '01/10/2026', hsd: '10/10/2026', status: 'WARNING', badge: 'Sắp đến hạn lùi' },
  { name: 'rounded-thirteen-day', today: '2026-10-09', nsx: '01/10/2026', hsd: '13/10/2026', mainDate: '10/10/2026', status: 'WARNING', badge: 'Sắp đến hạn lùi' },
];
async function geometry(page, scope) {
  const errors = await scope.evaluate(card => {
    const issues = [];
    const box = card.getBoundingClientRect();
    if (box.height > 300) issues.push(`Oversized result card: ${box.height}px`);
    const dateSize = parseFloat(getComputedStyle(card.querySelector('.store-result-date')).fontSize);
    if (dateSize > 28) issues.push(`Oversized primary date: ${dateSize}px`);
    const inside = element => {
      const rect = element.getBoundingClientRect();
      if (rect.left < box.left - 1 || rect.right > box.right + 1) issues.push(`Outside card: ${element.textContent}`);
    };
    card.querySelectorAll('.store-result-date, .store-result-facts > div, .store-timeline-today > span, .store-timeline-milestone time, .store-timeline-milestone small').forEach(inside);
    const track = card.querySelector('.store-timeline-track').getBoundingClientRect();
    const marker = card.querySelector('.store-timeline-today').getBoundingClientRect();
    const pill = card.querySelector('.store-timeline-today > span').getBoundingClientRect();
    const centeredLeft = Math.max(track.left, Math.min(marker.left - pill.width / 2, track.right - pill.width));
    if (Math.abs(pill.left - centeredLeft) > 1) issues.push('Today label is not centered or clamped to the available space');
    if (pill.left < track.left - 1 || pill.right > track.right + 1) issues.push('Today label crosses a timeline edge');
    if (marker.left < pill.left - 1 || marker.left > pill.right + 1) issues.push('Today label lost its marker');
    for (const selector of ['small', 'time']) {
      const labels = [...card.querySelectorAll(`.store-timeline-milestone ${selector}`)].map(el => el.getBoundingClientRect());
      for (let i = 1; i < labels.length; i++) if (labels[i].left < labels[i - 1].right + 2) issues.push(`Overlapping milestone ${selector}`);
    }
    return issues;
  });
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push('Page horizontal overflow');
  expect(errors).toEqual([]);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
    const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-09-30T00:00:00+07:00') });
    await page.goto(`${process.env.STORE_APP_URL || 'http://127.0.0.1:5175'}/#shelf`);
    await expect(page.getByText('Nhập ngày để tra cứu hạn lùi hàng.', { exact: true })).toBeVisible();
    for (const scenario of scenarios) {
      await page.clock.setFixedTime(new Date(`${scenario.today}T00:00:00+07:00`));
      await page.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill(scenario.nsx || '18/01/2026');
      await page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill(scenario.hsd || '18/10/2026');
      await page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true }).click();
      const result = page.getByRole('region', { name: 'Kết quả tra hạn lùi' });
      await expect(result).toHaveAttribute('data-status', scenario.status);
      await expect(result.locator('.store-chip')).toHaveText(scenario.badge);
      const mainDate = scenario.mainDate || (scenario.short || scenario.status === 'EXPIRED' ? scenario.hsd || '18/10/2026' : scenario.nsx ? '08/10/2026' : '24/08/2026');
      await expect(result.locator('.store-result-date')).toHaveText(mainDate);
      await expect(result.locator('.store-timeline-milestone')).toHaveCount(scenario.short ? 2 : 4);
      if (scenario.short) await expect(result.getByText('Hạn lùi / HSD', { exact: true })).toBeVisible();
      if (scenario.outside) await expect(result.locator('.store-timeline-today')).toHaveAttribute('data-outside', scenario.outside);
      if (scenario.facts) for (let i = 0; i < 2; i++) await expect(result.locator('.store-result-facts > div').nth(i)).toHaveText(scenario.facts[i]);
      if (await result.locator('.is-overdue').count()) {
        await expect(result.locator('.is-overdue dt')).toHaveText('Đã qua hạn lùi');
        for (const selector of ['dt', 'dd']) await expect(result.locator(`.is-overdue ${selector}`)).toHaveCSS('color', 'rgb(226, 5, 20)');
      }
      await geometry(page, result);
      if (!scenario.short) {
        const positions = await result.locator('.store-timeline-milestone').evaluateAll(elements => elements.map(el => parseFloat(el.style.left)));
        expect(positions[1], 'warning moves right but leaves room for the next label').toBeGreaterThanOrEqual(50);
        expect(positions[1]).toBeLessThanOrEqual(56);
        expect(positions[2]).toBeGreaterThanOrEqual(75);
        expect(positions[2]).toBeLessThanOrEqual(78);
        if (scenario.name === 'warning' || scenario.name === 'withdrawal-today') {
          const today = await result.locator('.store-timeline-today').evaluate(el => parseFloat(el.style.left));
          expect(today).toBeCloseTo(positions[scenario.name === 'warning' ? 1 : 2], 5);
        }
      }
      await result.screenshot({ path: `${output}/${scenario.name}-${viewport.width}.png` });
    }
    // Validation belongs to the form; it must not displace the result grid column.
    const beforeInvalid = await page.locator('.store-shelf-result').boundingBox();
    await page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('01/10/2026');
    await page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText('HSD phải sau NSX');
    await expect(page.locator('.store-shelf-form').getByRole('alert')).toBeVisible();
    await expect(page.locator('.store-shelf-result')).toHaveAttribute('data-status', 'EMPTY');
    const afterInvalid = await page.locator('.store-shelf-result').boundingBox();
    if (viewport.width >= 760) {
      for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(beforeInvalid[key] - afterInvalid[key]), `validation result ${key}`).toBeLessThan(1);
    } else {
      const form = await page.locator('.store-shelf-form').boundingBox();
      expect(afterInvalid.y).toBeGreaterThanOrEqual(form.y + form.height);
    }
    await page.getByRole('button', { name: 'Làm mới', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Ngày sản xuất', exact: true })).toHaveValue('');
    await page.clock.setFixedTime(new Date('2026-09-30T00:00:00+07:00'));
    await page.getByRole('switch', { name: 'Đã biết ngày sản xuất', exact: true }).click();
    await page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('18/10/2026');
    await page.getByRole('textbox', { name: 'HSD (Số ngày)', exact: true }).fill('274');
    await page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true }).click();
    await expect(page.locator('.store-result-date')).toHaveText('24/08/2026');
    await expect(page.locator('.store-timeline-milestone').first().locator('time')).toHaveAttribute('datetime', '2026-01-18');
    // The same result also fits the narrower shared quick panel.
    await page.clock.setFixedTime(new Date('2026-09-30T00:00:00+07:00'));
    await page.goto(`${process.env.STORE_APP_URL || 'http://127.0.0.1:5175'}/#kph`);
    await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
    const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
    await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('18/01/2026');
    await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('18/10/2026');
    await quick.getByRole('button', { name: 'Tra cứu', exact: true }).click();
    const result = quick.getByRole('region', { name: 'Kết quả tra hạn lùi' });
    await expect(result).toHaveAttribute('data-status', 'DANGER');
    await geometry(page, result);
    await result.scrollIntoViewIfNeeded();
    await expect(result.locator('.store-timeline')).toBeInViewport();
    await quick.screenshot({ path: `${output}/quick-${viewport.width}.png` });
    // At a small phone width, endpoints and the today pill stay inside the card.
    await page.setViewportSize({ width: 375, height: 844 });
    await geometry(page, result);
    // Check both edges, their nearby positions, the center and resize without JS measurement.
    for (const offset of [-1, 0, 1, 55, 58, 59, 137, 163, 218, 260, 272, 273, 274]) {
      await page.clock.setFixedTime(new Date(new Date('2026-01-18T00:00:00+07:00').getTime() + offset * 86400000));
      await quick.getByRole('button', { name: 'Tra cứu', exact: true }).click();
      await geometry(page, result);
      if ([-1, 0, 274].includes(offset)) await result.screenshot({ path: `${output}/today-edge-${offset}-${viewport.width}.png` });
    }
    await page.setViewportSize(viewport);
    await geometry(page, result);
    await page.setViewportSize({ width: 375, height: 844 });
    await geometry(page, result);
    // Rounding at 13 days produces a tight warning/withdrawal gap on a true scale.
    await quick.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/10/2026');
    await quick.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('13/10/2026');
    await quick.getByRole('button', { name: 'Tra cứu', exact: true }).click();
    await geometry(page, result);
    await quick.screenshot({ path: `${output}/quick-rounded-${viewport.width}.png` });
    expect(errors).toEqual([]);
    console.log(`PASS ${viewport.width}x${viewport.height}: ${scenarios.length} result scenarios, timeline/today alignment and edge clamping (13 positions + resize), reset/validation, unknown NSX, quick panel including 375px and rounding, no date/label overlap or runtime errors`);
    await page.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
