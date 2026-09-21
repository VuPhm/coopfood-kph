// Visual/interaction review with synthetic contract fixtures. Backend behavior
// remains independently covered by CatalogImportHttpIntegrationTest.
const { chromium } = require("playwright");
const { readFileSync, mkdirSync } = require("node:fs");
const assert = require("node:assert/strict");

const output = ".local/verification/c01-admin-catalog";
const scenarios = [
  ["desktop", 1440, 1000, false],
  ["tablet", 768, 1024, false],
  ["mobile", 375, 812, false],
  ["mobile-large-text", 375, 812, true],
  ["landscape", 667, 375, false],
];

(async () => {
  mkdirSync(output, { recursive: true });
  const session = JSON.parse(readFileSync("contracts/fixtures/api/session.json"));
  session.user.globalRoles = ["CATALOG_ADMIN"];
  const imports = JSON.parse(readFileSync("contracts/fixtures/api/catalog-imports.json"));
  const detail = JSON.parse(readFileSync("contracts/fixtures/api/catalog-import-detail.json"));
  const upload = JSON.parse(readFileSync("contracts/fixtures/api/catalog-import-upload.json"));
  const validCsv = "contracts/fixtures/catalog/valid-identifiers.csv";
  const browser = await chromium.launch();
  try {
    for (const [name, width, height, largeText] of scenarios) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
      const errors = [];
      let uploaded = false;
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
      await page.route("**/api/**", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const path = url.pathname;
        if (path.endsWith("/auth/session")) return route.fulfill({ json: session });
        if (path.endsWith("/catalog/imports") && request.method() === "GET") return route.fulfill({ json: imports });
        if (path.endsWith("/catalog/imports") && request.method() === "POST") {
          const contentType = request.headers()["content-type"] || "";
          assert.match(contentType, /^multipart\/form-data; boundary=/, "upload must remain multipart");
          assert.ok(request.postDataBuffer()?.includes(Buffer.from("valid-identifiers.csv")), "upload filename missing");
          uploaded = true;
          return route.fulfill({ status: 201, json: upload });
        }
        if (/\/catalog\/imports\/[^/]+$/.test(path)) return route.fulfill({ json: detail });
        if (path.endsWith("/auth/logout")) return route.fulfill({ status: 204, body: "" });
        return route.fulfill({ status: 404, json: { status: 404, code: "NOT_FOUND" } });
      });
      await page.goto(process.env.ADMIN_UI_REVIEW_URL || "http://127.0.0.1:4174");
      if (largeText) await page.addStyleTag({ content: "html { font-size: 20px !important; }" });
      await page.getByRole("heading", { name: "Kiểm tra catalog CSV" }).waitFor();
      await page.waitForFunction(() => [...document.querySelectorAll("li")].some((element) =>
        element.textContent?.includes("UPC bị lặp trong cùng file.")
          && element.getBoundingClientRect().height > 0));
      assert.equal(await page.getByRole("main").count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: page overflow`);
      const undersized = await page.locator("button, input, select, textarea").evaluateAll((elements) => elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && rect.height < 44;
        }).map((element) => `${element.tagName}:${element.textContent || element.getAttribute("aria-label")}:${element.getBoundingClientRect().height}`));
      assert.deepEqual(undersized, [], `${name}: controls below 44px`);
      if (name === "desktop") {
        await page.getByLabel("File UTF-8 CSV").setInputFiles(validCsv);
        await page.getByRole("button", { name: "Tải lên và kiểm tra" }).click();
        await page.getByText(/Đã kiểm tra 2 dòng, không có lỗi/).waitFor();
        assert.equal(uploaded, true);
      }
      await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
      assert.deepEqual(errors, [], `${name}: browser errors`);
      console.log(`PASS ${name} ${width}×${height}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
