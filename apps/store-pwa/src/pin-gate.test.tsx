import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { DemoRecord } from "./demo-records";
import { getPilotSetting, loadPilotRecords, resetPilotDatabaseForTests, savePilotRecord, setPilotSetting } from "./record-store";
import { effectivePilotPin, loadPilotPinState, normalizePilotPinState, PIN_STATE_SETTING_KEY } from "./pin-state";
import { loadPilotStoreProfile, STORE_PROFILE_SETTING_KEY, savePilotStoreProfile } from "./store-profile";
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

async function submitRecovery(previousPin: string) {
  await screen.findByLabelText("Mật khẩu trước đó");
  fireEvent.change(screen.getByLabelText("Mật khẩu trước đó"), { target: { value: previousPin } });
  fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
}

describe("store PIN gate", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("uses 0000 on a fresh install and reports that no previous PIN is available", async () => {
    await setPilotSetting("existing-pilot-setting", { retained: true });
    await savePilotRecord(record());
    render(<PinGate><div>Store workspace</div></PinGate>);

    const state = await loadPilotPinState();
    expect(state.previousPin).toBeNull();
    expect(effectivePilotPin(state, "")).toBe("0000");
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("src", "/brand/logo-coopfood-light.webp");
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("width", "640");
    await openRecovery();
    expect(await screen.findByText("Không có mật khẩu trước đó để khôi phục.")).toBeVisible();
    expect(screen.queryByLabelText("Mã cửa hàng")).not.toBeInTheDocument();
    expect(await getPilotSetting(STORE_PROFILE_SETTING_KEY)).toBeUndefined();
    expect(await getPilotSetting("existing-pilot-setting")).toEqual({ retained: true });
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
  });

  it("captures 0000 as previous PIN when a store code is set for the first time", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    const state = await loadPilotPinState();

    expect(state).toEqual({ pinOverride: null, previousPin: "0000" });
    expect(effectivePilotPin(state, "1234")).toBe("1234");
  });

  it("recovers a first-time store-code change with previous PIN 0000", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("0000");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
  });

  it("uses the store code as PIN and preserves leading zeroes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    const state = await loadPilotPinState();
    expect(effectivePilotPin(state, "0123")).toBe("0123");

    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("0123");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("changes 1234 to 5678 while retaining 1234 as the one previous PIN", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    const state = await loadPilotPinState();

    expect(state).toEqual({ pinOverride: null, previousPin: "1234" });
    expect(effectivePilotPin(state, "5678")).toBe("5678");
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1234");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    enterPin("5678");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("recovers 1234 → 5678 with 1234 and returns to login at 0000 without changing store code", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    await savePilotRecord(record());
    const firstBootstrap = render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    expect(screen.queryByLabelText("Mã cửa hàng")).not.toBeInTheDocument();
    await submitRecovery("1234");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
    expect((await loadPilotStoreProfile()).storeCode).toBe("5678");
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
    firstBootstrap.unmount();

    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("5678");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    enterPin("0000");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("does not reset for an incorrect previous PIN and gives one-use recovery only", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("9999");

    expect(await screen.findByRole("alert")).toHaveTextContent("Thông tin xác thực không đúng.");
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "1234" });
    fireEvent.change(screen.getByLabelText("Mật khẩu trước đó"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });

    await openRecovery();
    expect(await screen.findByText("Không có mật khẩu trước đó để khôi phục.")).toBeVisible();
    expect(screen.queryByLabelText("Mật khẩu trước đó")).not.toBeInTheDocument();
  });

  it("keeps a leading-zero previous PIN when the store code changes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0456", role: "", fullName: "", employeeCode: "" });

    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0123" });
    expect(effectivePilotPin(await loadPilotPinState(), "0456")).toBe("0456");
  });

  it("does not overwrite previous PIN when saving the same store code", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "1234", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });

    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0000" });
  });

  it("uses 0000 as previous PIN when a changed code supersedes a reset override", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride: "0000", previousPin: null });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "9999", role: "", fullName: "", employeeCode: "" });
    const state = await loadPilotPinState();

    expect(state).toEqual({ pinOverride: null, previousPin: "0000" });
    expect(effectivePilotPin(state, "9999")).toBe("9999");
  });

  it("reads old PIN state without previousPin as null and leaves other IndexedDB data intact", async () => {
    await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride: "0000" });
    await setPilotSetting("unrelated-pilot-setting", { retained: true });
    await savePilotRecord(record());

    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
    expect(normalizePilotPinState({ pinOverride: "0000" })).toEqual({ pinOverride: "0000", previousPin: null });
    expect(await getPilotSetting("unrelated-pilot-setting")).toEqual({ retained: true });
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
  });
});
