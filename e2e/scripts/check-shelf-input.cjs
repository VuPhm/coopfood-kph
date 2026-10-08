// r9: synthetic shelf form input/validation regression, main and quick utility.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/ui-r9';
fs.mkdirSync(output, { recursive: true });
const base = process.env.STORE_APP_URL || 'http://127.0.0.1:5177';
const input = (scope, name) => scope.getByRole('textbox', { name, exact: true });
const submit = scope => scope.getByRole('button', { name: 'Tra cứu', exact: true }).click();
const reset = scope => scope.getByRole('button', { name: 'Làm mới', exact: true }).click();
const result = scope => scope.getByRole('region', { name: 'Kết quả tra hạn lùi' });
async function checkForm(page, scope, prefix, tag) {
  for (const known of [true, false]) for (const unit of ['ngày', 'tháng']) {
    await reset(scope);
    if (!known) await scope.getByRole('switch').click();
    const duration = input(scope, `HSD (Số ${unit})`);
    const anchor = input(scope, known ? 'Ngày sản xuất' : 'Hạn sử dụng (HSD)');
    const expiry = unit === 'ngày' ? '10/10/2026' : '01/12/2026';
    await duration.fill(unit === 'ngày' ? '10' : '2');
    await anchor.fill(known ? '01/10/2026' : expiry);
    await expect(duration).toHaveValue(unit === 'ngày' ? '10' : '2');
    if (known) await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveValue(expiry);
    await submit(scope);
    await expect(result(scope).locator('time[datetime="2026-10-01"]')).toBeVisible();
    await anchor.fill('');
    await expect(result(scope)).toHaveCount(0);
    await expect(duration).toHaveValue(unit === 'ngày' ? '10' : '2');
    if (known) await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveValue('');
    await anchor.fill(known ? '02/10/2026' : unit === 'ngày' ? '11/10/2026' : '02/12/2026');
    await submit(scope);
    await expect(result(scope).locator('time[datetime="2026-10-02"]')).toBeVisible();
  }
  for (const unit of ['ngày', 'tháng']) {
    await reset(scope);
    await input(scope, 'Ngày sản xuất').fill('01/10/2026');
    const field = input(scope, `HSD (Số ${unit})`);
    await field.evaluate(el => el.addEventListener('focus', () => {
      el.dataset.validationOnFocus = `${el.getAttribute('aria-invalid')}:${el.getAttribute('aria-describedby')}`;
    }));
    for (const raw of ['-2', '1.5', '1e2', '0']) {
      await field.fill(raw);
      await expect(field).toHaveValue(raw);
      await submit(scope);
      await expect(scope.getByRole('alert')).toContainText('phải là số nguyên lớn hơn 0');
      await expect(field).toHaveAttribute('aria-invalid', 'true');
      await expect(field).toHaveAttribute('aria-describedby', `${prefix}-error`);
      await expect(field).toBeFocused();
      await expect(field).toHaveAttribute('data-validation-on-focus', `true:${prefix}-error`);
      await expect(result(scope)).toHaveCount(0);
    }
    await scope.screenshot({ path: `${output}/invalid-${unit}-${tag}.png` });
    await field.fill('10');
    await expect(scope.getByRole('alert')).toHaveCount(0);
    await expect(field).not.toHaveAttribute('aria-invalid');
    await submit(scope);
    await expect(result(scope)).toBeVisible();
  }
  await reset(scope);
  await input(scope, 'Ngày sản xuất').fill('01/10/2026');
  await input(scope, 'HSD (Số ngày)').fill('10000');
  await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveValue('15/02/2054');
  await submit(scope);
  await expect(result(scope)).toBeVisible();
  await reset(scope);
  await input(scope, 'HSD (Số tháng)').fill('1');
  await input(scope, 'Ngày sản xuất').fill('31/01/2028');
  await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveValue('29/02/2028');
  await expect(input(scope, 'HSD (Số ngày)')).toHaveValue('30');
  await scope.getByRole('switch').click();
  await expect(input(scope, 'HSD (Số ngày)')).toHaveValue('32');
  await submit(scope);
  await expect(result(scope).locator('time[datetime="2028-01-29"]')).toBeVisible();
  await scope.getByRole('switch').click();
  await expect(input(scope, 'Ngày sản xuất')).toHaveValue('29/01/2028');
  await input(scope, 'Hạn sử dụng (HSD)').fill('10/02/2028');
  await expect(input(scope, 'HSD (Số tháng)')).toHaveValue('');
  await input(scope, 'Ngày sản xuất').fill('01/02/2028');
  await expect(input(scope, 'HSD (Số ngày)')).toHaveValue('10');
  await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveValue('10/02/2028');
  await reset(scope);
  await submit(scope);
  await expect(input(scope, 'Ngày sản xuất')).toBeFocused();
  await input(scope, 'Ngày sản xuất').fill('10/10/2026');
  await input(scope, 'Hạn sử dụng (HSD)').fill('01/10/2026');
  await submit(scope);
  await expect(input(scope, 'Hạn sử dụng (HSD)')).toBeFocused();
  await expect(input(scope, 'Hạn sử dụng (HSD)')).toHaveAttribute('aria-describedby', `${prefix}-error`);
  await scope.getByRole('switch').click();
  await submit(scope);
  await expect(input(scope, 'HSD (Số ngày)')).toBeFocused();
  await reset(scope);
  await input(scope, 'Ngày sản xuất').fill('18/01/2026');
  await input(scope, 'Hạn sử dụng (HSD)').fill('18/10/2026');
  await submit(scope);
  await expect(result(scope)).toContainText('Đã qua hạn lùi37 ngàyHSD còn18 ngày');
  await result(scope).scrollIntoViewIfNeeded();
  await scope.screenshot({ path: `${output}/recovered-${tag}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  expect(await page.locator('[id]').evaluateAll(nodes => { const ids = nodes.map(n => n.id); return ids.length === new Set(ids).size; })).toBe(true);
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
    const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', locale: 'vi-VN', reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-09-30T00:00:00+07:00') });
    await page.goto(`${base}/#shelf`);
    await checkForm(page, page.locator('#store-content'), 'shelf', `main-${viewport.width}`);
    await page.goto(`${base}/#kph`);
    await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
    const quick = page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
    await checkForm(page, quick, 'quick-shelf', `quick-${viewport.width}`);
    const hsd = input(quick, 'Hạn sử dụng (HSD)');
    await hsd.fill('01/01/2026');
    await submit(quick);
    await expect(hsd).toBeFocused();
    await page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).click();
    await page.keyboard.press('Escape');
    await expect(quick).toBeVisible();
    await expect(hsd).toHaveValue('01/01/2026');
    await expect(hsd).toHaveAttribute('aria-invalid', 'true');
    await hsd.focus();
    await page.keyboard.press('Escape');
    await expect(quick).toBeHidden();
    await expect(page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true })).toBeFocused();
    expect(errors).toEqual([]);
    console.log(`PASS ${viewport.width}x${viewport.height}: main/quick duration-before-anchor, edit/clear, numeric preservation/recovery, month-end/mode/override, date error focus/IDs, retained result, Account draft/Escape`);
    await page.close();
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
