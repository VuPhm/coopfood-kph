import { test as base, expect, request as playwrightRequest, type APIRequestContext, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";

const test = base;

const BACKEND_URL = process.env.E2E_BACKEND_URL ?? "http://127.0.0.1:8080";

const USERS = {
  manager: {
    username: process.env.E2E_MANAGER_USERNAME ?? "manager.e2e",
    password: process.env.E2E_MANAGER_PASSWORD ?? "manager-e2e-password",
  },
  employee: {
    username: process.env.E2E_EMPLOYEE_USERNAME ?? "employee.e2e",
    password: process.env.E2E_EMPLOYEE_PASSWORD ?? "employee-e2e-password",
  },
  chainAdmin: {
    username: process.env.E2E_CHAIN_ADMIN_USERNAME ?? "chain-admin.e2e",
    password: process.env.E2E_CHAIN_ADMIN_PASSWORD ?? "admin-e2e-password",
  },
} as const;

const STORES = {
  primary: {
    id: "20000000-0000-4000-8000-000000000001",
    code: "0001",
    name: "Nguyễn Kiệm E2E",
  },
  secondary: {
    id: "20000000-0000-4000-8000-000000000002",
    code: "0002",
    name: "Store Hai E2E",
  },
  outsideMembership: {
    id: "20000000-0000-4000-8000-000000000003",
    code: "0003",
    name: "Store Ngoài Scope E2E",
  },
} as const;

const FOUND_BARCODE = "0890123456789";
const NOT_FOUND_BARCODE = "0000000000000";
const FOUND_PRODUCT = "Sản phẩm E2E FOUND";

type Credentials = { username: string; password: string };
type Store = (typeof STORES)[keyof typeof STORES];
type KphRecord = {
  id: string;
  type: "TPCN" | "TPTS";
  barcode: string | null;
  lookupStatus: "FOUND" | "NOT_FOUND" | "MANUAL";
  catalogSnapshot: {
    skuCode: string | null;
    productName: string | null;
    supplierCode: string | null;
    supplierName: string | null;
  };
  photos: Array<{ ordinal: number; stampedContentPath: string; capturedAt: string }>;
  store: { id: string; code: string; name: string };
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  reviewedBy: { id: string; displayName: string } | null;
};

function apiUrl(path: string) {
  return new URL(path, BACKEND_URL).toString();
}

function businessDateDisplay(dayOffset = 0) {
  const value = new Date(Date.now() + dayOffset * 24 * 60 * 60 * 1_000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  return `${part("day")}/${part("month")}/${part("year")}`;
}

function syntheticPng(name: string, lastModified: number) {
  // A deterministic 1×1 PNG keeps the browser fixture synthetic and small.
  const buffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  return { name, mimeType: "image/png", buffer, lastModified };
}

function syntheticJpeg(name: string, lastModified: number) {
  // A deterministic tiny JPEG exercises the other online-upload MIME path.
  const buffer = Buffer.from(
    "/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYyLjI4LjEwMgD/2wBDAAgEBAQEBAUFBQUFBQYGBgYGBgYGBgYGBgYHBwcICAgHBwcGBgcHCAgICAkJCQgICAgJCQoKCgwMCwsODg4RERT/xABLAAEBAAAAAAAAAAAAAAAAAAAABwEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAgACAMBIgACEQADEQD/2gAMAwEAAhEDEQA/AL+AD//Z",
    "base64",
  );
  return { name, mimeType: "image/jpeg", buffer, lastModified };
}

async function firstVisible(...locators: Locator[]) {
  let visibleLocator: Locator | undefined;
  await expect.poll(async () => {
    for (const locator of locators) {
      if (await locator.count() && await locator.first().isVisible()) {
        visibleLocator = locator.first();
        return true;
      }
    }
    return false;
  }, { message: "Could not find a visible locator for the requested control." }).toBe(true);
  return visibleLocator!;
}

async function expectVisible(locator: Locator) {
  await expect.poll(async () => {
    for (let index = 0; index < await locator.count(); index += 1) {
      if (await locator.nth(index).isVisible()) return true;
    }
    return false;
  }).toBe(true);
}

async function expectNoVisible(locator: Locator) {
  await expect.poll(async () => {
    for (let index = 0; index < await locator.count(); index += 1) {
      if (await locator.nth(index).isVisible()) return false;
    }
    return true;
  }).toBe(true);
}

async function waitForWorkspace(page: Page) {
  await expect(page.locator("#workspace-title").or(page.getByText(/phiếu theo dõi hàng không phù hợp/i)).first()).toBeVisible();
}

async function loginViaUi(page: Page, credentials: Credentials, store: Store = STORES.primary) {
  await page.goto("/");
  const username = await firstVisible(
    page.getByLabel(/tên đăng nhập|tài khoản|username/i),
    page.locator('input[name="username"]'),
    page.locator('input[autocomplete="username"]'),
  );
  const password = await firstVisible(
    page.getByLabel(/mật khẩu|password/i),
    page.locator('input[name="password"]'),
    page.locator('input[autocomplete="current-password"]'),
  );
  await username.fill(credentials.username);
  await password.fill(credentials.password);
  await page.getByRole("button", { name: /đăng nhập|log in|login/i }).first().click();
  await selectStore(page, store);
  await waitForWorkspace(page);
  await expectStoreScope(page, store);
}

async function expectStoreScope(page: Page, store: Store) {
  await expectVisible(page.getByText(store.code, { exact: false }));
}

async function selectStore(page: Page, store: Store) {
  const selects = page.locator("select");
  for (let index = 0; index < await selects.count(); index += 1) {
    const candidate = selects.nth(index);
    const descriptor = [
      await candidate.getAttribute("aria-label"),
      await candidate.getAttribute("name"),
      await candidate.getAttribute("id"),
    ].filter(Boolean).join(" ");
    if (!/cửa hàng|store/i.test(descriptor)) continue;
    const option = candidate.locator("option").filter({ hasText: store.code }).first();
    if (!await option.count()) continue;
    const value = await option.getAttribute("value");
    if (value) await candidate.selectOption(value);
    else await candidate.selectOption({ label: store.code });
    await expectStoreScope(page, store);
    return;
  }

  const currentStore = page.getByRole("button", { name: /cửa hàng hiện tại|chọn cửa hàng|đổi cửa hàng|store/i }).first();
  if (await currentStore.count() && await currentStore.isVisible()) {
    const currentLabel = await currentStore.getAttribute("aria-label");
    if (!currentLabel?.includes(store.code)) await currentStore.click();
  }

  const storeOption = await firstVisible(
    page.getByRole("option", { name: new RegExp(store.code) }),
    page.getByRole("button", { name: new RegExp(`${store.code}.*${store.name}|${store.name}.*${store.code}`, "i") }),
    page.getByLabel(new RegExp(`${store.code}.*${store.name}|${store.name}.*${store.code}`, "i")),
    page.getByRole("button", { name: new RegExp(`^${store.code}$`) }),
    page.getByLabel(new RegExp(`^${store.code}$`)),
  ).catch(() => null);
  if (storeOption) {
    await storeOption.click();
    await expectStoreScope(page, store);
    return;
  }

  // A single-membership session may already be scoped to the requested store.
  if (store === STORES.primary) {
    await expectStoreScope(page, store);
    return;
  }
  throw new Error(`Could not select store ${store.code}; the integrated UI must expose the membership picker.`);
}

async function openCreateDialog(page: Page, kind: "TPCN" | "TPTS") {
  const button = await firstVisible(
    kind === "TPCN"
      ? page.getByRole("button", { name: /tạo phiếu.*(khô|khác|tpcn)|tpcn/i })
      : page.getByRole("button", { name: /tạo phiếu.*(tươi|tpts)|tpts/i }),
  );
  await button.click();
  const dialog = page.getByRole("dialog").filter({ hasText: /tạo phiếu kph/i }).last();
  await expect(dialog).toBeVisible();
  return dialog;
}

async function lookupBarcode(dialog: Locator, barcode: string, expected: "FOUND" | "NOT_FOUND") {
  const field = await firstVisible(
    dialog.getByLabel(/mã sku.*upc|barcode/i),
    dialog.locator('input[name="barcode"]'),
  );
  await field.fill(barcode);
  await field.press("Tab");
  if (expected === "FOUND") {
    await expect(dialog).toContainText(/đã tìm thấy|found/i);
    await expect(await firstVisible(dialog.getByLabel(/tên hàng hóa|product name/i))).toHaveValue(FOUND_PRODUCT);
  } else {
    await expect(dialog).toContainText(/không tìm thấy barcode|not found/i);
  }
}

async function addPhotos(dialog: Locator, count: number, prefix: string) {
  const fileInput = dialog.locator('input[type="file"]').last();
  await expect(fileInput).toHaveCount(1);
  const files = Array.from({ length: count }, (_, index) => {
    const lastModified = 1_757_000_000_000 + index * 1_000;
    return index === 0
      ? syntheticJpeg(`${prefix}-${index + 1}.jpg`, lastModified)
      : syntheticPng(`${prefix}-${index + 1}.png`, lastModified);
  });
  await fileInput.setInputFiles(files);
  await expect(dialog).toContainText(new RegExp(`đã xử lý ${count}/3 ảnh`, "i"));
}

async function saveDialog(dialog: Locator) {
  await dialog.getByRole("button", { name: /lưu phiếu|save/i }).click();
  await expect(dialog).toBeHidden();
}

async function listRecords(context: BrowserContext, storeId: string): Promise<KphRecord[]> {
  const response = await context.request.get(apiUrl(`/api/v1/stores/${storeId}/kph`));
  expect(response.status()).toBe(200);
  return await response.json() as KphRecord[];
}

async function loginViaApi(api: APIRequestContext, credentials: Credentials) {
  const response = await api.post("/api/v1/auth/login", { data: credentials });
  expect(response.status()).toBe(200);
  return await response.json() as {
    user: { stores: Array<{ id: string; code: string; role: string }> };
    csrfToken: string;
  };
}

async function directApiContext() {
  return await playwrightRequest.newContext({ baseURL: BACKEND_URL });
}

test.describe("Store PWA browser acceptance", () => {
  test("STORE_MANAGER creates FOUND TPCN with one photo, reloads it, and cannot see it in another store", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "Desktop test covers table layout and store switch.");
    await loginViaUi(page, USERS.manager);
    const dialog = await openCreateDialog(page, "TPCN");
    await lookupBarcode(dialog, FOUND_BARCODE, "FOUND");
    await addPhotos(dialog, 1, `foundation-found-${testInfo.workerIndex}`);
    await saveDialog(dialog);

    const records = await listRecords(context, STORES.primary.id);
    const created = records.find((record) => record.type === "TPCN" && record.barcode === FOUND_BARCODE);
    expect(created).toBeDefined();
    expect(created).toMatchObject({
      lookupStatus: "FOUND",
      catalogSnapshot: {
        skuCode: "SKU-E2E-0001",
        productName: FOUND_PRODUCT,
        supplierCode: "NCC-E2E-01",
        supplierName: "NCC E2E chính",
      },
      store: { id: STORES.primary.id, code: STORES.primary.code },
    });
    expect(created?.photos.map(({ ordinal }) => ordinal)).toEqual([1]);

    const photoResponse = await context.request.get(apiUrl(created!.photos[0]!.stampedContentPath));
    expect(photoResponse.status()).toBe(200);
    expect(photoResponse.headers()["content-type"]).toContain("image/jpeg");
    expect(photoResponse.headers()["cache-control"]).toMatch(/private/i);
    expect(photoResponse.headers()["cache-control"]).toMatch(/no-store/i);

    await page.reload();
    await waitForWorkspace(page);
    await expectVisible(page.getByText(FOUND_PRODUCT, { exact: true }));
    await expect(page.locator(".desktop-history")).toBeVisible();
    await expect(page.locator(".desktop-history .record-photo-gallery").first()).toHaveAttribute("aria-label", /1 ảnh minh chứng/);

    await selectStore(page, STORES.secondary);
    await expectNoVisible(page.getByText(FOUND_PRODUCT, { exact: true }));
    await expect(page.locator(".history-total-count").first()).toHaveText("0");
    await selectStore(page, STORES.primary);
    await expectVisible(page.getByText(FOUND_PRODUCT, { exact: true }));
  });

  test("NOT_FOUND TPTS keeps manual values and retries after a response failure without duplicating the record", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "Desktop test covers the controlled retry request.");
    await loginViaUi(page, USERS.manager);
    const dialog = await openCreateDialog(page, "TPTS");
    await lookupBarcode(dialog, NOT_FOUND_BARCODE, "NOT_FOUND");
    const marker = `Sản phẩm E2E NOT_FOUND ${Date.now()}`;
    await (await firstVisible(dialog.getByLabel(/tên hàng hóa|product name/i))).fill(marker);
    await (await firstVisible(dialog.getByLabel(/nhà cung cấp|supplier/i))).fill("NCC nhập tay E2E");
    await addPhotos(dialog, 3, `foundation-not-found-${testInfo.workerIndex}`);

    const endpoint = `**/api/v1/stores/${STORES.primary.id}/kph`;
    const idempotencyKeys: string[] = [];
    let responseConsumedAndAborted = false;
    await page.route(endpoint, async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }
      idempotencyKeys.push(route.request().headers()["idempotency-key"] ?? "");
      if (!responseConsumedAndAborted) {
        responseConsumedAndAborted = true;
        const committedResponse = await route.fetch();
        await committedResponse.body();
        await route.abort("failed");
        return;
      }
      await route.continue();
    });

    await dialog.getByRole("button", { name: /lưu phiếu|save/i }).click();
    await expect(dialog.getByRole("alert")).toContainText(/không thể|lưu phiếu|failed|network/i);
    await dialog.getByRole("button", { name: /lưu phiếu|save/i }).click();
    await expect(dialog).toBeHidden();
    await page.unroute(endpoint);

    expect(idempotencyKeys).toHaveLength(2);
    expect(idempotencyKeys[0]).toBeTruthy();
    expect(idempotencyKeys[0]).toBe(idempotencyKeys[1]);

    const records = await listRecords(context, STORES.primary.id);
    const matching = records.filter((record) => record.catalogSnapshot.productName === marker);
    expect(matching).toHaveLength(1);
    expect(matching[0]).toMatchObject({
      type: "TPTS",
      barcode: NOT_FOUND_BARCODE,
      lookupStatus: "NOT_FOUND",
      catalogSnapshot: {
        skuCode: null,
        productName: marker,
        supplierCode: null,
        supplierName: "NCC nhập tay E2E",
      },
      store: { id: STORES.primary.id },
    });
    expect(matching[0]!.photos.map(({ ordinal }) => ordinal)).toEqual([1, 2, 3]);

    await page.reload();
    await waitForWorkspace(page);
    await page.getByRole("tab", { name: /TP Tươi sống/i }).click();
    await expectVisible(page.getByText(marker, { exact: true }));
    await expect(page.locator(".desktop-history .record-photo-gallery").filter({ has: page.locator("img") }).last()).toHaveAttribute("aria-label", /3 ảnh minh chứng/);
  });

  test("mobile viewport renders the online history as expandable cards with ordered photos", async ({ page }, testInfo) => {
    test.skip(!testInfo.project.name.includes("mobile"), "Mobile project covers card layout.");
    await loginViaUi(page, USERS.manager);
    const dialog = await openCreateDialog(page, "TPCN");
    await lookupBarcode(dialog, NOT_FOUND_BARCODE, "NOT_FOUND");
    const marker = `Sản phẩm E2E MOBILE ${Date.now()}`;
    await (await firstVisible(dialog.getByLabel(/tên hàng hóa|product name/i))).fill(marker);
    await addPhotos(dialog, 1, `foundation-mobile-${testInfo.workerIndex}`);
    await saveDialog(dialog);

    await expect(page.locator(".mobile-history")).toBeVisible();
    await expect(page.locator(".desktop-history")).toBeHidden();
    const card = page.locator(".mobile-history .record-card").filter({ hasText: marker }).first();
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: /mở rộng phiếu/i }).click();
    await expect(card.getByLabel(/1 ảnh minh chứng/)).toBeVisible();
    await page.reload();
    await waitForWorkspace(page);
    await expectVisible(page.locator(".mobile-history .record-card").filter({ hasText: marker }));
  });

  test("STORE_MANAGER filters by detected date, reviews a record and downloads the authorized Excel", async ({ page, context }, testInfo) => {
    test.skip(testInfo.project.name.includes("mobile"), "Desktop project verifies the online review and workbook download flow.");
    await loginViaUi(page, USERS.manager);
    const dialog = await openCreateDialog(page, "TPCN");
    await lookupBarcode(dialog, NOT_FOUND_BARCODE, "NOT_FOUND");
    const marker = `Sản phẩm E2E REVIEW ${Date.now()}`;
    await (await firstVisible(dialog.getByLabel(/tên hàng hóa|product name/i))).fill(marker);
    await addPhotos(dialog, 1, `foundation-review-${testInfo.workerIndex}`);
    await saveDialog(dialog);

    const records = await listRecords(context, STORES.primary.id);
    const created = records.find((record) => record.catalogSnapshot.productName === marker)!;
    expect(created.approvalStatus).toBe("PENDING");
    const row = page.locator(".desktop-history .record-row").filter({ hasText: marker });
    await expect(row).toBeVisible();

    const today = businessDateDisplay();
    await page.locator("#history-date-from").fill(today);
    await page.locator("#history-date-to").fill(today);
    const filteredResponse = page.waitForResponse((response) => response.url().includes("detectedFrom=") && response.url().includes("detectedTo="));
    await page.getByRole("button", { name: "Lọc ngày" }).click();
    expect((await filteredResponse).status()).toBe(200);
    await expect(row).toBeVisible();

    await page.locator("#history-date-from").fill(businessDateDisplay(1));
    await page.locator("#history-date-to").fill("");
    await page.getByRole("button", { name: "Lọc ngày" }).click();
    await expect(row).toBeHidden();
    await page.getByRole("button", { name: "Xóa lọc" }).click();
    await expect(row).toBeVisible();

    const reviewResponse = page.waitForResponse((response) => response.request().method() === "PUT" && response.url().endsWith(`/kph/${created.id}/approval`));
    await row.getByRole("combobox", { name: new RegExp(`Trạng thái duyệt phiếu ${created.id}`) }).selectOption("APPROVED");
    expect((await reviewResponse).status()).toBe(200);
    await row.getByRole("checkbox", { name: `Chọn phiếu ${created.id}` }).check();
    await expect(page.getByRole("button", { name: "Xuất Excel" })).toBeEnabled();
    await page.getByRole("button", { name: "Xuất Excel" }).click();
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Xuất 1 dòng" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^Phieu_Theo_Doi_Hang_KPH_.*\.xlsx$/);
    expect(await download.failure()).toBeNull();
  });

  test("session expiry and EMPLOYEE/STORE_MANAGER membership isolation return contract errors", async ({ page, context }) => {
    await loginViaUi(page, USERS.manager);
    await context.clearCookies({ name: "KPH_SESSION" });
    const expiredSession = await context.request.get(apiUrl("/api/v1/auth/session"));
    expect(expiredSession.status()).toBe(401);
    await page.reload();
    await expectVisible(page.getByLabel(/tên đăng nhập|tài khoản|username/i));

    const managerApi = await directApiContext();
    const employeeApi = await directApiContext();
    const adminApi = await directApiContext();
    const anonymousApi = await directApiContext();
    try {
      const managerSession = await loginViaApi(managerApi, USERS.manager);
      expect(managerSession.user.stores.map(({ code, role }) => ({ code, role }))).toEqual([
        { code: "0001", role: "STORE_MANAGER" },
        { code: "0002", role: "STORE_MANAGER" },
      ]);
      const employeeSession = await loginViaApi(employeeApi, USERS.employee);
      expect(employeeSession.user.stores).toEqual([{ id: STORES.primary.id, code: "0001", name: STORES.primary.name, role: "EMPLOYEE" }]);
      const adminSession = await loginViaApi(adminApi, USERS.chainAdmin);
      expect(adminSession.user.stores).toEqual([]);

      const employeeRecordsResponse = await employeeApi.get(`/api/v1/stores/${STORES.primary.id}/kph`);
      expect(employeeRecordsResponse.status()).toBe(200);
      expect((await employeeApi.get(`/api/v1/stores/${STORES.secondary.id}/kph`)).status()).toBe(403);
      expect((await managerApi.get(`/api/v1/stores/${STORES.outsideMembership.id}/kph`)).status()).toBe(403);
      expect((await adminApi.get(`/api/v1/stores/${STORES.primary.id}/kph`)).status()).toBe(403);
      expect((await adminApi.get(`/api/v1/catalog/barcodes/${FOUND_BARCODE}?storeId=${STORES.primary.id}`)).status()).toBe(403);
      expect((await anonymousApi.get(`/api/v1/stores/${STORES.primary.id}/kph`)).status()).toBe(401);

      const record = (await employeeRecordsResponse.json() as KphRecord[])[0];
      if (record) {
        expect((await employeeApi.put(`/api/v1/stores/${STORES.primary.id}/kph/${record.id}/approval`, {
          headers: { "X-CSRF-TOKEN": employeeSession.csrfToken },
          data: { status: "APPROVED" },
        })).status()).toBe(403);
        expect((await adminApi.post(`/api/v1/stores/${STORES.primary.id}/kph/exports`, {
          headers: { "X-CSRF-TOKEN": adminSession.csrfToken },
          data: { type: record.type, recordIds: [record.id] },
        })).status()).toBe(403);
      }

      const logout = await managerApi.post("/api/v1/auth/logout", {
        headers: { "X-CSRF-TOKEN": managerSession.csrfToken },
      });
      expect(logout.status()).toBe(204);
      expect((await managerApi.get("/api/v1/auth/session")).status()).toBe(401);
    } finally {
      await Promise.all([managerApi.dispose(), employeeApi.dispose(), adminApi.dispose(), anonymousApi.dispose()]);
    }
  });
});
