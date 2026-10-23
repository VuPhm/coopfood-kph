// Fresh Soft cross-form checks: visible boundaries, focus/state and geometry parity.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4300';
const baseline = process.env.STORE_BASELINE_URL || 'http://127.0.0.1:4296';
const output = process.env.STORE_FORM_OUTPUT || '.local/form01/controls';
fs.mkdirSync(output, { recursive: true });
const rgb = value => value.match(/[\d.]+/g).map(Number);
const lum = color => color.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
const ratio = (a, b) => (Math.max(lum(a), lum(b)) + .05) / (Math.min(lum(a), lum(b)) + .05);
async function material(field, wrapper = field) {
  const paint = await wrapper.evaluate(el => { const s = getComputedStyle(el); return { edge: s.borderTopColor, fill: s.backgroundColor }; });
  const value = await field.evaluate(el => ({ text: getComputedStyle(el).color, placeholder: getComputedStyle(el, '::placeholder').color }));
  expect(ratio(rgb(paint.edge), rgb(paint.fill)), 'field boundary').toBeGreaterThanOrEqual(3);
  for (const text of [value.text, value.placeholder]) {
    const color = rgb(text), bg = rgb(paint.fill), alpha = color[3] ?? 1;
    const ink = color.slice(0, 3).map((v, i) => v * alpha + bg[i] * (1 - alpha));
    expect(ratio(ink, bg), 'value/placeholder text').toBeGreaterThanOrEqual(4.5);
  }
  return paint;
}
async function fits(page) { expect(await page.locator('html').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true); }
async function create(page) {
  await page.goto(`${base}/#kph`); await page.locator('.create-tpts').click();
  await expect(page.locator('#supplier')).toBeVisible(); await page.evaluate(() => document.fonts.ready);
}
(async () => {
  const browser = await chromium.launch({ ignoreDefaultArgs: ['--hide-scrollbars'] });
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }, { width: 375, height: 812 }, { width: 844, height: 390 }]) {
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      page.setDefaultTimeout(10000); const errors = []; page.on('pageerror', e => errors.push(e.message));
      await create(page); const form = page.locator('.store-create-screen');
      const dimensions = await form.locator('#barcode, #supplier, #product-name, #quantity').evaluateAll(es => es.map(el => ({ id: el.id, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
      const old = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      await old.goto(`${baseline}/#kph`); await old.locator('.create-tpts').click();
      await expect(old.locator('#supplier')).toBeVisible(); await old.evaluate(() => document.fonts.ready);
      const previous = await old.locator('#barcode, #supplier, #product-name, #quantity').evaluateAll(es => es.map(el => ({ id: el.id, w: el.getBoundingClientRect().width, h: el.getBoundingClientRect().height })));
      expect(dimensions.map(x => x.id)).toEqual(previous.map(x => x.id));
      dimensions.forEach((d, i) => { expect(Math.abs(d.w - previous[i].w)).toBeLessThanOrEqual(1); expect(Math.abs(d.h - previous[i].h)).toBeLessThanOrEqual(1); });
      await old.close();
      const field = form.locator('#supplier'); const paint = await material(field);
      await page.keyboard.press('Tab'); await field.focus();
      expect(await field.evaluate(el => { const s = getComputedStyle(el); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; })).toBe(true);
      await material(field);
      const focused = await field.boundingBox(); expect(focused.y).toBeGreaterThanOrEqual(0); expect(focused.y + focused.height).toBeLessThanOrEqual(viewport.height);
      const readonly = form.locator('#detected-date'); await expect(readonly).toHaveAttribute('readonly', '');
      const fixedDate = await readonly.inputValue(); await readonly.focus(); await page.keyboard.press('End'); await page.keyboard.type('1');
      expect(await readonly.inputValue()).toBe(fixedDate);
      await form.getByRole('button', { name: 'Xem lại', exact: true }).click();
      const invalid = form.locator('#product-name'); await expect(invalid).toHaveAttribute('aria-invalid', 'true');
      await expect(invalid).toBeFocused(); await material(invalid);
      await page.screenshot({ path: `${output}/validation-${viewport.width}.png` });
      await invalid.fill('Hàng tổng hợp kiểm thử'); await fits(page);
      await page.keyboard.press('Escape');
      await page.goto(`${base}/#login`);
      const user = page.getByLabel('Tên đăng nhập', { exact: true }); const password = page.getByLabel('Mật khẩu', { exact: true });
      await expect(user).toBeVisible();
      await material(user, user.locator('..')); await material(password, password.locator('..'));
      await user.fill('form-preview'); await page.keyboard.press('Tab'); await expect(password).toBeFocused();
      await password.fill('sample-form-password');
      await page.getByRole('button', { name: 'Hiện mật khẩu', exact: true }).click();
      await expect(password).toHaveAttribute('type', 'text');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('chưa khả dụng');
      await expect(password).toHaveValue('sample-form-password');
      await page.screenshot({ path: `${output}/login-${viewport.width}.png` });
      await page.locator('.store-login').evaluate(root => {
        const nodes = [...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
        for (const { el, size, line } of nodes) { el.style.fontSize = `${size * 1.5}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`; }
      });
      await password.focus(); await fits(page);
      await page.screenshot({ path: `${output}/large-text-${viewport.width}.png` });
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto(`${base}/#kph`); await page.locator('.create-tpts').click(); await expect(page.locator('#supplier')).toBeVisible();
      expect(await page.locator('#supplier').evaluate(el => getComputedStyle(el).borderTopColor)).not.toBe('rgba(0, 0, 0, 0)');
      await fits(page); expect(errors).toEqual([]);
      results.push({ viewport, dimensions, paint, nativeReadonly: true, linkedInvalidFocus: true, loginRecovery: true });
      await page.close(); console.log(`PASS Fresh Soft ${viewport.width}x${viewport.height}: field geometry parity, boundaries/text/focus, readonly/errors, login/reveal/recovery, 150% text, forced colors`);
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
