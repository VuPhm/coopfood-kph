// Run against preview:ui on port4175. Keep the HTTP cache enabled throughout.
const { chromium, expect } = require('@playwright/test');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const base = 'http://127.0.0.1:4175';
const cssPath = resolve('apps/admin-web/src/styles.css');
const original = readFileSync(cssPath, 'utf8');
(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const response = await page.goto(base);
    assert.equal(response.headers()['cache-control'], 'no-store');
    assert.equal(await page.evaluate(() => navigator.serviceWorker.getRegistrations().then(x => x.length)), 0);
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
    const marker = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--admin-reload-proof').trim());
    for (const value of ['revision-one', 'revision-two']) {
      writeFileSync(cssPath, `${original}\n:root { --admin-reload-proof: ${value}; }\n`);
      // Wait until Vite has rebuilt the changed module before asking the browser to reload.
      await expect.poll(async () => (await context.request.get(`${base}/src/styles.css`)).text()).toContain(`--admin-reload-proof: ${value}`);
      // Normal reload, without CDP cache disabling, cache clearing or URL busting.
      await page.reload();
      await expect.poll(marker).toBe(value);
      await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible();
    }
    const css = await context.request.get(`${base}/src/styles.css`);
    assert.equal(css.headers()['cache-control'], 'no-store');
    const output = await new Promise((resolveOutput, reject) => {
      const child = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'apps/admin-web', '--config', 'apps/admin-web/vite.config.ts', '--host', '127.0.0.1', '--port', '4175', '--strictPort']);
      let text = ''; child.stdout.on('data', x => text += x); child.stderr.on('data', x => text += x);
      child.on('error', reject); child.on('exit', code => resolveOutput({ code, text }));
    });
    assert.notEqual(output.code, 0);
    assert.match(output.text, /Port 4175 is already in use/);
    assert.equal((await context.request.get(base)).status(), 200);
    console.log('PASS: normal reload sees two CSS revisions, no-store HTML/CSS, no Admin service worker; occupied port refuses fallback without stopping existing preview.');
  } finally {
    writeFileSync(cssPath, original);
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
