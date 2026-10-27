// Targeted motion/interaction and local lab performance gate. Synthetic mock data only.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4384';
const baseline = process.env.STORE_MOTION_BASELINE || 'http://127.0.0.1:4380';
const output = process.env.STORE_MOTION_OUTPUT || '.local/motion01';
fs.mkdirSync(output, { recursive: true });
const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 1024 }];
function instrument() {
  window.__arrivals = [];
  const original = Element.prototype.animate;
  const currentTime = Object.getOwnPropertyDescriptor(Animation.prototype, 'currentTime');
  Element.prototype.animate = function (frames, timing) {
    const animation = original.call(this, frames, timing);
    if (this.matches('.store-page-surface,.store-page-hero-content')) {
      const record = { target: this, animation, frames, timing, at: performance.now(), route: location.hash };
      Object.defineProperty(animation, 'currentTime', { get() { return currentTime.get.call(this); }, set(value) { record.offset = value; currentTime.set.call(this, value); } });
      window.__arrivals.push(record);
    }
    return animation;
  };
}
async function settled(p) {
  await p.evaluate(async () => { await document.fonts.ready; await Promise.allSettled(document.getAnimations().filter(a => a.effect.getTiming().iterations !== Infinity).map(a => a.finished)); });
}
async function warm(p, url) {
  await p.goto(url + '/#home');
  for (const route of ['kph', 'date', 'reports', 'notifications', 'shelf', 'home']) {
    await p.evaluate(route => { location.hash = route; }, route);
    await p.locator('.store-page-surface').waitFor();
    if (route === 'kph') await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();
    if (route === 'reports') await p.getByRole('heading', { name: 'Chọn báo cáo', exact: true }).waitFor();
    await p.waitForTimeout(350);
  }
}
async function trace(p, route, interrupt) {
  return p.evaluate(async ({ route, interrupt }) => {
    const start = performance.now(), frames = [], first = window.__arrivals.length;
    location.hash = route;
    let acted = false;
    await new Promise(resolve => {
      function sample(now) {
        const root = document.querySelector('[data-store-entering]');
        const box = selector => { const el = document.querySelector(selector); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        const active = document.getAnimations().filter(a => a.effect?.target?.matches('.store-page-surface,.store-page-hero-content'));
        if (root && interrupt && !acted) {
          acted = true;
          if (interrupt === 'focus') document.querySelector('input')?.focus({ preventScroll: true });
          else if (interrupt === 'scroll') scrollTo(0, 40);
          else dispatchEvent(new Event(interrupt));
        }
        frames.push({ time: now - start, entering: !!root, active: active.length, scroll: scrollY, header: box('.store-header'), nav: box(innerWidth < 900 ? '.store-mobile-toolbar' : '.store-desktop-rail'), cap: box('.store-page-surface') });
        if (now - start < 380) requestAnimationFrame(sample); else resolve();
      }
      requestAnimationFrame(sample);
    });
    return { route, interrupt, acted, frames, effects: window.__arrivals.slice(first).map(e => ({ route: e.route, frames: e.frames, timing: e.timing, at: e.at - start, state: e.animation.playState })), remaining: document.getAnimations().filter(a => a.effect?.target?.matches('.store-page-surface,.store-page-hero-content')).length, marker: !!document.querySelector('[data-store-entering]'), willChange: getComputedStyle(document.querySelector('.store-page-surface')).willChange, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  }, { route, interrupt });
}
async function lab(browser, url, viewport) {
  const p = await browser.newPage({ viewport, serviceWorkers: 'block' });
  const cdp = await p.context().newCDPSession(p);
  await warm(p, url);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('HeapProfiler.collectGarbage');
  const before = await cdp.send('Runtime.getHeapUsage');
  const stats = await p.evaluate(async () => {
    const tasks = [], shifts = [], samples = [], dom = [];
    const lt = new PerformanceObserver(list => tasks.push(...list.getEntries().map(e => ({ duration: e.duration, route: location.hash })))); lt.observe({ type: 'longtask' });
    const cls = new PerformanceObserver(list => shifts.push(...list.getEntries().map(e => ({ value: e.value, recent: e.hadRecentInput, route: location.hash, sources: e.sources.map(s => ({ tag: s.node?.tagName, className: typeof s.node?.className === 'string' ? s.node.className : '', previous: s.previousRect.toJSON(), current: s.currentRect.toJSON() })) })))); cls.observe({ type: 'layout-shift' });
    const routes = ['kph', 'home', 'date', 'home', 'reports', 'home', 'notifications', 'home', 'shelf', 'home'];
    for (let round = 0; round < 4; round++) for (const route of routes) {
      const start = performance.now(), times = [];
      location.hash = route;
      await new Promise(resolve => { function frame(now) { times.push(now); if (now - start < 360) requestAnimationFrame(frame); else resolve(); } requestAnimationFrame(frame); });
      samples.push({ route, firstFrameMs: times[0] - start, gaps: times.slice(1).map((t, i) => t - times[i]) });
      dom.push(document.querySelectorAll('*').length);
    }
    await new Promise(resolve => setTimeout(resolve, 80)); lt.disconnect(); cls.disconnect();
    const percentile = (values, fraction) => [...values].sort((a, b) => a - b)[Math.floor((values.length - 1) * fraction)];
    const gaps = samples.flatMap(s => s.gaps);
    return { shifts, samples, frames: gaps.length, frameP95Ms: percentile(gaps, .95), maxFrameMs: Math.max(...gaps), firstFrameP95Ms: percentile(samples.map(s => s.firstFrameMs), .95), tasks, longTasks: tasks.length, medianTaskMs: tasks.length ? percentile(tasks.map(t => t.duration), .5) : 0, maxTaskMs: Math.max(0, ...tasks.map(t => t.duration)), cls: shifts.reduce((sum, s) => sum + (s.recent ? 0 : s.value), 0), allLayoutShift: shifts.reduce((sum, s) => sum + s.value, 0), dom, remaining: document.querySelectorAll('[data-store-entering]').length };
  });
  await cdp.send('HeapProfiler.collectGarbage');
  const after = await cdp.send('Runtime.getHeapUsage');
  await p.close();
  return { url, viewport, cpuThrottle: 4, ...stats, heapDeltaBytes: after.usedSize - before.usedSize };
}
(async () => {
  const browser = await chromium.launch(); const results = { interactions: [], loading: [], performance: [] };
  try {
    for (const viewport of viewports) {
      const p = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'no-preference' });
      const errors = []; p.on('pageerror', e => errors.push(e.message));
      await p.addInitScript(instrument); await warm(p, base);
      for (const route of ['kph', 'home', 'date', 'home', 'reports', 'home', 'notifications', 'home', 'shelf', 'home']) {
        const t = await trace(p, route); expect(t.effects.length).toBeGreaterThan(0); expect(t.remaining).toBe(0); expect(t.marker).toBe(false); expect(t.willChange).toBe('auto'); expect(t.overflow).toBe(false);
        expect(Math.max(...t.frames.map(f => f.active))).toBeLessThanOrEqual(2);
        for (const e of t.effects) { expect(e.timing.duration).toBeLessThanOrEqual(280); for (const k of e.frames) expect(Object.keys(k).every(key => ['opacity', 'transform'].includes(key))).toBe(true); }
        const visible = t.frames.filter(f => f.entering); expect(visible.length).toBeGreaterThan(0);
        expect(new Set(visible.map(f => JSON.stringify(f.header))).size).toBe(1); expect(new Set(visible.map(f => JSON.stringify(f.nav))).size).toBe(1);
        expect(t.frames.at(-1).scroll).toBe(0); results.interactions.push({ viewport, ...t });
      }
      for (const action of ['wheel', 'touchstart', 'beforeprint', 'focus', 'scroll']) {
        const t = await trace(p, action === 'focus' ? 'date' : 'kph', action); expect(t.acted).toBe(true); expect(t.remaining).toBe(0); expect(t.marker).toBe(false);
        expect(t.frames.filter(f => f.active > 0).length).toBeLessThanOrEqual(2);
        if (action === 'scroll') expect(t.frames.at(-1).scroll).toBe(40);
        results.interactions.push({ viewport, ...t }); await trace(p, 'home');
      }
      const reducedDuring = await p.evaluate(async () => { location.hash = 'date'; await new Promise(resolve => { const deadline = performance.now() + 2000; function check() { if (document.querySelector('[data-store-entering]') || performance.now() > deadline) resolve(); else requestAnimationFrame(check); } check(); }); return document.getAnimations().length; }); expect(reducedDuring).toBeGreaterThan(0);
      await p.emulateMedia({ reducedMotion: 'reduce' }); await settled(p); expect(await p.locator('[data-store-entering]').count()).toBe(0);
      await trace(p, 'home'); expect((await trace(p, 'kph')).effects).toEqual([]);
      await p.emulateMedia({ reducedMotion: 'no-preference' }); await trace(p, 'home');
      // Rapid navigation: latest destination wins, with one page and no stale effects.
      await p.evaluate(async () => { for (const route of ['date', 'reports', 'home', 'kph', 'home']) { location.hash = route; await new Promise(resolve => setTimeout(resolve, 40)); } }); await p.waitForTimeout(350);
      expect(await p.locator('.store-page-layout').count()).toBe(1); expect(await p.locator('[data-store-entering]').count()).toBe(0);
      await p.evaluate(async () => {
        location.hash = 'reports';
        await new Promise(resolve => { const deadline = performance.now() + 2000; function ready() { const button = [...document.querySelectorAll('button')].find(b => b.textContent.startsWith('Báo cáo tổng hợp')); if (button) { button.click(); resolve(); } else if (performance.now() > deadline) resolve(); else requestAnimationFrame(ready); } ready(); });
      }); await p.locator('.store-action-anchor').waitFor();
      const composerEffects = await p.evaluate(() => __arrivals.filter(e => e.target.isConnected && e.target.matches('.store-page-surface')).map(e => e.frames));
      expect(composerEffects.length).toBeGreaterThan(0); for (const effect of composerEffects) expect(effect.every(k => !Object.hasOwn(k, 'transform'))).toBe(true); await settled(p);
      expect(await p.locator('.store-action-anchor').count()).toBeGreaterThan(0);
      expect(await p.locator('.store-page-surface').evaluate(el => getComputedStyle(el).transform)).toBe('none');
      // Account state changes must not replay route arrival.
      const count = await p.evaluate(() => __arrivals.length); await p.getByRole('button', { name: 'Tài khoản và cửa hàng', exact: true }).click(); await p.keyboard.press('Escape'); expect(await p.evaluate(() => __arrivals.length)).toBe(count);
      await p.screenshot({ path: `${output}/report-${viewport.width}.png` });
      expect(errors).toEqual([]); await p.close(); console.log(`PASS motion ${viewport.width}: routes, interruption, reduced motion, rapid nav, fixed dock, no replay`);
    }
    // Slow lazy replacement must not start a second entrance.
    for (const viewport of viewports) {
      const p = await browser.newPage({ viewport, serviceWorkers: 'block' }); await p.addInitScript(instrument);
      let release; const gate = new Promise(resolve => { release = resolve; }); let held = false;
      await p.route(/assets\/store-kph-workspace-[^/]+\.js/, async route => { held = true; await gate; await route.continue(); });
      await p.goto(base + '/#kph', { waitUntil: 'domcontentloaded' }); await p.locator('.kph-loading-frame').waitFor(); expect(held).toBe(true); await p.waitForTimeout(350); await settled(p);
      const before = await p.evaluate(() => ({ count: __arrivals.length, y: document.querySelector('.store-page-surface').getBoundingClientRect().y })); release(); await p.locator('.store-kph:not(.kph-loading-frame)').waitFor();
      const after = await p.evaluate(() => ({ count: __arrivals.length, y: document.querySelector('.store-page-surface').getBoundingClientRect().y, active: document.querySelectorAll('[data-store-entering]').length })); expect(after.count).toBe(before.count); expect(after.y).toBe(before.y); expect(after.active).toBe(0); results.loading.push({ viewport, before, after }); await p.close();
    }
    // Fast lazy replacement continues elapsed time rather than replaying from zero.
    const fast = await browser.newPage({ viewport: viewports[0], serviceWorkers: 'block' }); await fast.addInitScript(instrument);
    let unblock; const fastGate = new Promise(resolve => { unblock = resolve; });
    await fast.route(/assets\/store-kph-workspace-[^/]+\.js/, async route => { await fastGate; await route.continue(); });
    await fast.goto(base + '/#kph', { waitUntil: 'domcontentloaded' }); await fast.locator('.kph-loading-frame').waitFor();
    await fast.waitForTimeout(30); unblock(); await fast.locator('.store-kph:not(.kph-loading-frame)').waitFor();
    const clocks = await fast.evaluate(() => __arrivals.filter(e => e.target.matches('.store-page-surface')).map(e => ({ at: e.at, offset: e.offset, connected: e.target.isConnected })));
    expect(clocks.length).toBeGreaterThan(1);
    for (const clock of clocks.slice(1)) expect(clock.offset).toBeGreaterThanOrEqual(Math.min(220, clock.at - clocks[0].at) - 5);
    results.loading.push({ fast: true, clocks }); await fast.close();
    // Cold icon decode must not move the Tra hạn actions during arrival.
    const icons = await browser.newPage({ viewport: viewports[0], serviceWorkers: 'block' });
    let releaseIcons; const iconGate = new Promise(resolve => { releaseIcons = resolve; });
    await icons.route(/figma\/(89077080-9ddc-40a9-8c49-e1d02f2c07a2|a1c5d2ed-7500-42d8-adf7-d3177be24f6c)\.svg/, async route => { await iconGate; await route.continue(); });
    await icons.goto(base + '/#shelf', { waitUntil: 'domcontentloaded' }); await icons.locator('.store-shelf-actions').waitFor(); await settled(icons);
    const actionBoxes = () => icons.locator('.store-shelf-actions button').evaluateAll(nodes => nodes.map(n => n.getBoundingClientRect().toJSON()));
    const iconBefore = await actionBoxes(); releaseIcons(); await expect.poll(() => icons.locator('.store-shelf-actions img').evaluateAll(nodes => nodes.every(n => n.complete && n.naturalWidth > 0))).toBe(true);
    const iconAfter = await actionBoxes(); expect(iconAfter).toEqual(iconBefore); results.loading.push({ coldIcons: true, before: iconBefore, after: iconAfter }); await icons.close();
    // Unsupported WAAPI falls back to the fully usable resting page.
    const fallback = await browser.newPage({ serviceWorkers: 'block' }); await fallback.addInitScript(() => { Element.prototype.animate = undefined; }); await fallback.goto(base + '/#date'); await fallback.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô', exact: true }).fill('sữa'); expect(await fallback.locator('[data-store-entering]').count()).toBe(0); await fallback.close();
    for (const viewport of viewports) {
      const old = await lab(browser, baseline, viewport), next = await lab(browser, base, viewport); results.performance.push({ baseline: old, candidate: next });
      expect(next.cls).toBeLessThanOrEqual(old.cls + .00001); expect(next.remaining).toBe(0); expect(next.dom.at(-1)).toBe(next.dom[9]);
      // Bounded same-host lab regression budget, not a real-device FPS claim.
      expect(next.frameP95Ms).toBeLessThanOrEqual(Math.max(50, old.frameP95Ms + 17)); expect(next.medianTaskMs).toBeLessThanOrEqual(Math.max(100, old.medianTaskMs * 1.3)); expect(next.maxTaskMs).toBeLessThan(500); expect(next.heapDeltaBytes).toBeLessThan(2_000_000);
      console.log(`PASS CPU4x ${viewport.width}: baseline/candidate p95 frame ${old.frameP95Ms.toFixed(1)}/${next.frameP95Ms.toFixed(1)}ms; median/max task ${old.medianTaskMs}/${next.medianTaskMs}, ${old.maxTaskMs}/${next.maxTaskMs}ms; CLS ${next.cls}; heap delta ${next.heapDeltaBytes}`);
    }
  } finally { fs.writeFileSync(`${output}/results.json`, JSON.stringify(results, null, 2)); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
