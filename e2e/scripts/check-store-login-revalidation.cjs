const { chromium, expect } = require('@playwright/test');
const base = process.env.FRESH_STORE_ONLINE_URL || 'http://127.0.0.1:4173';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1024 } });
      const page = await context.newPage();
      let count = 0, unblock, intercepted;
      const waiting = new Promise(resolve => { intercepted = resolve; });
      await page.route('**/api/v1/auth/session', async route => {
        if (++count !== 2) return route.continue();
        await new Promise(resolve => { unblock = resolve; intercepted(); });
        await route.abort('failed');
      });
      await page.goto(base);
      const username = page.getByLabel('Tên đăng nhập', { exact: true });
      const password = page.getByLabel('Mật khẩu', { exact: true });
      await username.fill('synthetic-draft-user');
      await password.fill(' synthetic-draft ');
      await password.evaluate(e => { window.__loginDraftInput = e; });
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await waiting;
      expect(await password.evaluate(e => e === window.__loginDraftInput)).toBe(true);
      await expect(password).toHaveValue(' synthetic-draft ');
      const failed = page.waitForEvent('requestfailed', request => request.url().includes('/auth/session'));
      unblock();
      await failed;
      await expect(password).toHaveValue(' synthetic-draft ');
      expect(await password.evaluate(e => e === window.__loginDraftInput)).toBe(true);
      await page.reload();
      await expect(password).toHaveValue('');
      await expect(username).toHaveValue('');
      await context.close();
      console.log(`PASS Store ${width}: same login DOM through pending/offline check; reload clears draft`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
