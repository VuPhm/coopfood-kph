// DATE labels derive from the Tra hạn milestones; processing remains independent.
const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4201';
const output = process.env.STORE_DATE_OUTPUT || '.local/date-milestones';
process.env.STORE_KPH_COLORS_OUTPUT = output;
const { audit } = require('./check-kph-colors.cjs');
fs.mkdirSync(output, { recursive: true });
const cases = [
  { time: '2026-08-01T05:00:00+07:00', phase: 'SAFE', text: 'Chưa cảnh báo' },
  { time: '2026-10-04T05:00:00+07:00', phase: 'WARNING', text: 'Cảnh báo' },
  { time: '2026-10-24T17:30:00Z', phase: 'DANGER', text: 'Đến hạn lùi' },
  { time: '2026-11-15T05:00:00+07:00', phase: 'DANGER', text: 'Đến hạn lùi' },
  { time: '2026-11-16T05:00:00+07:00', phase: 'EXPIRED', text: 'Hết HSD' },
];
const timelineData = scope => scope.locator('.store-timeline').evaluate(el => ({
  dates: [...el.querySelectorAll('.store-timeline-milestone time')].map(t => t.dateTime),
  labels: [...el.querySelectorAll('.store-timeline-milestone small')].map(t => t.textContent),
  today: el.querySelector('.store-timeline-today').style.left,
}));
async function timelineGeometry(scope) {
  expect(await scope.locator('.store-date-milestones').evaluate(root => {
    const box = root.getBoundingClientRect();
    const issues = [];
    for (const selector of ['time', 'small']) {
      const labels = [...root.querySelectorAll(`.store-timeline-milestone ${selector}`)].map(el => el.getBoundingClientRect()).filter(r => r.width > 0);
      labels.forEach(r => { if (r.left < box.left || r.right > box.right) issues.push('outside card'); });
      for (let i=1; i<labels.length; i++) if (labels[i].left < labels[i-1].right + 2) issues.push(`overlap ${selector}`);
    }
    return issues;
  })).toEqual([]);
}
(async () => {
  const browser = await chromium.launch(); const results = [];
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 844 }]) {
      for (const [i, state] of cases.entries()) {
        const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
        const errors = []; page.on('pageerror', error => errors.push(error.message));
        await page.clock.setFixedTime(new Date(state.time));
        await page.goto(`${base}/#date`);
        await page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' }).fill('A24-301');
        const lot = page.locator('.store-date-lot').filter({ hasText: 'Lô A24-301' });
        await expect(lot.locator('[data-date-phase]')).toHaveAttribute('data-date-phase', state.phase);
        await expect(lot.locator('[data-date-phase]')).toContainText(state.text);
        await expect(lot.locator('.store-date-life, .store-timeline, [role="meter"]')).toHaveCount(0);
        await audit(page, '.store-date', `list-${state.phase}-${i}-${viewport.width}`);
        await lot.click();
        const detail = viewport.width >= 900 ? page.getByRole('region', { name: 'Chi tiết lô DATE' }) : page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
        const milestones = detail.getByRole('region', { name: 'Mốc DATE của lô' });
        await expect(milestones.locator('[data-date-phase]')).toHaveAttribute('data-date-phase', state.phase);
        await expect(milestones.locator('.store-date-milestone-facts')).toContainText('03/10/2026');
        await expect(milestones.locator('.store-date-milestone-facts')).toContainText('25/10/2026');
        await expect(detail).toContainText('0008421'); await expect(detail).toContainText('A24-301');
        expect(await detail.locator('.store-timeline-track').evaluate(el => getComputedStyle(el, '::before').backgroundImage)).toContain('linear-gradient');
        await timelineGeometry(detail);
        await audit(page, viewport.width >= 900 ? '.store-date-detail' : '.store-date-sheet', `detail-${state.phase}-${i}-${viewport.width}`);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const data = await timelineData(detail);
        await page.screenshot({ path: `${output}/${state.phase}-${i}-${viewport.width}.png`, fullPage: true });
        if (state.phase === 'EXPIRED') {
          await expect(detail.getByRole('button', { name: 'Xử lý', exact: true })).toBeEnabled();
          await expect(lot.locator('[data-processing-status]')).toHaveAttribute('data-processing-status', 'acknowledged');
          await expect(lot.locator('[data-date-phase]')).toHaveAttribute('data-date-phase', 'EXPIRED');
        }
        if (state.phase === 'WARNING') {
          await detail.evaluate(root => {
            const styles = [...root.querySelectorAll('*')].map(el => { const s = getComputedStyle(el); return { el, font: parseFloat(s.fontSize), line: parseFloat(s.lineHeight) }; });
            for (const { el, font, line } of styles) { el.style.fontSize = `${font * 1.5}px`; if (Number.isFinite(line)) el.style.lineHeight = `${line * 1.5}px`; }
          });
          await timelineGeometry(detail);
          expect(await detail.evaluate(root => root.scrollWidth <= root.clientWidth + 1)).toBe(true);
          await page.screenshot({ path: `${output}/detail-text-150-${viewport.width}.png`, fullPage: true });
          // The same timeline data and marker must also appear in Tra hạn.
          await page.goto(`${base}/#shelf`);
          await page.getByRole('textbox', { name: 'Ngày sản xuất', exact: true }).fill('01/08/2026');
          await page.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('15/11/2026');
          await page.locator('#store-content').getByRole('button', { name: 'Tra cứu', exact: true }).click();
          const lookup = page.getByRole('region', { name: 'Kết quả tra hạn lùi' });
          expect(await timelineData(lookup)).toEqual(data);
        }
        expect(errors).toEqual([]);
        results.push({ viewport, ...state, timeline: data }); await page.close();
      }
      const page = await browser.newPage({ viewport, serviceWorkers: 'block', reducedMotion: 'reduce' });
      await page.clock.setFixedTime(new Date('2026-10-12T05:00:00+07:00'));
      await page.goto(`${base}/#date`);
      await page.getByRole('textbox', { name: 'Tìm SKU, barcode, tên hàng hoặc lô' }).fill('D24-090');
      await page.locator('.store-date-lot').click();
      const detail = viewport.width >= 900 ? page.getByRole('region', { name: 'Chi tiết lô DATE' }) : page.getByRole('dialog', { name: 'Chi tiết lô DATE' });
      await expect(detail).toContainText('Thiếu NSX để tính mốc cảnh báo và hạn lùi');
      await expect(detail.locator('.store-timeline')).toHaveCount(0);
      await page.screenshot({ path: `${output}/missing-nsx-${viewport.width}.png`, fullPage: true });
      await page.close();
      console.log(`PASS DATE milestones ${viewport.width}: labels at NSX/warning/withdrawal/HSD/expiry, HCM boundary, timeline parity, contrast/geometry, missing NSX and resolved-expired independence`);
    }
    fs.writeFileSync(`${output}/phase-results.json`, JSON.stringify(results, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
