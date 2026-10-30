import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Only this dedicated disposable DB is allowed; never use an operational URL.
function sql(input: string) {
  return execFileSync("docker", ["exec", "-i", "coopfood-kph-be03-postgres", "psql", "-U", "kph_e2e", "-d", "coopfood_kph_e2e", "-v", "ON_ERROR_STOP=1"], { input, stdio: ["pipe", "pipe", "pipe"] });
}
test.skip(process.env.E2E_BE03 !== "true", "Requires the isolated BE03 PostgreSQL fixture and online Store build.");
test.beforeEach(() => { sql(readFileSync(fileURLToPath(new URL("../seed/foundation-01.sql", import.meta.url)), "utf8")); });
async function login(page: import("@playwright/test").Page, username: string, password: string) {
  await page.goto("/"); await page.getByLabel("Tên đăng nhập", { exact: true }).fill(username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(password); await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Chọn cửa hàng" })).toBeVisible();
}
async function account(page: import("@playwright/test").Page) { await page.getByRole("button", { name: "Tài khoản", exact: true }).click(); }

test("employee: real login, CSRF logout, revoke and session invalidation", async ({ page }, info) => {
  await login(page, "employee.e2e", "employee-e2e-password");
  await expect(page.getByRole("button", { name: /0002 ·/ })).toHaveCount(0);
  await page.getByRole("button", { name: /0001 ·/ }).click();
  await expect(page.getByRole("button", { name: "KPH", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Duyệt phiếu", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("employee.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  sql("UPDATE store_memberships SET active=false WHERE user_id='10000000-0000-4000-8000-000000000002';");
  await page.evaluate(() => { location.hash = "kph"; });
  await expect(page.getByText("Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.")).toBeVisible();
  sql("UPDATE app_users SET credential_version=credential_version+1 WHERE username='employee.e2e';");
  await page.getByRole("button", { name: "Tải lại quyền cửa hàng" }).click();
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
  await login(page, "manager.e2e", "manager-e2e-password");
  const logout = page.waitForRequest(r => r.url().endsWith("/api/v1/auth/logout"));
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  expect((await logout).headers()["x-csrf-token"]).toBeTruthy();
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
});

test("region/chain discovery, explicit store switch and no mock fallback", async ({ page }, info) => {
  await login(page, "region-manager.e2e", "manager-e2e-password");
  await expect(page.getByRole("button", { name: /000[12] ·/ })).toHaveCount(2);
  await expect(page.getByRole("button", { name: /0003 ·/ })).toHaveCount(0);
  await page.getByRole("button", { name: /0001 ·/ }).click();
  await expect(page.getByRole("button", { name: "KPH", exact: true })).toBeVisible();
  await account(page); await page.getByRole("button", { name: "Đổi cửa hàng" }).click();
  await page.getByRole("button", { name: /0002 ·/ }).click();
  await expect(page.locator(".store-header-store")).toHaveText("Store Hai E2E");
  await expect(page.locator(".store-header-store")).not.toHaveText("Nguyễn Kiệm E2E");
  await page.screenshot({ path: info.outputPath("region-store.png"), fullPage: true });
  sql("UPDATE user_region_assignments SET active=false WHERE user_id='10000000-0000-4000-8000-000000000004';");
  await account(page); await page.getByRole("button", { name: "Đổi cửa hàng" }).click();
  await expect(page.getByText("Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.")).toBeVisible();
  await page.getByRole("button", { name: "Đăng xuất", exact: true }).click();
  await login(page, "chain-admin.e2e", "admin-e2e-password");
  await expect(page.getByRole("button", { name: /000[123] ·/ })).toHaveCount(3);
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "Tải lại quyền cửa hàng" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("button", { name: /000[123] ·/ })).toHaveCount(0);
  await page.context().setOffline(false);
  await expect(page.getByRole("heading", { name: "Chọn cửa hàng" })).toBeVisible();
  await expect(page.getByText("Vào bản dùng thử")).toHaveCount(0);
});

test("password change invalidates session and requires new credentials", async ({ page }) => {
  await login(page, "employee.e2e", "employee-e2e-password");
  await page.getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await page.getByLabel("Mật khẩu hiện tại", { exact: true }).fill("employee-e2e-password");
  await page.getByLabel("Mật khẩu mới", { exact: true }).fill("new-local-e2e-password-2026");
  await page.getByLabel("Nhập lại mật khẩu mới", { exact: true }).fill("new-local-e2e-password-2026");
  await page.getByRole("dialog").getByRole("button", { name: "Đổi mật khẩu", exact: true }).click();
  await expect(page.getByLabel("Tên đăng nhập", { exact: true })).toBeVisible();
  await login(page, "employee.e2e", "new-local-e2e-password-2026");
});
