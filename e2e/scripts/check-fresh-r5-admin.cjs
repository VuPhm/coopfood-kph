// Synthetic local fixture only; no credential values are printed.
const { chromium, expect } = require('@playwright/test');
const base = process.env.FRESH_ADMIN_URL || 'http://127.0.0.1:4175';
const out = '.local/verification/compact-r5/admin';
require('node:fs').mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const context = await browser.newContext({ viewport });
      const anonymous = await context.request.get(`${base}/api/v1/auth/session`);
      expect(anonymous.status()).toBe(401);
      const page = await context.newPage();
      await page.goto(base);
      await page.screenshot({ path: `${out}/login-${viewport.width}.png` });
      await page.getByLabel('Tên đăng nhập', { exact: true }).fill('region.admin03');
      await page.getByLabel('Mật khẩu', { exact: true }).fill('admin-e2e-password');
      const login = page.waitForResponse(response => response.url().includes('/api/v1/auth/login') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
      expect((await login).status()).toBe(200);
      await expect(page.getByRole('button', { name: 'Menu tài khoản' })).toBeVisible();
      expect((await context.request.get(`${base}/api/v1/auth/session`)).status()).toBe(200);
      await page.screenshot({ path: `${out}/shell-${viewport.width}.png` });
      await context.close();

      const draftContext = await browser.newContext({ viewport });
      const draft = await draftContext.newPage();
      let requests = 0;
      await draft.route('**/api/v1/auth/session', route => ++requests === 2 ? route.abort('failed') : route.continue());
      await draft.goto(base);
      const password = draft.getByLabel('Mật khẩu', { exact: true });
      await password.fill('synthetic-draft');
      const other = await draftContext.newPage();
      await other.goto('about:blank');
      await other.bringToFront();
      await draft.bringToFront();
      const failed = draft.waitForEvent('requestfailed', request => request.url().includes('/api/v1/auth/session'));
      // Headless Chromium may omit the visibility event when switching tabs.
      await draft.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
      await failed;
      await expect(password).toHaveValue('synthetic-draft');
      const cdp = await draftContext.newCDPSession(draft);
      await Promise.all([draft.waitForEvent('load'), cdp.send('Page.reload', { ignoreCache: true })]);
      await expect(draft.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
      await draftContext.close();
      console.log(`PASS ${viewport.width}x${viewport.height}: API session/login, shell and tab draft`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
