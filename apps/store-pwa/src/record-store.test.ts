// @vitest-environment node
import { openDB } from "idb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DemoRecord } from "./demo-records";
import {
  getPilotSetting,
  getPilotExportRuns,
  loadPilotRecords,
  patchPilotRecords,
  recordPilotExport,
  resetPilotDatabaseForTests,
  savePilotRecord,
  toPilotRecord,
} from "./record-store";

const NativeBlob = Blob;

async function rawDatabase() {
  await loadPilotRecords();
  return openDB("coopfood-kph-pilot");
}

async function seedLegacyRecord(value?: DemoRecord) {
  // Native Blob participates in fake-indexeddb's Node structured clone.
  vi.stubGlobal("Blob", NativeBlob);
  const db = await rawDatabase();
  await db.put("records", toPilotRecord(value ?? record(), "active"));
  db.close();
}

function rejectBlobWrites() {
  const put = IDBObjectStore.prototype.put;
  return vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value, key) {
    if (value.photos?.some((photo: { blob: unknown }) => photo.blob instanceof Blob)) {
      throw new DOMException("Error preparing Blob/File data to be stored in object store", "UnknownError");
    }
    return put.call(this, value, key);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

  it("saves, approves, restores and exports when IndexedDB rejects every Blob write", async () => {
    vi.stubGlobal("Blob", NativeBlob);
    rejectBlobWrites();
    const value = record();
    await savePilotRecord(value);
    await patchPilotRecords([value.id], { approvalStatus: "APPROVED", trashState: "trash" });
    await patchPilotRecords([value.id], { trashState: "active", deletedAt: null });
    await recordPilotExport("TPCN", [value], "test.xlsx");
    const [loaded] = await loadPilotRecords();

    expect(loaded).toMatchObject({ approvalStatus: "APPROVED", trashState: "active" });
    expect(await loaded!.photos[0]!.blob.text()).toBe("stamped-evidence");
    expect(await getPilotExportRuns()).toHaveLength(1);
  });

  it("stores exact bytes and restores all three photos in their original order", async () => {
    vi.stubGlobal("Blob", NativeBlob);
    const value = record();
    value.photos = [1, 2, 3].map((index) => ({
      id: `photo-${index}`, src: `blob:${index}`, alt: `Ảnh thử ${index}`,
      fileName: `test-${index}.jpg`, blob: new Blob([new Uint8Array([0, 255, index])], { type: "image/jpeg" }),
    }));
    await savePilotRecord(value);
    const db = await rawDatabase();
    const stored = await db.get("records", value.id);
    db.close();
    expect(stored.photos.every((photo: { blob: unknown }) => Object.prototype.toString.call(photo.blob) === "[object ArrayBuffer]")).toBe(true);
    const [loaded] = await loadPilotRecords();
    expect(loaded!.photos.map(({ id, fileName, mimeType, size }) => ({ id, fileName, mimeType, size })))
      .toEqual([1, 2, 3].map((index) => ({ id: `photo-${index}`, fileName: `test-${index}.jpg`, mimeType: "image/jpeg", size: 3 })));
    for (const [index, photo] of loaded!.photos.entries()) {
      expect(photo.blob.type).toBe("image/jpeg");
      expect(new Uint8Array(await photo.blob.arrayBuffer())).toEqual(new Uint8Array([0, 255, index + 1]));
    }
  });

  it("reads a mix of legacy Blobs and new byte records without rewriting on load", async () => {
    await seedLegacyRecord();
    const fresh = { ...record(), id: "KPH-new" };
    await savePilotRecord(fresh);
    const writes = vi.spyOn(IDBObjectStore.prototype, "put");
    const loaded = await loadPilotRecords();
    expect(loaded.map(({ id }) => id).sort()).toEqual([record().id, fresh.id].sort());
    for (const value of loaded) expect(await value.photos[0]!.blob.text()).toBe("stamped-evidence");
    expect(writes).not.toHaveBeenCalled();
  });

  it.each(["patch", "export"])("rewrites legacy photos as bytes during %s without changing image content", async (operation) => {
    await seedLegacyRecord();
    rejectBlobWrites();
    if (operation === "patch") await patchPilotRecords([record().id], { approvalStatus: "APPROVED" });
    else await recordPilotExport("TPCN", [record()], "test.xlsx");
    const [loaded] = await loadPilotRecords();
    expect(await loaded!.photos[0]!.blob.text()).toBe("stamped-evidence");
  });

  it("finishes a delayed legacy photo read before opening the write transaction and keeps concurrent metadata", async () => {
    await seedLegacyRecord();
    const readBytes = NativeBlob.prototype.arrayBuffer;
    let release!: (bytes: ArrayBuffer) => void;
    const reading = vi.spyOn(NativeBlob.prototype, "arrayBuffer").mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
    const pending = patchPilotRecords([record().id], { trashState: "trash" });
    await vi.waitFor(() => expect(reading).toHaveBeenCalled());
    await patchPilotRecords([record().id], { approvalStatus: "APPROVED" });
    release(await readBytes.call(record().photos[0]!.blob));
    await pending;
    expect((await loadPilotRecords())[0]).toMatchObject({ approvalStatus: "APPROVED", trashState: "trash" });
  });

  it("keeps the previous record if reading replacement image bytes fails", async () => {
    vi.stubGlobal("Blob", NativeBlob);
    await savePilotRecord(record());
    vi.spyOn(NativeBlob.prototype, "arrayBuffer").mockRejectedValueOnce(new Error("unreadable image"));
    await expect(savePilotRecord({ ...record(), note: "must not persist" })).rejects.toThrow("unreadable image");
    expect((await loadPilotRecords())[0]?.note).toBe("Pilot IndexedDB");
  });

  it("rejects incomplete image bytes instead of persisting a truncated photo", async () => {
    vi.stubGlobal("Blob", NativeBlob);
    vi.spyOn(NativeBlob.prototype, "arrayBuffer").mockResolvedValueOnce(new ArrayBuffer(0));
    await expect(savePilotRecord(record())).rejects.toThrow("Không thể đọc đầy đủ dữ liệu ảnh để lưu");
    expect(await loadPilotRecords()).toEqual([]);
  });

  it.each(["patch", "export"])("rolls back the entire %s transaction on a later quota failure", async (operation) => {
    const first = record();
    const second = { ...record(), id: "KPH-second" };
    await savePilotRecord(first);
    await savePilotRecord(second);
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, "put").mockImplementation(function (this: IDBObjectStore, value, key) {
      if (value.id === second.id) throw new DOMException("Storage full", "QuotaExceededError");
      return put.call(this, value, key);
    });
    const writing = operation === "patch"
      ? patchPilotRecords([first.id, second.id], { approvalStatus: "APPROVED" })
      : recordPilotExport("TPCN", [first, second], "test.xlsx");
    await expect(writing).rejects.toMatchObject({ name: "QuotaExceededError" });
    expect((await loadPilotRecords()).every(({ approvalStatus, lastExportedAt }) => approvalStatus === "PENDING" && lastExportedAt === null)).toBe(true);
    expect(await getPilotExportRuns()).toHaveLength(0);
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

  it("opens a pre-existing higher-version settings database without resetting it", async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("coopfood-kph-pilot", 2);
      request.onupgradeneeded = () => request.result.createObjectStore("settings", { keyPath: "key" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction("settings", "readwrite");
        transaction.objectStore("settings").put({ key: "existing-setting", value: "kept", updatedAt: "2026-09-27T00:00:00.000Z" });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });

    expect(await getPilotSetting("existing-setting")).toBe("kept");
  });
});
