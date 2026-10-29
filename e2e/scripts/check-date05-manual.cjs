const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const base = process.env.STORE_PREVIEW_URL || 'http://127.0.0.1:4398', out = process.env.STORE_DATE05_OUTPUT || '/tmp/date05-manual';
fs.mkdirSync(out, { recursive: true });
async function enlarge(root) { await root.evaluate(root => { const sizes = [root, ...root.querySelectorAll('*')].map(el => ({ el, font: parseFloat(getComputedStyle(el).fontSize), line: parseFloat(getComputedStyle(el).lineHeight) })); for (const { el, font, line } of sizes) {
    el.style.fontSize = font * 2 + 'px';
    if (Number.isFinite(line))
        el.style.lineHeight = line * 2 + 'px';
} }); }
(async () => {
    const b = await chromium.launch(), results = [];
    try {
        for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1024 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
            const p = await b.newPage({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
            p.setDefaultTimeout(12000);
            const errors = [];
            p.on('pageerror', e => errors.push(e.message));
            await p.clock.setFixedTime(new Date('2026-10-28T08:00:00+07:00'));
            await p.addInitScript(() => { window.scanCode = '00001234'; window.scanDenied = false; navigator.mediaDevices.getUserMedia = async () => { if (window.scanDenied)
                throw new DOMException('Synthetic denial', 'NotAllowedError'); const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 480; const stream = canvas.captureStream(10); setTimeout(() => canvas.getContext('2d').fillRect(0, 0, 640, 480), 50); return stream; }; navigator.mediaDevices.enumerateDevices = async () => []; window.BarcodeDetector = class {
                static async getSupportedFormats() { return ['ean_13']; }
                async detect() { return [{ rawValue: window.scanCode }]; }
            }; });
            await p.goto(base + '/#date');
            // Keyboard reveal must still work after pointer-focus no longer moves tap targets.
            await p.keyboard.press('Tab');
            const firstLot = p.locator(viewport.width >= 900 ? '.store-date-table .store-kph-row-open' : '.store-date-lot').first();
            await firstLot.evaluate(el => {
                window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 8, behavior: 'instant' });
                el.focus({ preventScroll: true });
            });
            await expect(firstLot).toBeFocused();
            await expect.poll(() => firstLot.evaluate(el => el.getBoundingClientRect().top - document.querySelector('.store-date .store-sticky-tabs').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(7.5);
            await p.getByRole('button', { name: 'Thêm theo dõi', exact: true }).click();
            let panel = p.getByRole('dialog', { name: 'Thêm theo dõi DATE', exact: true });
            await expect(panel.getByRole('button', { name: 'Tự nhập', exact: true })).toHaveAttribute('aria-pressed', 'true');
            await panel.getByRole('textbox', { name: 'Ngày sản xuất (NSX)', exact: true }).fill('01/10/2026');
            await panel.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('31/10/2026');
            await expect(panel.locator('.date-intake-percent')).toHaveText('13% HSD còn');
            await expect(panel.locator('.date-intake-preview')).toContainText('19/10/2026');
            await expect(panel.locator('.date-intake-preview')).toContainText('25/10/2026');
            await expect(panel.getByRole('textbox', { name: 'SKU', exact: true })).toHaveValue('');
            if (viewport.width === 390) {
                const r = await panel.locator('.date-intake-preview').boundingBox(), footer = await panel.locator('.date-intake-footer').boundingBox();
                expect(r.y + r.height).toBeLessThanOrEqual(footer.y + 1);
            }
            await panel.getByRole('textbox', { name: 'SKU', exact: true }).fill('0000129');
            await panel.getByRole('textbox', { name: 'Tên sản phẩm', exact: true }).fill('Hàng manual giữ draft');
            await panel.getByRole('combobox', { name: 'Loại hàng', exact: true }).click();
            const options = p.getByRole('option');
            expect(await options.allTextContents()).toEqual(['TP khô & khác', 'TP tươi sống']);
            await p.screenshot({ path: `${out}/choice-${viewport.width}.png` });
            await p.getByRole('option', { name: 'TP tươi sống', exact: true }).click();
            await panel.getByRole('button', { name: 'Quét mã sản phẩm để thêm theo dõi', exact: true }).click();
            await expect(p.getByRole('dialog', { name: 'Quét mã SKU / UPC', exact: true })).toHaveCount(0);
            await expect(panel.getByRole('textbox', { name: 'Barcode (nếu có)', exact: true })).toHaveValue('00001234');
            await expect(panel.getByRole('textbox', { name: 'Tên sản phẩm', exact: true })).toHaveValue('Hàng manual giữ draft');
            await expect(panel.getByRole('combobox', { name: 'Loại hàng', exact: true })).toHaveText('TP tươi sống');
            await expect(panel.locator('.date-intake-percent')).toHaveText('13% HSD còn');
            await p.evaluate(() => window.scanDenied = true);
            await panel.getByRole('button', { name: 'Quét mã sản phẩm để thêm theo dõi', exact: true }).click();
            const scanner = p.getByRole('dialog', { name: 'Quét mã SKU / UPC', exact: true });
            await expect(scanner).toContainText('bị từ chối');
            await scanner.getByRole('button', { name: 'Nhập mã thủ công', exact: true }).click();
            await expect(panel.getByRole('textbox', { name: 'SKU', exact: true })).toHaveValue('0000129');
            await panel.locator('.date-intake-preview').scrollIntoViewIfNeeded();
            await p.screenshot({ path: `${out}/manual-${viewport.width}.png` });
            await panel.getByRole('button', { name: 'Thêm vào theo dõi', exact: true }).click();
            let detail = p.getByRole('dialog', { name: 'Chi tiết lô DATE', exact: true });
            await expect(detail).toContainText('0000129');
            await detail.getByRole('button', { name: 'Đóng', exact: true }).click();
            // Lookup remains available and uses the same scanning flow; no inferred manual classification.
            await p.getByRole('button', { name: 'Thêm theo dõi', exact: true }).click();
            await panel.getByRole('button', { name: 'Tra mã hàng', exact: true }).click();
            await p.evaluate(() => { window.scanDenied = false; window.scanCode = '8936000123456'; });
            await panel.getByRole('button', { name: 'Quét mã sản phẩm để thêm theo dõi', exact: true }).click();
            await expect(panel.locator('.date-intake-product')).toContainText('0008421');
            await panel.getByRole('textbox', { name: 'Ngày sản xuất (NSX)', exact: true }).fill('01/10/2026');
            await panel.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('09/10/2026');
            await expect(panel.locator('.date-intake-preview')).toContainText('Không áp dụng');
            await expect(panel.locator('.date-intake-percent')).toHaveText('0% HSD còn');
            await panel.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('01/10/2026');
            await expect(panel.locator('.date-intake-preview')).toContainText('HSD phải sau NSX');
            await expect(panel.locator('.date-intake-percent')).toHaveCount(0);
            await panel.getByRole('textbox', { name: 'Ngày sản xuất (NSX)', exact: true }).fill('01/11/2026');
            await panel.getByRole('textbox', { name: 'Hạn sử dụng (HSD)', exact: true }).fill('30/11/2026');
            await expect(panel.locator('.date-intake-percent')).toHaveText('100% HSD còn');
            await panel.getByRole('button', { name: 'Tự nhập', exact: true }).click();
            await enlarge(panel);
            expect(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
            await panel.getByRole('combobox', { name: 'Loại hàng', exact: true }).click();
            await expect(p.getByRole('option', { name: 'TP khô & khác', exact: true })).toBeVisible();
            await p.keyboard.press('Escape');
            const foot = await panel.locator('.date-intake-footer').boundingBox();
            expect(foot.y + foot.height).toBeLessThanOrEqual(viewport.height + 1);
            await p.screenshot({ path: `${out}/text200-${viewport.width}.png` });
            expect(errors).toEqual([]);
            results.push({ viewport, keyboardFocusReveal: true, immediateBeforeIdentity: true, twoKinds: true, scanPreservesManual: true, lookupScan: true, deniedRecovery: true, percent13And0And100: true, shortAndInvalidDates: true, text200: true });
            console.log(`PASS DATE05 ${viewport.width}: manual/choice/scans, immediate milestones/%, short/invalid dates, text200`);
            await p.close();
        }
    }
    finally {
        fs.writeFileSync(out + '/results.json', JSON.stringify(results, null, 2));
        await b.close();
    }
})().catch(e => { console.error(e); process.exitCode = 1; });
