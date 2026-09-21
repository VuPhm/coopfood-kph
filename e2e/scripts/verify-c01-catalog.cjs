// Destructive only to the synthetic database created by start-c01-acceptance.sh.
// Run on a fresh preview. No network mocks or direct database changes during this flow.
const { chromium } = require("playwright");
const { mkdirSync } = require("node:fs");
const assert = require("node:assert/strict");

const base = "http://127.0.0.1:4174";
const output = ".local/verification/c01-real-backend";
const validCsv = "contracts/fixtures/catalog/valid-identifiers.csv";
const conflictCsv = "contracts/fixtures/catalog/conflicting-barcode.csv";
const storeId = "31000000-0000-4000-8000-000000000001";

async function login(page, username) {
  await page.getByRole("heading", { name: "Đăng nhập quản trị" }).waitFor();
  await page.getByLabel(/Tên đăng nhập/).fill(username);
  await page.getByLabel(/Mật khẩu/).fill("admin-e2e-password");
  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/auth/login"));
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  const response = await responsePromise;
  assert.equal(response.status(), 200);
}

async function upload(page, fixture, expectedStatus) {
  await page.getByLabel("File UTF-8 CSV").setInputFiles(fixture);
  const responsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/catalog/imports") && response.request().method() === "POST");
  await page.getByRole("button", { name: "Tải lên và kiểm tra" }).click();
  const response = await responsePromise;
  assert.equal(response.status(), expectedStatus);
  return response.json();
}

(async () => {
  mkdirSync(output, { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(base);
    await login(page, "catalog.c01");
    await page.getByRole("heading", { name: "Kiểm tra catalog CSV" }).waitFor();

    const valid = await upload(page, validCsv, 201);
    assert.equal(valid.replayed, false);
    assert.equal(valid.batch.status, "VALIDATED");
    assert.equal(valid.batch.rowCount, 3);
    await page.getByText("Đã kiểm tra 3 dòng, không có lỗi.").waitFor();
    await page.getByText("000123456789012", { exact: true }).waitFor();
    console.log("PASS real API: UTF-8 multipart / identifiers preserved / validated detail");

    const replay = await upload(page, validCsv, 200);
    assert.equal(replay.replayed, true);
    assert.equal(replay.batch.id, valid.batch.id);
    await page.getByText(/File này đã được kiểm tra trước đó/).waitFor();
    console.log("PASS real API: exact checksum replay returns immutable batch");

    const rejected = await upload(page, conflictCsv, 201);
    assert.equal(rejected.batch.status, "REJECTED");
    assert.equal(rejected.batch.errorRowCount, 2);
    await page.getByText("Đã kiểm tra 2 dòng, có 2 dòng lỗi.").waitFor();
    await page.getByText("UPC bị lặp trong cùng file.").first().waitFor();
    await page.screenshot({ path: `${output}/catalog-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: `${output}/catalog-mobile.png`, fullPage: true });
    assert.deepEqual(pageErrors, []);
    console.log("PASS real API: duplicate barcode rejected / row messages / responsive UI");

    const store = await browser.newContext();
    const loginResponse = await store.request.post(`${base}/api/v1/auth/login`, {
      data: { username: "employee.c01", password: "admin-e2e-password" },
    });
    assert.equal(loginResponse.status(), 200);
    const lookup = await store.request.get(`${base}/api/v1/catalog/barcodes/0890123456789?storeId=${storeId}`);
    assert.equal(lookup.status(), 503);
    assert.equal((await lookup.json()).code, "CATALOG_UNAVAILABLE");
    await store.close();
    console.log("PASS real API: validated staging remains unavailable to store lookup");
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
