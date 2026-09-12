import { beforeEach, describe, expect, it } from "vitest";

import { resetPilotDatabaseForTests } from "./record-store";
import { actorIdentity, DEFAULT_STORE_PROFILE, isStoreProfileConfigured, loadPilotStoreProfile, savePilotStoreProfile, storeIdentity } from "./store-profile";

describe("pilot store profile", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("requires a store name and exactly four code digits before operational actions", () => {
    expect(isStoreProfileConfigured(DEFAULT_STORE_PROFILE)).toBe(false);
    expect(isStoreProfileConfigured({ ...DEFAULT_STORE_PROFILE, storeName: "Cống Quỳnh", storeCode: "123" })).toBe(false);
    expect(isStoreProfileConfigured({ ...DEFAULT_STORE_PROFILE, storeName: "Cống Quỳnh", storeCode: "0123" })).toBe(true);
  });

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
});
