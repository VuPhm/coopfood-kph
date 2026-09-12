import { describe, expect, it } from "vitest";

import { storageHealthWarning, storageUsageLabel } from "./storage-health";

describe("storage health copy", () => {
  it("keeps the compact data usage label", () => {
    expect(storageUsageLabel({ persistent: true, usage: 6.9 * 1024 * 1024, quota: 2 * 1024 * 1024 * 1024 }))
      .toBe("dữ liệu: 6.9MB · <1%");
  });

  it("uses a compact fallback when quota is unavailable", () => {
    expect(storageUsageLabel({ persistent: false, usage: null, quota: null })).toBe("dữ liệu: trên thiết bị");
  });

  it("turns high usage and non-persistent storage into actionable warnings", () => {
    expect(storageHealthWarning({ persistent: true, usage: 86, quota: 100 })).toMatchObject({ level: "critical" });
    expect(storageHealthWarning({ persistent: true, usage: 70, quota: 100 })).toMatchObject({ level: "warning" });
    expect(storageHealthWarning({ persistent: false, usage: 10, quota: 100 })).toMatchObject({ level: "warning" });
    expect(storageHealthWarning({ persistent: true, usage: 10, quota: 100 })).toBeNull();
  });
});
