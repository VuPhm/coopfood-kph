import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DemoRecord } from "./demo-records";
import { getPilotSetting, loadPilotRecords, resetPilotDatabaseForTests, savePilotRecord, setPilotSetting } from "./record-store";
import { effectivePilotPin, loadPilotPinState, normalizePilotPinState, PIN_STATE_SETTING_KEY } from "./pin-state";
import { loadPilotStoreProfile, STORE_PROFILE_SETTING_KEY, savePilotStoreProfile } from "./store-profile";
import { PinGate } from "./pin-gate";
import * as pinStateModule from "./pin-state";
import * as storeProfileModule from "./store-profile";

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
}

function enterPinDigits(value: string) {
  const input = screen.getByLabelText("Mã truy cập");
  let entered = "";
  for (const digit of value) {
    entered += digit;
    fireEvent.change(input, { target: { value: entered } });
  }
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
  afterEach(() => vi.restoreAllMocks());

  it("auto unlocks on the fourth correct digit without clicking the button", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    const profileLookup = vi.spyOn(storeProfileModule, "loadPilotStoreProfile");
    const pinLookup = vi.spyOn(pinStateModule, "loadPilotPinState");
    render(<PinGate><div>Store workspace</div></PinGate>);
    expect(screen.getByText(/Mặc định là 0000 nếu chưa thiết lập mã cửa hàng/)).toBeVisible();

    enterPinDigits("123");
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(profileLookup).not.toHaveBeenCalled();
    expect(pinLookup).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Mã truy cập"), { target: { value: "1234" } });
    expect(await screen.findByText("Store workspace")).toBeVisible();
    expect(profileLookup).toHaveBeenCalledTimes(1);
    expect(pinLookup).toHaveBeenCalledTimes(1);
  });

  it("clears a wrong PIN, focuses the input, then auto unlocks after a correct retry", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPinDigits("9999");

    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    expect(screen.getByLabelText("Mã truy cập")).toHaveValue("");
    await waitFor(() => expect(screen.getByLabelText("Mã truy cập")).toHaveFocus());

    enterPinDigits("1234");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("keeps the manual button enabled and shares one in-flight verification", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    const loadProfile = storeProfileModule.loadPilotStoreProfile;
    const profileLookup = vi.spyOn(storeProfileModule, "loadPilotStoreProfile");
    const pinLookup = vi.spyOn(pinStateModule, "loadPilotPinState");
    let releaseLookup!: () => void;
    let startedLookup!: () => void;
    const waitForLookup = new Promise<void>((resolve) => { releaseLookup = resolve; });
    const lookupStarted = new Promise<void>((resolve) => { startedLookup = resolve; });
    profileLookup.mockImplementation(async () => {
      startedLookup();
      await waitForLookup;
      return loadProfile();
    });
    render(<PinGate><div>Store workspace</div></PinGate>);

    const input = screen.getByLabelText("Mã truy cập");
    fireEvent.change(input, { target: { value: "1234" } });
    await lookupStarted;
    const button = screen.getByRole("button", { name: "Đang kiểm tra…" });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(profileLookup).toHaveBeenCalledTimes(1);
    expect(pinLookup).toHaveBeenCalledTimes(1);

    releaseLookup();
    expect(await screen.findByText("Store workspace")).toBeVisible();
    expect(profileLookup).toHaveBeenCalledTimes(1);
    expect(pinLookup).toHaveBeenCalledTimes(1);
  });

  it("uses 0000 on a fresh install and keeps recovery available without previous PIN history", async () => {
    await setPilotSetting("existing-pilot-setting", { retained: true });
    await savePilotRecord(record());
    render(<PinGate><div>Store workspace</div></PinGate>);

    const state = await loadPilotPinState();
    expect(state.previousPin).toBeNull();
    expect(effectivePilotPin(state, "")).toBe("0000");
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("src", "/brand/logo-coopfood-light.webp");
    expect(screen.getByRole("img", { name: /Co\.op Food/ })).toHaveAttribute("width", "640");
    await openRecovery();
    expect(screen.getByLabelText("Mật khẩu trước đó")).toBeVisible();
    expect(screen.getByRole("button", { name: "Đặt lại mật khẩu" })).toBeVisible();
    expect(screen.queryByText("Không có mật khẩu trước đó để khôi phục.")).not.toBeInTheDocument();
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

  it("accepts only 0000 when there is no previous PIN", async () => {
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("1234");

    expect(await screen.findByRole("alert")).toHaveTextContent("Thông tin xác thực không đúng.");
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: null });
  });

  it("auto verifies the store code PIN and preserves leading zeroes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    const state = await loadPilotPinState();
    expect(effectivePilotPin(state, "0123")).toBe("0123");

    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPinDigits("0123");
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
    await setPilotSetting("unrelated-pilot-setting", { retained: true });
    await savePilotRecord(record());
    const firstBootstrap = render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    expect(screen.queryByLabelText("Mã cửa hàng")).not.toBeInTheDocument();
    await submitRecovery("1234");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
    expect((await loadPilotStoreProfile()).storeCode).toBe("5678");
    expect(await getPilotSetting("unrelated-pilot-setting")).toEqual({ retained: true });
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
    firstBootstrap.unmount();

    render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("5678");
    expect(await screen.findByRole("alert")).toHaveTextContent("Mã truy cập chưa đúng");
    enterPin("0000");
    expect(await screen.findByText("Store workspace")).toBeVisible();
  });

  it("does not let fallback 0000 bypass a stored previous PIN and gives one-use recovery only", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "5678", role: "", fullName: "", employeeCode: "" });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("0000");

    expect(await screen.findByRole("alert")).toHaveTextContent("Thông tin xác thực không đúng.");
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "1234" });
    fireEvent.change(screen.getByLabelText("Mật khẩu trước đó"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Đặt lại mật khẩu" }));
    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });

    await openRecovery();
    expect(screen.getByLabelText("Mật khẩu trước đó")).toBeVisible();
    expect(screen.queryByText("Không có mật khẩu trước đó để khôi phục.")).not.toBeInTheDocument();
  });

  it("keeps a leading-zero previous PIN when the store code changes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0456", role: "", fullName: "", employeeCode: "" });

    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0123" });
    expect(effectivePilotPin(await loadPilotPinState(), "0456")).toBe("0456");

    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("0123");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
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

  it("keeps a legacy store code as the login PIN and allows fallback recovery when pin state is absent", async () => {
    await setPilotSetting(STORE_PROFILE_SETTING_KEY, {
      storeName: "Cống Quỳnh",
      storeCode: "1111",
      role: "",
      fullName: "",
      employeeCode: "",
    });
    await setPilotSetting("unrelated-pilot-setting", { retained: true });
    await savePilotRecord(record());

    expect(await getPilotSetting(PIN_STATE_SETTING_KEY)).toBeUndefined();
    expect(effectivePilotPin(await loadPilotPinState(), "1111")).toBe("1111");
    const firstLogin = render(<PinGate><div>Store workspace</div></PinGate>);
    enterPin("1111");
    expect(await screen.findByText("Store workspace")).toBeVisible();
    firstLogin.unmount();

    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("0000");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(screen.queryByText("Store workspace")).not.toBeInTheDocument();
    expect(await loadPilotStoreProfile()).toMatchObject({ storeCode: "1111" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
    expect(effectivePilotPin(await loadPilotPinState(), "1111")).toBe("0000");
    expect(await getPilotSetting("unrelated-pilot-setting")).toEqual({ retained: true });
    expect((await loadPilotRecords()).map(({ id }) => id)).toEqual([record().id]);
  });

  it("allows fallback recovery for legacy override state without changing the store code", async () => {
    await setPilotSetting(STORE_PROFILE_SETTING_KEY, {
      storeName: "Cống Quỳnh",
      storeCode: "1111",
      role: "",
      fullName: "",
      employeeCode: "",
    });
    await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride: "0000", previousPin: null });
    render(<PinGate><div>Store workspace</div></PinGate>);
    await openRecovery();
    await submitRecovery("0000");

    expect(await screen.findByText("Mã truy cập đã được đặt lại về 0000.")).toBeVisible();
    expect(await loadPilotStoreProfile()).toMatchObject({ storeCode: "1111" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: "0000", previousPin: null });
  });
});
