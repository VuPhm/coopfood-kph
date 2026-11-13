const { chromium, expect } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      let calls = 0;
      await page.route('**/api/v1/auth/session', route => {
        calls++;
        return calls === 2 ? route.abort('failed') : route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
      });
      await page.goto('http://127.0.0.1:4175');
      const password = page.getByLabel('Mật khẩu', { exact: true });
      const username = page.getByLabel('Tên đăng nhập', { exact: true });
      await username.fill('synthetic-user');
      await password.fill('synthetic-draft');
      const other = await context.newPage();
      await other.goto('about:blank');
      await other.bringToFront();
      await page.bringToFront();
      const failed = page.waitForEvent('requestfailed', request => request.url().includes('/api/v1/auth/session'));
      // Headless Chromium does not reliably emit a foreground event on tab switch.
      await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')));
      await expect.poll(() => calls).toBeGreaterThan(1);
      await failed;
      await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
      await expect(password).toHaveValue('synthetic-draft');
      await expect(username).toHaveValue('synthetic-user');
      const cdp = await context.newCDPSession(page);
      await Promise.all([page.waitForEvent('load'), cdp.send('Page.reload', { ignoreCache: true })]);
      await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('');
      await expect(page.getByLabel('Tên đăng nhập', { exact: true })).toHaveValue('');
      results.push(`PASS ${viewport.width}x${viewport.height}: background network failure retained draft; hard reload cleared it`);
      await context.close();
    }
  } finally {
    await browser.close();
  }
  mkdirSync('.local/verification/fresh-restore', { recursive: true });
  writeFileSync('.local/verification/fresh-restore/admin-login-revalidation.log', results.join('\n') + '\n');
  console.log(results.join('\n'));
})().catch(error => { console.error(error); process.exitCode = 1; });
