// Targeted KPH calendar icon and picker checks at the assigned mobile/desktop sizes.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const cases = [
  { kind: 'TPCN', detected: '53ca5deb-573f-4e33-b1ac-9da7f1bdb528.svg', treatment: '53722948-17f5-40e6-858b-6bc0d9739927.svg', screen: '203-701' },
  { kind: 'TPTS', detected: 'b684c0dc-e5ca-4302-a906-df25869aa1cd.svg', treatment: '47be953a-ede7-41de-8645-348d0d0bfb15.svg', screen: '203-847' },
];
const expectedStrokes = [
  { file: cases[0].detected, color: '#667366', root: 20 }, { file: cases[1].detected, color: '#667366', root: 20 },
  { file: cases[0].treatment, color: '#006633', root: 24 }, { file: cases[1].treatment, color: '#006633', root: 24 },
];
for (const item of expectedStrokes) {
  const svg = fs.readFileSync(`apps/store-pwa/public/figma/${item.file}`, 'utf8');
  if (!svg.includes(`stroke="${item.color}"`) || !svg.includes(`width="${item.root}" height="${item.root}"`)) throw new Error(`Unexpected source color/root geometry: ${item.file}`);
}
async function runViewport(browser, viewport) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.STORE_APP_URL || 'http://127.0.0.1:5175');
  await page.locator(viewport.width >= 900 ? '.store-launcher-desktop' : '.store-launcher-mobile').waitFor();
  const launcher = viewport.width >= 900 ? '.store-launcher-desktop' : '.store-launcher-mobile';
  await page.locator(launcher).getByRole('button', { name: 'KPH', exact: true }).click();
  await page.getByRole('heading', { name: 'Phiếu khai báo' }).waitFor();

  for (const item of cases) {
    await page.locator('.store-create-actions button').nth(item.kind === 'TPCN' ? 0 : 1).click();
    const form = page.locator('.store-create-screen');
    await form.waitFor();
    const detected = form.locator('#detected-date');
    const detectedTrigger = form.getByRole('button', { name: 'Chọn ngày phát hiện' });
    const treatment = form.locator('#treatment-date');
    const treatmentTrigger = form.getByRole('button', { name: 'Chọn ngày xử lý (nếu có)' });
    const state = await page.evaluate(() => {
      const readIcon = selector => {
        const image = document.querySelector(selector);
        const rect = image.getBoundingClientRect();
        return { source: new URL(image.src).pathname.split('/').pop(), width: rect.width, height: rect.height };
      };
      const detected = document.querySelector('#detected-date');
      const treatment = document.querySelector('#treatment-date');
      return {
        detected: readIcon('[data-kph-calendar-icon="detected"]'),
        treatment: readIcon('[data-kph-calendar-icon="treatment"]'),
        detectedReadOnly: detected.readOnly,
        detectedDisabled: document.querySelector('#detected-date').closest('[data-calendar-input]').querySelector('button').disabled,
        treatmentDisabled: document.querySelector('#treatment-date').closest('[data-calendar-input]').querySelector('button').disabled,
        labels: [...document.querySelectorAll('.expiry-calendar-trigger')].map(button => button.getAttribute('aria-label')),
      };
    });
    const isTwenty = icon => Math.abs(icon.width - 20) <= .5 && Math.abs(icon.height - 20) <= .5;
    if (state.detected.source !== item.detected || state.treatment.source !== item.treatment || !isTwenty(state.detected) || !isTwenty(state.treatment) || !state.detectedReadOnly || !state.detectedDisabled || state.treatmentDisabled || state.labels.join('|') !== 'Chọn ngày phát hiện|Chọn ngày xử lý (nếu có)') {
      throw new Error(`${item.kind} calendar source/geometry/accessibility mismatch at ${viewport.width}x${viewport.height}: ${JSON.stringify(state)}`);
    }
    await page.screenshot({ path: `.local/figma-mobile/kph-calendar-${item.screen}-${viewport.width}x${viewport.height}.png`, fullPage: true });

    await treatmentTrigger.click();
    if (await treatmentTrigger.getAttribute('aria-expanded') !== 'true') throw new Error(`${item.kind}: trigger did not expose expanded state`);
    await page.getByRole('dialog', { name: 'Lịch chọn ngày' }).waitFor();
    await page.keyboard.press('Escape');
    if (await page.getByRole('dialog', { name: 'Lịch chọn ngày' }).count()) throw new Error(`${item.kind}: Escape did not close the picker`);
    if (!(await treatmentTrigger.evaluate(element => document.activeElement === element))) throw new Error(`${item.kind}: Escape did not restore trigger focus`);
    if (await treatmentTrigger.getAttribute('aria-expanded') !== 'false') throw new Error(`${item.kind}: expanded state was not reset`);

    await treatmentTrigger.click();
    const picker = page.getByRole('dialog', { name: 'Lịch chọn ngày' });
    await picker.waitFor();
    await picker.getByRole('button', { name: /^18 tháng/ }).first().click();
    if (!/^18\/\d{2}\/\d{4}$/.test(await treatment.inputValue())) throw new Error(`${item.kind}: date selection did not update the treatment date`);
    if (!(await treatmentTrigger.evaluate(element => document.activeElement === element))) throw new Error(`${item.kind}: date selection did not restore trigger focus`);
    if (await detected.inputValue() === '') throw new Error(`${item.kind}: detected business date was lost`);
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await form.waitFor({ state: 'detached' });
  }
  if (errors.length) throw new Error(`Browser errors at ${viewport.width}x${viewport.height}: ${errors.join('; ')}`);
  console.log(`PASS ${viewport.width}x${viewport.height}: both KPH icon sources/colors at 20x20, read-only detected date disabled, picker Escape/select/focus and accessible labels`);
  await page.close();
}
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await runViewport(browser, { width: 390, height: 844 });
    await runViewport(browser, { width: 1440, height: 1024 });
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
