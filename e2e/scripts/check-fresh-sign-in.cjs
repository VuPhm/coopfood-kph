const { chromium, expect } = require('@playwright/test');
const { mkdirSync } = require('node:fs');

const apps = [
  { name: 'store', url: 'http://127.0.0.1:4173', title: 'Đăng nhập cửa hàng' },
  { name: 'admin', url: 'http://127.0.0.1:4175', title: 'Đăng nhập quản trị' },
];
const output = '.local/verification/fresh-sign-in';
mkdirSync(output, { recursive: true });

async function inspect(browser, app, viewport) {
  const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
  try {
    await page.goto(app.url);
    const form = page.getByRole('main', { name: app.title });
    await expect(form.getByRole('heading')).toHaveCount(1);
    const user = form.getByLabel('Tên đăng nhập', { exact: true });
    const password = form.getByLabel('Mật khẩu', { exact: true });
    const submit = form.getByRole('button', { name: 'Đăng nhập', exact: true });
    await expect(submit).toBeDisabled();
    await expect(form.getByText(/CO.OP FOOD STORE APP|Admin Web|CHÀO MỪNG|An toàn ·/i)).toHaveCount(0);
    await expect.poll(() => form.getByRole('img').evaluate(img => img.naturalWidth)).toBeGreaterThan(0);
    await page.screenshot({ path: output + '/' + app.name + '-' + viewport.width + '.png' });
    await user.fill('region.admin03');
    await user.press('Tab');
    await expect(password).toBeFocused();
    await password.fill('admin-e2e-password');
    const reveal = form.getByRole('button', { name: 'Hiện mật khẩu' });
    const bounds = await reveal.boundingBox();
    expect(Math.min(bounds.width, bounds.height)).toBeGreaterThanOrEqual(44);
    await reveal.click();
    await expect(password).toHaveAttribute('type', 'text');
    await form.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
    await expect(password).toHaveAttribute('type', 'password');
    const paint = await user.evaluate(el => {
      const s = getComputedStyle(el);
      return [s.height, s.fontSize, s.borderRadius, s.color, s.backgroundColor];
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await submit.click();
    if (app.name === 'store') await expect(page.getByRole('heading', { name: 'Chọn cửa hàng' })).toBeVisible();
    else await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible();
    return paint;
  } finally { await page.close(); }
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const [store, admin] = await Promise.all(apps.map(app => inspect(browser, app, viewport)));
      expect(store).toEqual(admin);
      console.log('PASS both sign-in screens at ' + viewport.width + 'px', store);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
