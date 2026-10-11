// Synthetic fixtures, cold browser contexts. Lab load/interaction measurements.
const { chromium, expect } = require('../node_modules/@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4197';
const output = `.local/kph-loading/${process.env.KPH_LABEL || 'current'}`;
const direct = process.env.KPH_DIRECT === 'true';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }]) {
      for (let sample = 0; sample < Number(process.env.KPH_SAMPLES || 3); sample++) {
        const page = await browser.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
        await cdp.send('Network.enable');
        const scriptRequests = new Map();
        const scripts = [];
        cdp.on('Network.responseReceived', event => {
          if (/\.js(?:\?|$)/.test(event.response.url)) scriptRequests.set(event.requestId, new URL(event.response.url).pathname);
        });
        cdp.on('Network.loadingFinished', event => {
          const url = scriptRequests.get(event.requestId);
          if (url) scripts.push({ url, transferBytes: event.encodedDataLength });
        });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => {
          window.kphEvents = [];
          window.kphReadyAt = 0;
          window.kphClickAt = 0;
          document.addEventListener('click', event => {
            if (event.target instanceof Element && event.target.closest('.module-kph')) window.kphClickAt = event.timeStamp;
          }, true);
          let scheduled = false;
          const observer = new MutationObserver(() => {
            if (scheduled || document.querySelector('.kph-loading-frame') || !document.querySelector(innerWidth < 900 ? '.store-ticket-open' : '.store-kph-row-open')) return;
            scheduled = true;
            observer.disconnect();
            requestAnimationFrame(() => requestAnimationFrame(() => { window.kphReadyAt = performance.now(); }));
          });
          observer.observe(document, { childList: true, subtree: true });
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) if (entry.interactionId) window.kphEvents.push({ start: entry.startTime, duration: entry.duration });
          }).observe({ type: 'event', durationThreshold: 16 });
        });
        await page.goto(`${base}/#${direct ? 'kph' : 'home'}`);
        if (direct) {
          await page.waitForFunction(() => window.kphReadyAt > 0);
          const readyAt = await page.evaluate(() => window.kphReadyAt);
          results.push({ viewport, sample, cpuRate: 6, readyAt, scripts: scripts.map(item => item.url), scriptBytes: scripts.reduce((sum, item) => sum + item.transferBytes, 0) });
          console.log(`${viewport.width} sample ${sample}: direct KPH ready ${Math.round(readyAt)} ms`);
          expect(errors).toEqual([]);
          await page.close();
          continue;
        }
        await page.locator('.store-screen-home .store-account').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(500);
        const home = { scriptBytes: scripts.reduce((sum, item) => sum + item.transferBytes, 0), scripts: scripts.map(item => item.url), readyAt: await page.evaluate(() => performance.now()) };
        const trigger = page.locator(viewport.width < 900 ? '.store-launcher-mobile .module-kph' : '.store-launcher-desktop .module-kph');
        if (process.env.KPH_INTENT_WAIT) { await trigger.hover(); await page.waitForTimeout(Number(process.env.KPH_INTENT_WAIT)); }
        const start = await page.evaluate(() => performance.now());
        await trigger.click();
        await page.waitForFunction(() => window.kphReadyAt > 0);
        const kph = await page.evaluate(since => ({
          readyAfterClick: window.kphReadyAt - (window.kphClickAt || since),
          nodes: document.querySelector('.store-kph').querySelectorAll('*').length,
          cards: document.querySelectorAll('.store-ticket').length,
          rows: document.querySelectorAll('.store-kph-table tbody tr').length,
        }), start);
        kph.scripts = scripts.map(item => item.url);
        // Read accessibility only after the measured paint.
        await page.waitForTimeout(300);
        kph.clickLatency = await page.evaluate(since => Math.max(0, ...window.kphEvents.filter(e => e.start >= since).map(e => e.duration)), start);
        if (process.env.KPH_EXPECT_SPLIT === 'true') {
          expect(home.scripts.some(url => /store-kph-workspace|create-record-dialog|exceljs|excel-export/.test(url))).toBe(false);
          expect(kph.scripts.some(url => /exceljs|excel-export/.test(url))).toBe(false);
          expect(viewport.width < 900 ? kph.rows : kph.cards).toBe(0);
          expect(viewport.width < 900 ? kph.cards : kph.rows).toBe(25);
        }
        if (sample === 0) await page.screenshot({ path: `${output}/kph-${viewport.width}.png` });
        results.push({ viewport, sample, cpuRate: 6, home, kph });
        expect(errors).toEqual([]);
        console.log(`${viewport.width} sample ${sample}: Home JS ${home.scriptBytes} B, KPH ${Math.round(kph.readyAfterClick)} ms / click ${kph.clickLatency} ms, ${kph.nodes} DOM nodes, ${kph.cards} cards + ${kph.rows} rows`);
        await page.close();
      }
    }
    fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
