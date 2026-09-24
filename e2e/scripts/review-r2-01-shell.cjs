// Synthetic visual and interaction review for the R2-01 online shell.
// Run against a local VITE_KPH_ONLINE=true Store PWA preview.
const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const assert = require('node:assert/strict');

const session = JSON.parse(readFileSync('contracts/fixtures/api/session.json'));
const history = JSON.parse(readFileSync('contracts/fixtures/api/kph-page.json'));
const baseURL = process.env.R2_SHELL_URL || 'http://127.0.0.1:4173';
const output = 'docs/delivery/r2-01-shell-spine';

(async () => {
  assert.equal(new URL(baseURL).hostname, '127.0.0.1');
  const browser = await chromium.launch();
  try {
    for (const [name, width, height] of [['phone', 390, 844], ['desktop', 1440, 1000]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      if (process.env.R2_SHELL_USE_PREVIEW_API !== '1') {
        await page.route('**/api/**', route => {
          const path = new URL(route.request().url()).pathname;
          if (path.endsWith('/auth/session')) return route.fulfill({ json: session });
          if (path.endsWith('/kph')) return route.fulfill({ json: history });
          if (path.endsWith('/photos/1')) return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#e9f5ed"/><text x="60" y="65" text-anchor="middle" fill="#006633" font-size="18">DEMO</text></svg>' });
          return route.fulfill({ status: 404, json: { detail: 'Synthetic review route unavailable' } });
        });
      }
      await page.goto(baseURL);
      const shell = page.getByRole('region', { name: 'Store App' });
      await shell.waitFor();
      await page.getByText('Sản phẩm thử nghiệm 01', { exact: true }).filter({ visible: true }).first().waitFor();
      assert.equal(await shell.getByRole('button', { name: /Tạo phiếu TP khô/ }).isEnabled(), true);
      assert.equal(await shell.getByRole('button', { name: /Tạo phiếu TP tươi/ }).isEnabled(), true);
      assert.equal(await shell.getByRole('link', { name: /Lịch sử/ }).getAttribute('href'), '#history-title');
      assert.ok(await shell.getByText('Tài khoản: Nguyễn Văn Demo · manager.demo').isVisible());
      assert.ok(await shell.getByText('Co.op Food Nguyễn Kiệm · CF-DEMO-001').isVisible());
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal page overflow`);
      assert.equal(await page.locator(name === 'phone' ? '.mobile-history' : '.desktop-history').isVisible(), true);
      const pwaDismiss = page.getByRole('button', { name: 'Đóng thông báo PWA' });
      if (await pwaDismiss.isVisible()) await pwaDismiss.click();
      await page.screenshot({ path: `${output}/${name}.png`, fullPage: false });

      await shell.getByRole('button', { name: /Tạo phiếu TP khô/ }).click();
      const dialog = page.getByRole('dialog', { name: /Tạo phiếu KPH/ });
      await dialog.waitFor();
      assert.ok(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), `${name}: create dialog overflow`);
      await page.screenshot({ path: `${output}/${name}-create.png`, fullPage: false });
      if (name === 'phone') {
        await page.setViewportSize({ width: 390, height: 560 });
        const save = dialog.getByRole('button', { name: 'Lưu phiếu' });
        await save.scrollIntoViewIfNeeded();
        const saveBox = await save.boundingBox();
        assert.ok(saveBox && saveBox.y >= 0 && saveBox.y + saveBox.height <= 560, 'phone: task footer in reduced viewport');
        await page.setViewportSize({ width, height });
      }
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      await shell.getByRole('button', { name: /Tạo phiếu TP tươi/ }).click();
      await page.getByRole('dialog', { name: /Thực phẩm tươi sống/ }).waitFor();
      await page.keyboard.press('Escape');
      await shell.getByRole('link', { name: /Lịch sử/ }).click();
      assert.equal(new URL(page.url()).hash, '#history-title');
      assert.deepEqual(errors, [], `${name}: browser errors`);
      console.log(`PASS ${name} ${width}×${height}: shell, TPCN, TPTS, history, context, overflow`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
