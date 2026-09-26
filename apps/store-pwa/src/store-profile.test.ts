import { beforeEach, describe, expect, it } from "vitest";

import { resetPilotDatabaseForTests, setPilotSetting } from "./record-store";
import { loadPilotPinState, PIN_STATE_SETTING_KEY } from "./pin-state";
import { actorIdentity, loadPilotStoreProfile, savePilotStoreProfile, storeIdentity } from "./store-profile";

describe("pilot store profile", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("persists the store and optional actor fields in IndexedDB", async () => {
    await savePilotStoreProfile({
      storeName: "Cống Quỳnh",
      storeCode: "0123",
      role: "STORE_MANAGER",
      fullName: "Trần An",
      employeeCode: "NV-08",
    });

    const profile = await loadPilotStoreProfile();
    expect(storeIdentity(profile)).toBe("Co.op Food Cống Quỳnh · 0123");
    expect(actorIdentity(profile)).toBe("Trần An · CHT · NV-08");
  });

  it("captures the effective previous PIN in the same settings transaction as a store-code change", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0000" });

    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "0123", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0000" });

    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "5678", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0123" });
    expect((await loadPilotStoreProfile()).storeCode).toBe("5678");

    await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride: "0000", previousPin: null });
    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "9999", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });
    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "0000" });
  });

  it("does not replace previous PIN when a store-code change leaves effective PIN unchanged", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "1234", role: "", fullName: "", employeeCode: "" });
    await setPilotSetting(PIN_STATE_SETTING_KEY, { pinOverride: "0000", previousPin: "1111" });

    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0000", role: "", fullName: "", employeeCode: "" });

    expect(await loadPilotPinState()).toEqual({ pinOverride: null, previousPin: "1111" });
  });
});
