// Synthetic Store fixtures. Lab interaction latency, not production field INP.
const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const baseUrl = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:5176';
const output = `.local/modal-inp/${process.env.INP_LABEL || 'current'}`;
const cpuRate = Number(process.env.INP_CPU_RATE || 6);
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }].filter(v => !process.env.INP_WIDTH || v.width === Number(process.env.INP_WIDTH))) {
      const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.modalEvents = [];
        new PerformanceObserver(list => {
          for (const event of list.getEntries()) {
            if (event.interactionId) window.modalEvents.push({
              name: event.name, interactionId: event.interactionId,
              startTime: event.startTime, duration: event.duration,
              inputDelay: event.processingStart - event.startTime,
              processing: event.processingEnd - event.processingStart,
              presentation: Math.max(0, event.startTime + event.duration - event.processingEnd),
            });
          }
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
      });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
      for (const scenario of [
        { id: 'account', route: 'home', opener: () => page.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }), title: 'Tài khoản' },
        { id: 'filter', route: 'kph', opener: () => page.getByRole('button', { name: 'Lọc phiếu KPH', exact: true }), title: 'Lọc & sắp xếp' },
        { id: 'create', route: 'kph', opener: () => page.locator('.store-create-actions .create-tpts'), title: /phiếu/i },
        { id: 'quick', route: 'kph', opener: () => page.locator('.store-quick-fab'), title: 'Tra cứu lùi hàng nhanh' },
      ]) {
        await page.goto(`${baseUrl}/#${scenario.route}`);
        if (process.env.PWA_FIRST_INSTALL === 'true' && scenario.id === 'account') {
          await page.evaluate(async () => { await navigator.serviceWorker.ready; });
          await page.getByRole('button', { name: 'Đóng thông báo PWA', exact: true }).click();
        }
        if (process.env.INP_NO_BLUR === 'true') await page.addStyleTag({ content: '[data-slot="dialog-overlay"] { backdrop-filter: none !important; }' });
        await page.evaluate(() => document.fonts.ready);
        await scenario.opener().waitFor();
        await page.waitForTimeout(500);
        for (let sample = 0; sample < Number(process.env.INP_SAMPLES || 5); sample++) {
          const tracing = process.env.INP_TRACE === 'true' && sample === 0;
          if (tracing) await cdp.send('Tracing.start', { categories: 'devtools.timeline,v8.execute,disabled-by-default-devtools.timeline,disabled-by-default-v8.cpu_profiler', transferMode: 'ReturnAsStream' });
          const start = await page.evaluate(() => performance.now());
          await scenario.opener().click();
          const dialog = page.getByRole('dialog', { name: scenario.title });
          // Let the browser paint before Playwright scans the accessibility tree.
          await page.waitForTimeout(500);
          await expect(dialog).toBeVisible();
          if (tracing) {
            const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete', resolve));
            await cdp.send('Tracing.end');
            const { stream } = await completed;
            let trace = '';
            while (true) {
              const chunk = await cdp.send('IO.read', { handle: stream });
              trace += chunk.data;
              if (chunk.eof) break;
            }
            await cdp.send('IO.close', { handle: stream });
            fs.writeFileSync(`${output}/trace-${scenario.id}-${viewport.width}.json`, trace);
          }
          const events = await page.evaluate(since => window.modalEvents.filter(e => e.startTime >= since), start);
          const slowest = events.reduce((max, e) => !max || e.duration > max.duration ? e : max, null);
          const overlay = await page.locator('[data-slot="dialog-overlay"]').last().evaluate(el => ({
            backdropFilter: getComputedStyle(el).backdropFilter, background: getComputedStyle(el).backgroundColor,
          }));
          if (process.env.INP_EXPECT_NO_BLUR === 'true') expect(overlay.backdropFilter).toBe('none');
          if (process.env.INP_CHECK_GEOMETRY === 'true') {
            const bounds = await dialog.boundingBox();
            expect(bounds.x).toBeGreaterThanOrEqual(-1);
            expect(bounds.y).toBeGreaterThanOrEqual(-1);
            expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 1);
            expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 1);
          }
          results.push({ viewport, scenario: scenario.id, sample, cpuRate, latency: slowest?.duration ?? '<16', event: slowest, overlay });
          if (sample === 0) await page.screenshot({ path: `${output}/${scenario.id}-${viewport.width}.png` });
          // Tab remains inside the modal; Escape restores the ordinary opener.
          await page.keyboard.press('Tab');
          expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
          await page.keyboard.press('Escape');
          await expect(dialog).toHaveCount(0);
          await expect(scenario.opener()).toBeFocused();
          await page.waitForTimeout(200);
        }
        // A pointer click on the dimmed backdrop still dismisses sheets.
        if (scenario.id !== 'create') {
          await scenario.opener().click();
          const dialog = page.getByRole('dialog', { name: scenario.title });
          await expect(dialog).toBeVisible();
          const outside = await page.locator('[data-slot="dialog-overlay"]').evaluate(el => {
            return [[8, 8], [innerWidth - 8, 8], [8, innerHeight - 8], [innerWidth - 8, innerHeight - 8]]
              .find(([x, y]) => document.elementFromPoint(x, y) === el);
          });
          expect(outside).toBeTruthy();
          await page.mouse.click(outside[0], outside[1]);
          await expect(dialog).toHaveCount(0);
          await expect(scenario.opener()).toBeFocused();
        }
        if (scenario.id === 'filter') {
          await scenario.opener().click();
          let filter = page.getByRole('dialog', { name: scenario.title });
          await filter.getByRole('button', { name: 'Chờ duyệt', exact: true }).click();
          await page.keyboard.press('Escape');
          await scenario.opener().click();
          filter = page.getByRole('dialog', { name: scenario.title });
          await expect(filter.getByRole('button', { name: 'Chờ duyệt', exact: true })).toHaveAttribute('aria-pressed', 'true');
          await filter.getByRole('button', { name: 'Đặt lại bộ lọc', exact: true }).click();
          await page.keyboard.press('Escape');
        }
        if (scenario.id === 'create') {
          for (const kind of ['tpcn', 'tpts']) {
            const trigger = page.locator(`.store-create-actions .create-${kind}`);
            await trigger.click();
            const create = page.getByRole('dialog', { name: scenario.title });
            await expect(create).toHaveAttribute('data-kind', kind);
            await page.keyboard.press('Escape');
            await expect(create).toHaveCount(0);
            await expect(trigger).toBeFocused();
          }
        }
        const samples = results.filter(r => r.viewport.width === viewport.width && r.scenario === scenario.id);
        console.log(`${viewport.width} ${scenario.id}: ${samples.map(r => r.latency).join(', ')} ms (CPU ${cpuRate}x)`);
      }
      expect(errors).toEqual([]);
      await page.close();
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
