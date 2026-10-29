const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4398';
const out = process.env.STORE_TAP_OUTPUT || '/tmp/date05-kph-tap';
fs.mkdirSync(out, { recursive: true });

async function swipeTags(page, row) {
  await row.evaluate(el => el.scrollIntoView({ block: 'center' }));
  const strip = row.locator('.store-ticket-tags');
  expect(await strip.evaluate(el => el.scrollWidth > el.clientWidth + 1)).toBe(true);
  await strip.evaluate(el => { el.scrollLeft = 0; });
  const box = await strip.boundingBox();
  const cdp = await page.context().newCDPSession(page);
  const x = box.x + box.width * .85, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - box.width * .65 * i / 8, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => strip.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  // Finish native inertia before starting a separate tap gesture.
  await strip.evaluate(el => new Promise(resolve => {
    let previous = el.scrollLeft, stableSince = performance.now();
    function frame(now) {
      if (el.scrollLeft !== previous) { previous = el.scrollLeft; stableSince = now; }
      if (now - stableSince >= 200) resolve(); else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }));
  await cdp.detach();
}

(async () => {
  const browser = await chromium.launch(), results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }]) {
      const touch = viewport.width < 900;
      const page = await browser.newPage({ viewport, hasTouch: touch, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.setDefaultTimeout(10000);
      await page.goto(base + '/#kph');
      const tap = locator => touch ? locator.tap() : locator.click();
      const rows = page.locator(touch ? '.store-ticket' : '.store-kph-record-row');
      const row = rows.filter({ hasText: 'Cải thìa VietGAP 500 g' });
      const long = rows.filter({ hasText: 'Nông sản mẫu 02' });
      const detail = page.getByRole('dialog', { name: 'Chi tiết phiếu KPH', exact: true });
      const bottomTap = async () => {
        await row.evaluate(el => el.scrollIntoView({ block: 'center' }));
        const r = await row.boundingBox();
        if (touch) await page.touchscreen.tap(r.x + r.width * .5, r.y + r.height - 3);
        else await page.mouse.click(r.x + r.width * .5, r.y + r.height - 3);
      };
      for (const kind of ['condition', 'resolution', 'approval']) {
        await tap(row.locator(`[data-label-kind=${kind}]`));
        await expect(detail).toBeVisible();
        await tap(detail.getByRole('button', { name: 'Đóng', exact: true }));
        await expect(detail).toHaveCount(0);
      }
      await bottomTap();
      await expect(detail).toBeVisible();
      await tap(detail.getByRole('button', { name: 'Đóng', exact: true }));
      if (touch) {
        await swipeTags(page, long);
        await expect(detail).toHaveCount(0);
      }
      await page.screenshot({ path: `${out}/view-${viewport.width}.png` });
      // This tap used to move during focus at 320px and miss the button.
      await tap(page.getByRole('button', { name: 'Chọn', exact: true }));
      await expect(rows.first()).toHaveAttribute('data-selection-mode', 'true');
      const check = row.getByRole('checkbox');
      for (const kind of ['condition', 'resolution']) {
        const before = await check.isChecked();
        await tap(row.locator(`[data-label-kind=${kind}]`));
        await expect(check).toBeChecked({ checked: !before });
        await expect(detail).toHaveCount(0);
      }
      const before = await check.isChecked();
      await bottomTap();
      await expect(check).toBeChecked({ checked: !before });
      if (touch) {
        const longCheck = long.getByRole('checkbox'), selected = await longCheck.isChecked();
        await swipeTags(page, long);
        await expect(longCheck).toBeChecked({ checked: selected });
        await expect(detail).toHaveCount(0);
      }
      await page.screenshot({ path: `${out}/selection-${viewport.width}.png` });
      await tap(page.getByRole('button', { name: 'Xong', exact: true }));
      // Preserve keyboard focus reveal under the pinned food-kind bar.
      await page.keyboard.press('Tab');
      const opener = row.getByRole('button', { name: 'Mở phiếu Cải thìa VietGAP 500 g', exact: true });
      await opener.evaluate(el => {
        const top = el.getBoundingClientRect().y + scrollY;
        window.scrollTo({ top: top - 8, behavior: 'instant' });
        el.focus({ preventScroll: true });
      });
      await expect(opener).toBeFocused();
      await expect.poll(() => opener.evaluate(el => {
        const tabs = document.querySelector('.store-kph .store-sticky-tabs');
        return el.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom;
      })).toBeGreaterThanOrEqual(7.5);
      expect(errors).toEqual([]);
      results.push({ viewport, input: touch ? 'native tap' : 'mouse', viewTagsAndBottomOpen: true, selectionTagsAndBottomToggle: true, nativeSwipeInBothModes: touch, keyboardFocusReveal: true });
      console.log(`PASS KPH ${viewport.width}: view/select tags/bottom, swipe=${touch}, keyboard focus`);
      await page.close();
    }
  } finally {
    fs.writeFileSync(out + '/results.json', JSON.stringify(results, null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
