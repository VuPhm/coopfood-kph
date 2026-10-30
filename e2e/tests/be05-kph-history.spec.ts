import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function sql(input: string) {
  return execFileSync("docker", ["exec", "-i", "coopfood-kph-be05-postgres", "psql", "-U", "kph_e2e", "-d", "coopfood_kph_e2e", "-v", "ON_ERROR_STOP=1"], { input, stdio: ["pipe", "pipe", "pipe"] });
}
test.skip(process.env.E2E_BE05 !== "true", "Requires dedicated BE05 fixture/backend and online build.");
test.beforeEach(() => {
  sql(readFileSync(fileURLToPath(new URL("../seed/foundation-01.sql", import.meta.url)), "utf8"));
  execFileSync("node", [fileURLToPath(new URL("../scripts/seed-foundation-paging-media.mjs", import.meta.url)), "/tmp/coopfood-kph-be05-media"]);
});
async function login(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading")).toHaveCount(1);
  await expect(page.getByText(/CO.OP FOOD STORE APP|hiệu quả mỗi ngày|An toàn ·/)).toHaveCount(0);
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill("manager.e2e");
  await page.getByLabel("Mật khẩu", { exact: true }).fill("manager-e2e-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: /^0001 ·/ }).click();
  await expect(page.getByRole("button", { name: "KPH", exact: true })).toBeVisible();
}
const rows = (page: Page) => page.locator("[data-record-id]");
async function ids(page: Page) { return rows(page).evaluateAll(elements => elements.map(element => element.getAttribute("data-record-id"))); }

test("scope refresh preserves DOM/input without document reload; revoke still removes scope", async ({ page }, info) => {
  let documents = 0; page.on("request", request => { if (request.resourceType() === "document") documents++; });
  await login(page); await page.getByRole("button", { name: "Tra mã hàng", exact: true }).click();
  await page.getByLabel("Barcode", { exact: true }).fill("0000000000000");
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
  await page.getByRole("button", { name: "Nhập tay", exact: true }).click();
  await page.getByLabel("Tên sản phẩm", { exact: true }).fill("Đang nhập");
  await expect(page.locator(".store-app")).not.toHaveAttribute("aria-busy", "true");
  const input = await page.getByLabel("Tên sản phẩm", { exact: true }).elementHandle();
  let refreshes = 0;
  await page.route("**/api/v1/auth/session", async route => {
    refreshes++; await new Promise(resolve => setTimeout(resolve, 700)); await route.continue();
  });
  const completed = page.waitForResponse(response => response.url().endsWith("/api/v1/me/store-access"));
  await page.evaluate(() => { window.dispatchEvent(new Event("focus")); document.dispatchEvent(new Event("visibilitychange")); });
  await expect(page.locator(".store-app")).toHaveAttribute("aria-busy", "true");
  expect(await input!.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.getByLabel("Tên sản phẩm", { exact: true })).toHaveValue("Đang nhập");
  await completed; await expect(page.locator(".store-app")).not.toHaveAttribute("aria-busy", "true");
  expect(refreshes).toBe(1); expect(documents).toBe(1);
  expect(await input!.evaluate(element => element.isConnected)).toBe(true);
  await expect(page.getByLabel("Tên sản phẩm", { exact: true })).toHaveValue("Đang nhập");
  await page.screenshot({ path: info.outputPath("scope-stable.png"), fullPage: true });
  sql("UPDATE store_memberships SET active=false WHERE user_id='10000000-0000-4000-8000-000000000001';");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByRole("heading", { name: "Chọn cửa hàng" })).toBeVisible();
  await expect(page.locator(".store-app")).toHaveCount(0);
  await expect(page.getByLabel("Tên sản phẩm", { exact: true })).toHaveCount(0);
});

test("live KPH pages, server filters/sort, detail and private evidence", async ({ page }, info) => {
  await login(page); await page.getByRole("button", { name: "KPH", exact: true }).click();
  await expect(rows(page)).toHaveCount(25); await expect(page.getByText("30 phiếu", { exact: true })).toBeVisible();
  const first = await ids(page);
  await page.getByRole("button", { name: /^Mở phiếu/ }).first().click();
  const detail = page.getByRole("dialog", { name: "Phiếu KPH", exact: true });
  await expect(detail).toContainText("Quản lý E2E"); await expect(detail).toContainText("9900000");
  const image = detail.locator("img").first();
  await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(await image.getAttribute("src")).toMatch(/^\/api\/v1\/stores\/20000000-0000-4000-8000-000000000001\/kph\/.+\/photos\/1$/);
  await page.screenshot({ path: info.outputPath("kph-detail.png"), fullPage: true });
  await page.keyboard.press("Escape"); await expect(detail).toBeHidden();
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(rows(page)).toHaveCount(5); await expect(page.getByText("Trang 2/2")).toBeVisible();
  expect((await ids(page)).some(id => first.includes(id))).toBe(false);
  await page.getByRole("button", { name: "Trang trước", exact: true }).click();
  await expect(rows(page)).toHaveCount(25); expect(await ids(page)).toEqual(first);
  const sorted = page.waitForRequest(request => request.url().includes("/kph?") && new URL(request.url()).searchParams.get("sort") === "product");
  await page.getByRole("combobox", { name: "Sắp xếp", exact: true }).selectOption("product");
  expect(new URL((await sorted).url()).searchParams.get("page")).toBe("1");
  await page.getByRole("combobox", { name: "Thứ tự", exact: true }).selectOption("ascending");
  await page.getByLabel("Từ ngày", { exact: true }).fill("02/09/2026");
  await page.getByLabel("Đến ngày", { exact: true }).fill("03/09/2026");
  await expect(page.getByText("12 phiếu", { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(12);
  await page.getByRole("combobox", { name: "Trạng thái", exact: true }).selectOption("APPROVED");
  await expect(page.getByText("Không có phiếu", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Đặt lại", exact: true }).click();
  await expect(rows(page)).toHaveCount(25);
  await page.screenshot({ path: info.outputPath("kph-page.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: /Duyệt phiếu|Xóa phiếu|Xuất Excel/ })).toHaveCount(0);
});

test("store switch resets history; revoked page request cannot keep old records", async ({ page }) => {
  await login(page); await page.getByRole("button", { name: "KPH", exact: true }).click();
  await expect(rows(page)).toHaveCount(25);
  const cross = await page.request.get("/api/v1/stores/20000000-0000-4000-8000-000000000003/kph?page=1&pageSize=25");
  expect(cross.status()).toBe(403);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Đổi cửa hàng", exact: true }).click();
  await page.getByRole("button", { name: /^0002 ·/ }).click();
  await expect(page.getByText("Không có phiếu", { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Đổi cửa hàng", exact: true }).click();
  await page.getByRole("button", { name: /^0001 ·/ }).click();
  await expect(rows(page)).toHaveCount(25);
  sql("UPDATE store_memberships SET active=false WHERE user_id='10000000-0000-4000-8000-000000000001' AND store_id='20000000-0000-4000-8000-000000000001';");
  await page.getByRole("button", { name: "Trang sau", exact: true }).click();
  await expect(page.getByText("Không có quyền xem phiếu tại cửa hàng này.", { exact: true })).toBeVisible();
  await expect(rows(page)).toHaveCount(0);
  sql("UPDATE app_users SET credential_version=credential_version+1 WHERE username='manager.e2e';");
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
});
