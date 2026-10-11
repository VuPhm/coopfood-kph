// Synthetic lookup values; verify motion through real focus/lookup interactions.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const output = '.local/shelf-motion';
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      const page = await browser.newPage({ viewport, timezoneId: 'Asia/Ho_Chi_Minh', reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const context of ['main', 'quick']) {
        await page.goto(`${process.env.STORE_APP_URL || 'http://127.0.0.1:5175'}/#${context === 'main' ? 'shelf' : 'kph'}`);
        if (context === 'quick') await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
        const panel = context === 'main' ? page.locator('.store-screen-shelf .store-shelf') : page.getByRole('dialog', { name: 'Tra cứu lùi hàng nhanh' });
        if (context === 'quick') {
          await expect.poll(() => panel.evaluate(el => el.getAnimations().filter(a => a.animationName === 'cf-modal-pop').map(a => a.effect.getTiming().duration))).toContain(180);
          await expect.poll(() => panel.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        }
        const scope = context === 'main' ? panel : panel.locator('.store-modal-body');
        const bounds = await scope.boundingBox();
        const nsx = scope.getByRole('textbox', { name: 'Ngày sản xuất', exact: true });
        const hsd = scope.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true });
        const submit = scope.getByRole('button', { name: 'Tra cứu', exact: true });
        const focusMotion = await scope.evaluate(async el => {
          el.querySelector('input').focus();
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
          return { width: parseFloat(getComputedStyle(el).getPropertyValue('--store-shelf-glow-width')), transitions: el.getAnimations().map(animation => ({ property: animation.transitionProperty, duration: animation.effect.getTiming().duration })) };
        });
        expect(focusMotion.transitions).toContainEqual({ property: '--store-shelf-glow-width', duration: 180 });
        expect(focusMotion.width).toBeGreaterThan(12);
        expect(focusMotion.width).toBeLessThanOrEqual(24);
        await expect(scope).toHaveCSS('--store-shelf-glow-width', '12px');
        // Reverse a transition promptly; the final focus determines the width.
        await scope.evaluate(el => {
          el.querySelector('button[type="submit"]').focus();
          el.querySelector('input').focus();
        });
        await expect(scope).toHaveCSS('--store-shelf-glow-width', '12px');
        await submit.focus();
        await expect(scope).toHaveCSS('--store-shelf-glow-width', '24px');
        // Change a real lookup to SAFE, then EXPIRED; check paint-color motion.
        await nsx.fill('01/01/2030');
        await hsd.fill('01/01/2031');
        await submit.click();
        const result = scope.getByRole('region', { name: 'Kết quả tra hạn lùi' });
        await expect(result).toHaveAttribute('data-status', 'SAFE');
        const holderNode = await result.elementHandle();
        await expect.poll(() => result.evaluate(el => el.getAnimations().filter(a => a.animationName === 'store-shelf-pop').map(a => a.effect.getTiming().duration))).toContain(200);
        await expect.poll(() => scope.evaluate(el => el.getAnimations().filter(a => a.transitionProperty === '--store-shelf-glow-start').map(a => a.effect.getTiming().duration))).toContain(200);
        await expect.poll(() => scope.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        const safeColor = await scope.evaluate(el => getComputedStyle(el).getPropertyValue('--store-shelf-glow-start'));
        await nsx.fill('01/01/2010');
        await hsd.fill('01/01/2011');
        await submit.click();
        await expect(result).toHaveAttribute('data-status', 'EXPIRED');
        expect(await holderNode.evaluate(el => el === document.querySelector('.store-shelf-result'))).toBe(true);
        await expect.poll(() => result.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        await expect.poll(() => scope.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        expect(await scope.evaluate(el => getComputedStyle(el).getPropertyValue('--store-shelf-glow-start'))).not.toBe(safeColor);
        const after = await scope.boundingBox();
        for (const key of ['x', 'y', 'width', 'height']) expect(Math.abs(bounds[key] - after[key])).toBeLessThan(1);
        if (context === 'quick') expect(await scope.evaluate(el => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(1);
        const background = await scope.evaluate(el => getComputedStyle(el).backgroundImage);
        expect(background).toContain('60px 20px at 0% 12px');
        expect(background).toContain('60px 20px at 100% 12px');
        expect(background).toContain('120px');
        await scope.screenshot({ path: `${output}/${context}-${viewport.width}.png` });
        // Accessibility preference disables paint motion immediately.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await nsx.focus();
        expect(await scope.evaluate(el => getComputedStyle(el).getPropertyValue('--store-shelf-glow-width'))).toBe('12px');
        expect(await scope.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        await submit.focus();
        expect(await scope.evaluate(el => getComputedStyle(el).getPropertyValue('--store-shelf-glow-width'))).toBe('24px');
        await scope.getByRole('button', { name: 'Làm mới', exact: true }).click();
        await nsx.fill('01/01/2030');
        await hsd.fill('01/01/2031');
        await submit.click();
        await expect(result).toHaveAttribute('data-status', 'SAFE');
        expect(await result.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        if (context === 'quick') {
          await panel.getByRole('button', { name: 'Đóng tiện ích' }).click();
          await page.getByRole('button', { name: 'Mở tiện ích tra cứu lùi hàng', exact: true }).click();
          expect(await scope.evaluate(el => el.getAnimations().filter(a => a.playState !== 'finished').length)).toBe(0);
        }
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      expect(errors).toEqual([]);
      console.log(`PASS ${viewport.width}x${viewport.height}: main/quick, soft faded top corners, panel/result pop, width/color transitions, interrupted focus, stable layout, reduced motion`);
      await page.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
