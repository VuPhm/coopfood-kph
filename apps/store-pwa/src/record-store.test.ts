import { beforeEach, describe, expect, it } from "vitest";

import type { DemoRecord } from "./demo-records";
import {
  getPilotExportRuns,
  loadPilotRecords,
  patchPilotRecords,
  recordPilotExport,
  resetPilotDatabaseForTests,
  savePilotRecord,
} from "./record-store";

function record(): DemoRecord {
  return {
    id: "KPH-260827-A1B2C3",
    kind: "TPCN",
    detectedDate: "27/08/2026",
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
    photos: [{
      id: "photo-1",
      src: "blob:preview",
      alt: "Ảnh đã đóng tem",
      blob: new Blob(["stamped-evidence"], { type: "image/jpeg" }),
      fileName: "evidence.jpg",
    }],
    note: "Pilot IndexedDB",
  };
}

describe("pilot IndexedDB repository", () => {
  beforeEach(async () => resetPilotDatabaseForTests());

  it("round-trips a record and its stamped JPEG", async () => {
    await savePilotRecord(record());
    const [stored] = await loadPilotRecords();

    expect(stored).toMatchObject({
      id: "KPH-260827-A1B2C3",
      trashState: "active",
      approvalStatus: "PENDING",
      photos: [{ id: "photo-1", fileName: "evidence.jpg", mimeType: "image/jpeg", size: 16 }],
    });
    expect(stored?.photos[0]?.blob).toBeTruthy();
  });

  it("persists approval, recoverable trash and restore transitions", async () => {
    await savePilotRecord(record());
    await patchPilotRecords([record().id], { approvalStatus: "APPROVED", trashState: "trash", deletedAt: "2026-08-27T10:00:00.000Z" });
    expect((await loadPilotRecords())[0]).toMatchObject({ approvalStatus: "APPROVED", trashState: "trash", deletedAt: "2026-08-27T10:00:00.000Z" });

    await patchPilotRecords([record().id], { trashState: "active", deletedAt: null });
    expect((await loadPilotRecords())[0]).toMatchObject({ trashState: "active", deletedAt: null });
  });

  it("records the generated Excel handoff without claiming delivery", async () => {
    const value = record();
    await savePilotRecord(value);
    const run = await recordPilotExport("TPCN", [value], "Phieu_KPH_27-08-2026.xlsx");

    expect(run).toMatchObject({ recordIds: [value.id], templateVersion: "BM-331.CF-01" });
    expect(await getPilotExportRuns()).toEqual([expect.objectContaining({ fileName: "Phieu_KPH_27-08-2026.xlsx" })]);
    expect((await loadPilotRecords())[0]?.lastExportedAt).toBe(run.createdAt);
  });
});
