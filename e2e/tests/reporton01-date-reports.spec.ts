import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test.skip(process.env.E2E_REPORTON01 !== "true", "Requires the synthetic ADMIN03 Store online fixture");
test.use({ trace: "off", video: "off" });

test("opens the notified lot and freezes its quantity in a period report", async ({ page }, info) => {
  await page.goto("/");
  await page.getByLabel("Tên đăng nhập", {exact:true}).fill("chain.admin03");
  await page.getByLabel("Mật khẩu", {exact:true}).fill("admin-e2e-password");
  await page.getByRole("button", {name:"Đăng nhập", exact:true}).click();
  await page.getByRole("button", {name:/^001 ·/}).click();
  await expect(page.getByRole("button", {name:"Tài khoản", exact:true})).toBeVisible();
  const { csrfToken } = await (await page.request.get("/api/v1/auth/session")).json();
  const headers = { "X-CSRF-TOKEN":csrfToken, "Idempotency-Key":randomUUID() };
  const store = "73000000-0000-4000-8000-000000000001";
  const lots = "/api/v1/stores/"+store+"/date-lots";
  const sku = "00"+randomUUID().slice(0,8);
  const input = { lookupStatus:"MANUAL", barcode:null, skuCode:sku, productName:"Sữa chua ít đường",
    lotCode:"LO-"+sku, manufacturedOn:null, expiresOn:"2026-11-01", trackedQuantity:"1.2345", unit:"kg" };
  const created = await page.request.post(lots, {headers,data:input});
  expect(created.status()).toBe(201);
  const {lot} = await created.json();

  await page.getByRole("link", {name:"Thông báo", exact:true}).filter({visible:true}).click();
  await expect(page.locator("[data-notification-lot]").first()).toBeVisible();
  const notice = page.locator(`[data-notification-lot="${lot.id}"]`);
  while (!await notice.count() && await page.getByRole("button", {name:/Tải thêm/}).isVisible()) {
    const before = await page.locator("[data-notification-lot]").count();
    await page.getByRole("button", {name:/Tải thêm/}).click();
    await expect.poll(()=>page.locator("[data-notification-lot]").count()).toBeGreaterThan(before);
  }
  await notice.click();
  const detail = page.getByRole("dialog",{name:"Chi tiết lô DATE"});
  await expect(detail).toContainText(input.lotCode);
  await page.keyboard.press("Escape");
  await page.getByRole("link", {name:"Trang chủ", exact:true}).filter({visible:true}).first().click();
  await page.getByRole("button", {name:"Báo cáo", exact:true}).click();
  await page.getByRole("button",{name:"Hàng cần chú ý"}).click();
  await page.getByRole("textbox",{name:"Tìm lô",exact:true}).fill(sku);
  await expect(page.getByRole("checkbox")).toHaveCount(1);
  await page.getByRole("button",{name:"Chọn trang này"}).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByLabel("Kỳ báo cáo").selectOption("week");
  await page.screenshot({path:info.outputPath("report-source.png")});
  await page.getByRole("button",{name:"Tạo bản báo cáo"}).click();
  const sheet = page.getByRole("dialog",{name:"Tạo báo cáo"});
  const title = "Kiểm kỳ · "+sku;
  await sheet.getByLabel("Tên báo cáo").fill(title);

  if (info.project.name==="desktop-chromium") {
    await page.route("**/date-reports",async route=>{
      const committed = await route.fetch();
      expect(committed.status()).toBe(201);
      await route.abort("failed");
    },{times:1});
    await sheet.getByRole("button",{name:"Lưu báo cáo"}).click();
    await expect(sheet.getByRole("alert")).toBeVisible();
  }
  await sheet.getByRole("button",{name:"Lưu báo cáo"}).click();
  await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
  await expect(page.getByText("1 lô · Còn theo dõi 0 EA · 1,2345 kg", {exact:true})).toBeVisible();
  const updated = await page.request.patch(lots+"/"+lot.id, {headers,
    data:{...input,trackedQuantity:"2.5",expectedVersion:lot.version,reason:"Kiểm lại lượng fixture"}});
  expect(updated.status()).toBe(200);
  await page.reload();
  await page.getByRole("button",{name:/^001 ·/}).click();
  await page.getByRole("button",{name:"Lịch sử",exact:true}).click();
  await page.getByRole("textbox",{name:"Tìm báo cáo",exact:true}).fill(title);
  await page.getByRole("button",{name:new RegExp(title)}).click();
  await expect(page.getByText("1 lô · Còn theo dõi 0 EA · 1,2345 kg", {exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath("report-saved.png")});
});
