// Visual review with synthetic OpenAPI examples; this does not verify backend behavior.
// Run from the repo root with the online Vite preview already running.
const { chromium } = require('playwright');
const { readFileSync, mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const output = '.local/verification';
const scenarios = [
  ['login', 1440, 1000, false], ['login-mobile', 375, 812, false],
  ['desktop', 1440, 1000, true], ['tablet', 768, 1024, true],
  ['mobile', 390, 844, true], ['small', 320, 740, true],
];
(async () => {
  mkdirSync(output, { recursive: true });
  const session = JSON.parse(readFileSync('contracts/fixtures/api/session.json'));
  const record = JSON.parse(readFileSync('contracts/fixtures/api/kph-record.json'));
  const browser = await chromium.launch();
  try {
    for (const [name, width, height, signedIn] of scenarios) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (!path.startsWith('/api/')) return route.continue();
        if (path.endsWith('/photos/1')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e9f5ed"/><text x="60" y="65" text-anchor="middle" fill="#006633" font-size="18">DEMO</text></svg>' });
        if (path.endsWith('/auth/session')) return route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? session : { status: 401, detail: 'Phiên đăng nhập đã hết hạn.' } });
        if (path.endsWith('/kph')) return route.fulfill({ json: [record] });
        return route.fulfill({ json: [] });
      });
      await page.goto(process.env.UI_REVIEW_URL || 'http://127.0.0.1:4173');
      await page.getByRole('heading', { level: 1 }).waitFor();
      if (signedIn) await page.getByText(record.catalogSnapshot.productName, { exact: true }).filter({ visible: true }).waitFor();
      assert.equal(await page.getByRole('main').count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: page overflow`);
      if (!signedIn) {
        assert.equal(await page.getByRole('button', { name: /Tạo phiếu.*TP khô/i }).count(), 0);
        await page.keyboard.press('Tab');
        assert.equal(await page.getByRole('textbox', { name: 'Tên đăng nhập' }).evaluate(el => el === document.activeElement), true);
      }
      await page.screenshot({ path: `${output}/ui-after-${name}.png`, fullPage: true });
      if (signedIn && (name === 'mobile' || name === 'desktop')) {
        await page.getByRole('button', { name: /Tạo phiếu.*TP khô/i }).click();
        const dialog = page.getByRole('dialog');
        await dialog.waitFor();
        assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), `${name}: dialog overflow`);
        await page.screenshot({ path: `${output}/ui-after-form-${name}.png` });
        await page.getByLabel('Ghi chú', { exact: true }).focus();
        await page.screenshot({ path: `${output}/ui-after-form-end-${name}.png` });
        await page.keyboard.press('Escape');
        await dialog.waitFor({ state: 'hidden' });
      }
      assert.deepEqual(errors, [], `${name}: browser errors`);
      console.log(`PASS ${name} ${width}×${height}`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
