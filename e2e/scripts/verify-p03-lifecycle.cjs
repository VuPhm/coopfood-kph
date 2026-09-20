// Destructive only to the synthetic database created by start-p03-acceptance.sh.
// Run on a fresh preview. No network mocks, no direct DB mutation during this flow.
const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const assert = require("node:assert/strict");
const base = "http://127.0.0.1:4174";
const output = ".local/verification/p03-real-backend";
const storeA = "30000000-0000-4000-8000-000000000001";
const storeB = "30000000-0000-4000-8000-000000000002";
const regionSchedule = "40000000-0000-4000-8000-000000000002";

async function clickResponse(page, locator, suffix, status) {
  const responsePromise = page.waitForResponse((r) => r.url().endsWith(suffix) && r.request().method() !== "GET");
  await locator.click();
  const response = await responsePromise;
  assert.equal(response.status(), status, `${suffix}: HTTP ${response.status()}`);
  return status === 204 ? null : response.json();
}
async function login(page, username) {
  await page.getByRole("heading", { name: "Đăng nhập quản trị" }).waitFor();
  await page.getByLabel(/Tên đăng nhập/).fill(username);
  await page.getByLabel(/Mật khẩu/).fill("admin-e2e-password");
  await clickResponse(page, page.getByRole("button", { name: "Đăng nhập", exact: true }), "/auth/login", 200);
  await page.getByRole("heading", { name: "Đặt lịch ngừng hoạt động" }).waitFor();
  await page.getByRole("combobox").locator("option").nth(1).waitFor({ state: "attached" });
}
async function action(page, card, button, confirm, path, status = 200) {
  await card.getByRole("button", { name: button, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel(/Lý do/).fill("Kiểm tra tổng hợp P03 qua backend thật");
  const body = await clickResponse(page, dialog.getByRole("button", { name: confirm, exact: true }), path, status);
  if (status === 200) await dialog.waitFor({ state: "hidden" });
  return body;
}

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(base);
    await login(page, "chain.p03");
    // Minimum default comes from the app in Vietnam calendar time.
    await page.getByRole("combobox").selectOption(`STORE:${storeB}`);
    await page.getByLabel(/^Lý do/).fill("Lịch tương lai tổng hợp P03");
    const created = await clickResponse(page, page.getByRole("button", { name: "Tạo lịch ngừng hoạt động" }), "/lifecycle/schedules", 201);
    const cardB = page.locator("article").filter({ hasText: "P03-002 · Cửa hàng B mẫu" });
    await cardB.waitFor();
    assert.equal(await cardB.getByRole("button", { name: /Chờ đến/ }).isDisabled(), true);
    await cardB.getByRole("button", { name: "Đổi lịch" }).click();
    let dialog = page.getByRole("dialog");
    const later = new Date(`${created.effectiveDate}T00:00:00Z`);
    later.setUTCDate(later.getUTCDate() + 7);
    const laterIso = later.toISOString().slice(0, 10);
    await dialog.getByLabel(/Ngày hiệu lực mới/).fill(laterIso.split("-").reverse().join("/"));
    await dialog.getByLabel(/Lý do/).fill("Dời kế hoạch thêm bảy ngày");
    const changed = await clickResponse(page, dialog.getByRole("button", { name: "Lưu ngày mới" }), `/schedules/${created.id}`, 200);
    assert.equal(changed.effectiveDate, laterIso);
    await dialog.waitFor({ state: "hidden" });
    await page.reload();
    await cardB.getByText(laterIso.split("-").reverse().join("/"), { exact: true }).waitFor();
    const cancelled = await action(page, cardB, "Hủy lịch", "Xác nhận hủy lịch", `/schedules/${created.id}/cancel`);
    assert.equal(cancelled.status, "CANCELLED");
    await cardB.getByText("Đã hủy", { exact: true }).waitFor();
    console.log("PASS real API: create +30 / reschedule / reload persistence / cancel");

    const regionCard = page.locator("article").filter({ hasText: "P03-A · Vùng A mẫu" });
    const blocked = await action(page, regionCard, "Thực thi", "Ngừng hoạt động ngay", `/schedules/${regionSchedule}/execute`, 409);
    assert.equal(blocked.code, "REGION_HAS_ACTIVE_STORES");
    await page.getByRole("alert").filter({ hasText: "Vùng vẫn còn cửa hàng hoạt động" }).waitFor();
    await page.getByRole("button", { name: "Quay lại" }).click();
    const storeCard = page.locator("article").filter({ hasText: "P03-001 · Cửa hàng A mẫu" });
    const executedStore = await action(page, storeCard, "Thực thi", "Ngừng hoạt động ngay", "/schedules/40000000-0000-4000-8000-000000000001/execute");
    assert.equal(executedStore.status, "EXECUTED");
    assert.equal((await page.request.get(`${base}/api/v1/stores/${storeA}/kph`)).status(), 403);
    const executedRegion = await action(page, regionCard, "Thực thi", "Ngừng hoạt động ngay", `/schedules/${regionSchedule}/execute`);
    assert.equal(executedRegion.status, "EXECUTED");
    await regionCard.getByText("Đã thực thi", { exact: true }).waitFor();
    await page.screenshot({ path: `${output}/chain-desktop.png`, fullPage: true });
    console.log("PASS real API: active-store guard / store then region execute / next-request KPH denial");

    await clickResponse(page, page.getByRole("button", { name: "Đăng xuất" }), "/auth/logout", 204);
    await login(page, "region.p03");
    assert.equal(await page.getByRole("combobox").locator("option").count(), 2);
    await page.getByRole("combobox").locator("option", { hasText: "P03-002" }).waitFor({ state: "attached" });
    await cardB.waitFor();
    assert.equal(await page.locator("article").count(), 1);
    // Uses the real cookie/CSRF session, with a forged cross-region schedule ID.
    const session = await (await page.request.get(`${base}/api/v1/auth/session`)).json();
    const denied = await page.request.post(`${base}/api/v1/admin/lifecycle/schedules/${regionSchedule}/cancel`, {
      headers: { "X-CSRF-TOKEN": session.csrfToken }, data: { reason: "Kiểm tra khác vùng" },
    });
    assert.equal(denied.status(), 403);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${output}/regional-mobile.png`, fullPage: true });
    await page.context().clearCookies();
    await page.getByRole("button", { name: "Tải lại lịch ngừng hoạt động" }).click();
    await page.getByRole("heading", { name: "Đăng nhập quản trị" }).waitFor();
    assert.equal(await page.locator("article").count(), 0);
    assert.deepEqual(pageErrors, []);
    console.log("PASS real API: logout / regional scope / forged ID denied / mobile / expired-session data removed");
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
