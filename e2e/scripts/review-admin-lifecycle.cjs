// Visual/interaction review with synthetic contract fixtures; backend behavior
// is verified separately by LifecycleHttpIntegrationTest.
const { chromium } = require("playwright");
const { readFileSync, mkdirSync } = require("node:fs");
const assert = require("node:assert/strict");

const output = ".local/verification/p03-admin-lifecycle";
const scenarios = [
  ["login-mobile", 375, 812, false],
  ["desktop", 1440, 1000, true],
  ["tablet", 768, 1024, true],
  ["mobile", 390, 844, true],
  ["landscape", 667, 375, true],
];

(async () => {
  mkdirSync(output, { recursive: true });
  const session = JSON.parse(readFileSync("contracts/fixtures/api/session.json"));
  session.user.globalRoles = ["CHAIN_ADMIN"];
  const targets = JSON.parse(readFileSync("contracts/fixtures/api/lifecycle-targets.json"));
  const scheduleFixture = JSON.parse(readFileSync("contracts/fixtures/api/lifecycle-schedules.json"));
  const browser = await chromium.launch();
  try {
    for (const [name, width, height, signedIn] of scenarios) {
      let schedules = structuredClone(scheduleFixture);
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: "reduce" });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.route("**/api/**", async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        if (!path.startsWith("/api/")) return route.continue();
        if (path.endsWith("/auth/session")) {
          return route.fulfill({ status: signedIn ? 200 : 401, json: signedIn ? session : { status: 401, code: "AUTHENTICATION_REQUIRED", detail: "Phiên đã hết hạn." } });
        }
        if (path.endsWith("/auth/login")) return route.fulfill({ json: session });
        if (path.endsWith("/lifecycle/targets")) return route.fulfill({ json: targets });
        if (path.endsWith("/lifecycle/schedules") && request.method() === "GET") return route.fulfill({ json: schedules });
        if (path.endsWith("/lifecycle/schedules") && request.method() === "POST") return route.fulfill({ status: 201, json: schedules[0] });
        if (path.endsWith("/cancel")) {
          schedules = [{ ...schedules[0], status: "CANCELLED" }];
          return route.fulfill({ json: schedules[0] });
        }
        return route.fulfill({ json: schedules[0] });
      });
      await page.goto(process.env.ADMIN_UI_REVIEW_URL || "http://127.0.0.1:4174");
      await page.waitForTimeout(500);
      if (await page.getByRole("heading", { level: 1 }).count() === 0) {
        throw new Error(`${name}: no h1 rendered; body=${await page.locator("body").innerText()}; errors=${errors.join(" | ")}`);
      }
      await page.getByRole("heading", { level: 1 }).waitFor();
      assert.equal(await page.getByRole("main").count(), 1);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: page overflow`);
      if (!signedIn) {
        await page.keyboard.press("Tab");
        assert.equal(await page.getByRole("textbox", { name: /Tên đăng nhập/ }).evaluate((element) => element === document.activeElement), true);
      } else {
        await page.getByText("CF-0012 · Nguyễn Kiệm", { exact: true }).waitFor();
        const undersized = await page.locator("button, input, select, textarea").evaluateAll((elements) => elements
          .filter((element) => {
            const rect = element.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && rect.height < 44;
          }).map((element) => `${element.tagName}:${element.textContent || element.getAttribute("aria-label")}:${element.getBoundingClientRect().height}`));
        assert.deepEqual(undersized, [], `${name}: controls below 44px`);
        if (name === "desktop") {
          await page.getByRole("combobox", { name: /Vùng hoặc cửa hàng/ }).selectOption(`STORE:${targets[1].id}`);
          await page.getByRole("textbox", { name: /^Lý do/ }).fill("Kiểm tra lịch tổng hợp");
          await page.getByRole("button", { name: "Tạo lịch ngừng hoạt động" }).click();
          await page.getByText(/Đã đặt lịch ngừng hoạt động CF-0012/).waitFor();
          await page.getByRole("button", { name: "Hủy lịch" }).click();
          const dialog = page.getByRole("dialog");
          await dialog.getByRole("textbox", { name: /Lý do/ }).fill("Thay đổi kế hoạch");
          await dialog.getByRole("button", { name: "Xác nhận hủy lịch" }).click();
          await page.getByText("Đã hủy lịch CF-0012.").waitFor();
        }
      }
      await page.screenshot({ path: `${output}/${name}.png`, fullPage: true });
      const unexpectedErrors = signedIn ? errors : errors.filter((message) => !message.includes("401 (Unauthorized)"));
      assert.deepEqual(unexpectedErrors, [], `${name}: browser errors`);
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
