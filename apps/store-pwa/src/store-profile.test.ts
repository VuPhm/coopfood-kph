import { beforeEach, describe, expect, it } from "vitest";

import { resetPilotDatabaseForTests } from "./record-store";
import { loadPilotPinOverride, savePilotPinOverride } from "./pin-state";
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

  it("preserves a PIN reset when profile details stay on the same store code, then clears it when the code changes", async () => {
    await savePilotStoreProfile({ storeName: "Cống Quỳnh", storeCode: "0123", role: "", fullName: "", employeeCode: "" });
    await savePilotPinOverride("0000");

    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "0123", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });
    expect(await loadPilotPinOverride()).toBe("0000");

    await savePilotStoreProfile({ storeName: "Cống Quỳnh mới", storeCode: "5678", role: "STAFF", fullName: "Trần An", employeeCode: "NV-08" });
    expect(await loadPilotPinOverride()).toBeNull();
    expect((await loadPilotStoreProfile()).storeCode).toBe("5678");
  });
});
