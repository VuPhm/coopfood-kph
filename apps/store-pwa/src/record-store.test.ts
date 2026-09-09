import { beforeEach, describe, expect, it } from "vitest";

import type { RecordView } from "./record-view";
import {
  closePilotDatabaseForTests,
  getPilotExportRuns,
  loadPilotRecords,
  patchPilotRecords,
  recordPilotExport,
  resetPilotDatabaseForTests,
  savePilotRecord,
} from "./record-store";

const PILOT_DATABASE_NAME = "coopfood-kph-pilot";

function createLegacyDatabase() {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(PILOT_DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      const records = request.result.createObjectStore("records", { keyPath: "id" });
      records.createIndex("by-kind", "kind");
      records.createIndex("by-trash-state", "trashState");
      records.createIndex("by-detected-date", "detectedDate");
      const exportRuns = request.result.createObjectStore("export_runs", { keyPath: "id" });
      exportRuns.createIndex("by-created-at", "createdAt");
      request.result.createObjectStore("settings", { keyPath: "key" });
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("records", "readwrite");
      transaction.objectStore("records").put({
        id: "legacy-record",
        createdAt: "2026-08-27T00:00:00.000Z",
        updatedAt: "2026-08-27T00:00:00.000Z",
      });
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
    };
  });
}

function inspectRecordsStore() {
  return new Promise<{ indexes: string[]; version: number }>((resolve, reject) => {
    const request = indexedDB.open(PILOT_DATABASE_NAME);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("records", "readonly");
      const indexes = Array.from(transaction.objectStore("records").indexNames);
      const version = database.version;
      database.close();
      resolve({ indexes, version });
    };
  });
}

function record(): RecordView {
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

  it("reopens persisted records without relying on in-memory state", async () => {
    await savePilotRecord(record());
    await closePilotDatabaseForTests();

    await expect(loadPilotRecords()).resolves.toEqual([
      expect.objectContaining({ id: "KPH-260827-A1B2C3", photos: [expect.objectContaining({ mimeType: "image/jpeg" })] }),
    ]);
  });

  it("upgrades a deployed version-1 database without dropping its stores", async () => {
    await createLegacyDatabase();

    await expect(loadPilotRecords()).resolves.toEqual([
      expect.objectContaining({ id: "legacy-record", createdAt: "2026-08-27T00:00:00.000Z" }),
    ]);
    await closePilotDatabaseForTests();
    await expect(inspectRecordsStore()).resolves.toEqual({
      version: 2,
      indexes: expect.arrayContaining(["by-kind", "by-trash-state", "by-detected-date", "by-updated-at"]),
    });
  });

  it("persists approval, recoverable trash and restore transitions", async () => {
    await savePilotRecord(record());
    await patchPilotRecords([record().id], { approvalStatus: "APPROVED", trashState: "trash", deletedAt: "2026-08-27T10:00:00.000Z" });
    expect((await loadPilotRecords())[0]).toMatchObject({ approvalStatus: "APPROVED", trashState: "trash", deletedAt: "2026-08-27T10:00:00.000Z" });

    await patchPilotRecords([record().id], { trashState: "active", deletedAt: null });
    expect((await loadPilotRecords())[0]).toMatchObject({ trashState: "active", deletedAt: null });
  });

  it("rolls back earlier writes when a multi-record patch transaction aborts", async () => {
    const first = record();
    const second = { ...record(), id: "KPH-260827-D4E5F6" };
    await savePilotRecord(first);
    await savePilotRecord(second);
    let reads = 0;
    const invalidPatch = Object.defineProperty({}, "approvalStatus", {
      enumerable: true,
      get: () => ++reads === 1 ? "APPROVED" : Symbol("uncloneable"),
    }) as Parameters<typeof patchPilotRecords>[1];

    await expect(patchPilotRecords([first.id, second.id], invalidPatch)).rejects.toBeTruthy();

    expect((await loadPilotRecords()).map(({ approvalStatus, id }) => ({ approvalStatus, id }))).toEqual(
      expect.arrayContaining([
        { id: first.id, approvalStatus: "PENDING" },
        { id: second.id, approvalStatus: "PENDING" },
      ]),
    );
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
