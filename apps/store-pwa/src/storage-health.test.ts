import { describe, expect, it } from "vitest";

import { storageUsageLabel } from "./storage-health";

describe("storage health copy", () => {
  it("keeps the compact data usage label", () => {
    expect(storageUsageLabel({ persistent: true, usage: 6.9 * 1024 * 1024, quota: 2 * 1024 * 1024 * 1024 }))
      .toBe("dữ liệu: 6.9MB · 0%");
  });

  it("uses a compact fallback when quota is unavailable", () => {
    expect(storageUsageLabel({ persistent: false, usage: null, quota: null })).toBe("dữ liệu: trên thiết bị");
  });
});
