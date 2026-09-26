import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { DemoRecord } from "./demo-records";
import { getPilotSetting, loadPilotRecords, resetPilotDatabaseForTests, savePilotRecord, setPilotSetting } from "./record-store";
import { PIN_STATE_SETTING_KEY, loadPilotPinOverride, savePilotPinOverride } from "./pin-state";
import { STORE_PROFILE_SETTING_KEY, savePilotStoreProfile } from "./store-profile";
import { PinGate } from "./pin-gate";

function record(): DemoRecord {
  return {
    id: "KPH-260927-RESET",
    kind: "TPCN",
    detectedDate: "27/09/2026",
    detectedBy: "Nhân viên pilot",
    sku: "000123",
    productName: "Sản phẩm kiểm thử",
    supplier: "NCC-01",
    quantity: "1 EA",
    quantityValue: 1,
    unit: "EA",
    condition: "Cận date",
    resolution: "HỦY",
    treatmentDate: "",
    approvalStatus: "PENDING",
    photos: [{ id: "photo-1", src: "blob:preview", alt: "Ảnh thử", blob: new Blob(["photo"], { type: "image/jpeg" }) }],
    note: "Giữ dữ liệu hiện có",
  };
}

function enterPin(value: string) {
  fireEvent.change(screen.getByLabelText("Mã truy cập"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Mở ứng dụng" }));
}

async function openRecovery() {
  fireEvent.click(screen.getByRole("button", { name: "Quên mật khẩu?" }));
  await screen.findByRole("heading", { name: "Khôi phục mật khẩu" });
}

async function submitRecovery(recentPin: string, storeCode: string) {
  await screen.findByLabelText("Mật khẩu gần nhất");
  fireEvent.change(screen.getByLabelText("Mật khẩu gần nhất"), { target: { value: recentPin } });
  fireEvent.change(screen.getByLabelText("Mã cửa hàng"), { target: { value: storeCode } });
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
}

describe("store PIN gate", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("uses 0000 when no store code or override exists, retaining pilot data", async () => {
    await setPilotSetting("existing-pilot-setting", { retained: true });
    await savePilotRecord(record());
    render(<PinGate><div>Store workspace</div></PinGate>);

    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("src", "/brand/logo-coopfood-light.webp");
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("width", "640");
    enterPin("0000");

    expect(await screen.findByText("Store workspace")).toBeVisible();
    expect(await getPilotSetting("existing-pilot-setting")).toEqual({ retained: true });
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
  });

  it("uses the current store code as PIN", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");

    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("preserves leading zeroes in the store code PIN", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("0123");

    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("keeps the app locked after an incorrect PIN", async () => {
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");

    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
  });

  it("resets to 0000 without unlocking and no longer accepts the old PIN", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotRecord(record());
    const firstBootstrap = render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("1234", "1234");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotPinOverride()).toBe("0000");
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
    firstBootstrap.unmount();

    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    await openRecovery();
    await submitRecovery("1234", "1234");
    expect(await screen.findByRole("alert")).toHaveTextContent("Thông tin xác thực không đúng.");
    expect(await loadPilotPinOverride()).toBe("0000");
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    enterPin("0000");
    expect(await screen.findByText("Store workspace")).toBeVisible();
    expect(await getPilotSetting(STORE_PROFILE_SETTING_KEY)).toMatchObject({ storeCode: "1234" });
  });

  it.each([
    ["wrong recent PIN", "9999", "1234"],
    ["wrong store code", "1234", "5678"],
    ["both values wrong", "9999", "5678"],
  ])("does not reset when %s", async (_case, recentPin, storeCode) => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery(recentPin, storeCode);

    expect(await screen.findByRole("alert")).toHaveTextContent("Thông tin xác thực không đúng.");
    expect(await getPilotSetting(PIN_STATE_SETTING_KEY)).toMatchObject({ pinOverride: null });
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
  });

  it("shows the default PIN without creating a fake profile when no store code exists", async () => {
    await setPilotSetting("unrelated-pilot-setting", { retained: true });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();

    expect(await screen.findByText(/Mã truy cập mặc định hiện tại là 0000/)).toBeVisible();
    expect(screen.queryByLabelText("Mật khẩu gần nhất")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quay lại" }));
    expect(screen.getByLabelText("Mã truy cập")).toBeVisible();
    expect(await getPilotSetting(STORE_PROFILE_SETTING_KEY)).toBeUndefined();
    expect(await getPilotSetting("unrelated-pilot-setting")).toEqual({ retained: true });
  });

  it("clears the reset override when the store code changes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotPinOverride("0000");
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });

    expect(await loadPilotPinOverride()).toBeNull();
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("0000");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    enterPin("5678");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });
});
