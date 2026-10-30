import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function sql(input: string) {
  return execFileSync("docker", ["exec", "-i", "coopfood-kph-be04-postgres", "psql", "-U", "kph_e2e", "-d", "coopfood_kph_e2e", "-v", "ON_ERROR_STOP=1"], { input, stdio: ["pipe", "pipe", "pipe"] });
}
test.skip(process.env.E2E_BE04 !== "true", "Requires isolated BE04 database/backend and Store online build.");
test.beforeEach(() => { sql(readFileSync(fileURLToPath(new URL("../seed/foundation-01.sql", import.meta.url)), "utf8")); });
async function login(page: Page, username: string, password: string, store = "0001") {
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.getByRole("button", { name: new RegExp(`^${store} ·`) }).click();
  await page.getByRole("button", { name: "Tra mã hàng", exact: true }).click();
  await expect(page.getByLabel("Barcode", { exact: true })).toBeVisible();
}
async function search(page: Page, barcode: string) {
  await page.getByLabel("Barcode", { exact: true }).fill(barcode);
  await page.getByRole("button", { name: "Tra cứu", exact: true }).click();
}

test("found/miss/manual, camera fallback, identifiers and store isolation", async ({ page }, info) => {
  await login(page, "manager.e2e", "manager-e2e-password");
  await page.getByRole("button", { name: "Quét barcode" }).click();
  await page.getByRole("button", { name: "Nhập mã thủ công" }).click();
  await search(page, "0890123456789");
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toBeVisible();
  await expect(page.getByText("NCC-E2E-01", { exact: true })).toBeVisible();
  await expect(page.getByText("0890123456789", { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("lookup-found.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await search(page, "0000000000000");
  await expect(page.getByText("Không tìm thấy barcode 0000000000000.", { exact: true })).toBeVisible();
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Nhập tay", exact: true }).click();
  await expect(page.getByText("Trạng thái tra cứu: NOT_FOUND · Barcode: 0000000000000")).toBeVisible();
  await expect(page.getByLabel("Tên sản phẩm", { exact: true })).toHaveValue("");
  await page.getByLabel("Tên sản phẩm", { exact: true }).fill("Hàng nhập tay tổng hợp");
  await expect.poll(async () => page.getByLabel("Tên sản phẩm", { exact: true }).evaluate(control => {
    const toolbar = document.querySelector(".store-mobile-toolbar")?.getBoundingClientRect();
    return !toolbar?.height || control.getBoundingClientRect().bottom <= toolbar.top - 12;
  })).toBe(true);
  await page.screenshot({ path: info.outputPath("lookup-manual.png"), fullPage: true });
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Đổi cửa hàng", exact: true }).click();
  await page.getByRole("button", { name: /^0002 ·/ }).click();
  await expect(page.getByLabel("Barcode", { exact: true })).toHaveValue("");
  await expect(page.getByText("Thông tin nhập tay", { exact: true })).toHaveCount(0);
});

test("inherited region/chain lookup and next-request revocation", async ({ page }) => {
  await login(page, "region-manager.e2e", "manager-e2e-password");
  await search(page, "0890123456789");
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toBeVisible();
  const crossRegion = await page.request.get("/api/v1/catalog/barcodes/0890123456789?storeId=20000000-0000-4000-8000-000000000003");
  expect(crossRegion.status()).toBe(403);
  sql("UPDATE user_region_assignments SET active=false WHERE user_id='10000000-0000-4000-8000-000000000004';");
  await search(page, "0890123456790");
  await expect(page.getByText("Tài khoản không có quyền tra cứu tại cửa hàng này.", { exact: true })).toBeVisible();
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Nhập tay", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Tài khoản", exact: true }).click();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "chain-admin.e2e", "admin-e2e-password", "0003");
  await search(page, "0890123456789");
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toBeVisible();
  sql("DELETE FROM user_roles WHERE user_id='10000000-0000-4000-8000-000000000003';");
  await search(page, "0890123456790");
  await expect(page.getByText("Tài khoản không có quyền tra cứu tại cửa hàng này.", { exact: true })).toBeVisible();
});

test("503/offline remain errors; invalid credentials return to login", async ({ page }) => {
  await login(page, "employee.e2e", "employee-e2e-password");
  sql("UPDATE catalog_versions SET is_current=false;");
  await search(page, "0890123456789");
  await expect(page.getByText("Danh mục sản phẩm chưa sẵn sàng. Vui lòng thử lại sau.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nhập tay", exact: true })).toHaveCount(0);
  sql("UPDATE catalog_versions SET is_current=true WHERE id='30000000-0000-4000-8000-000000000002';");
  await page.getByRole("button", { name: "Thử tra cứu lại", exact: true }).click();
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toBeVisible();
  await page.context().setOffline(true);
  await search(page, "0890123456790");
  await expect(page.getByText("Không thể tra cứu lúc này. Kiểm tra kết nối rồi thử lại.", { exact: true })).toBeVisible();
  await expect(page.getByText("SKU-E2E-0001", { exact: true })).toHaveCount(0);
  const refreshed = page.waitForResponse(response => response.url().endsWith("/api/v1/me/store-access") && response.status() === 200);
  await page.context().setOffline(false);
  await refreshed;
  await expect(page.getByLabel("Barcode", { exact: true })).toBeVisible();
  sql("UPDATE app_users SET credential_version=credential_version+1 WHERE username='employee.e2e';");
  await search(page, "0890123456789");
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
});
