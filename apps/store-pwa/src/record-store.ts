import type { KphKind } from "@coopfood-kph/kph-rules";
import { type DBSchema, openDB } from "idb";

import type { DemoApprovalStatus, DemoRecord } from "./demo-records";

const DATABASE_NAME = "coopfood-kph-pilot";
const DATABASE_VERSION = 1;

export type PilotPhoto = {
  id: string;
  fileName: string;
  alt: string;
  blob: Blob;
  mimeType: string;
  size: number;
};

export type PilotRecord = {
  id: string;
  kind: KphKind;
  detectedDate: string;
  detectedBy: string;
  sku: string;
  productName: string;
  supplier: string;
  quantity: string;
  quantityValue: number;
  unit: "EA" | "kg";
  condition: string;
  resolution: string;
  treatmentDate: string;
  approvalStatus: DemoApprovalStatus;
  photos: PilotPhoto[];
  note: string;
  trashState: "active" | "trash";
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastExportedAt: string | null;
};

export type PilotExportRun = {
  id: string;
  kind: KphKind;
  recordIds: string[];
  fileName: string;
  createdAt: string;
  templateVersion: "BM-331.CF-01";
};

type PilotSetting = {
  key: string;
  value: unknown;
  updatedAt: string;
};

interface PilotDatabase extends DBSchema {
  records: {
    key: string;
    value: PilotRecord;
    indexes: {
      "by-detected-date": string;
      "by-kind": KphKind;
      "by-trash-state": "active" | "trash";
    };
  };
  export_runs: {
    key: string;
    value: PilotExportRun;
    indexes: { "by-created-at": string };
  };
  settings: {
    key: string;
    value: PilotSetting;
  };
}

let databasePromise: ReturnType<typeof openDB<PilotDatabase>> | undefined;

function database() {
  databasePromise ??= openDB<PilotDatabase>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      const records = db.createObjectStore("records", { keyPath: "id" });
      records.createIndex("by-kind", "kind");
      records.createIndex("by-trash-state", "trashState");
      records.createIndex("by-detected-date", "detectedDate");

      const exportRuns = db.createObjectStore("export_runs", { keyPath: "id" });
      exportRuns.createIndex("by-created-at", "createdAt");
      db.createObjectStore("settings", { keyPath: "key" });
    },
    blocked() {
      window.dispatchEvent(new CustomEvent("kph-storage-blocked"));
    },
    blocking(_currentVersion, _blockedVersion, _event) {
      void databasePromise?.then((db) => db.close());
      databasePromise = undefined;
      window.dispatchEvent(new CustomEvent("kph-storage-version-change"));
    },
    terminated() {
      databasePromise = undefined;
      window.dispatchEvent(new CustomEvent("kph-storage-terminated"));
    },
  });
  return databasePromise;
}

function persistablePhoto(recordId: string, photo: DemoRecord["photos"][number], index: number): PilotPhoto {
  if (!photo.blob) throw new Error(`Ảnh ${index + 1} của phiếu ${recordId} chưa có dữ liệu để lưu`);
  return {
    id: photo.id,
    fileName: photo.fileName ?? `anh-${index + 1}.jpg`,
    alt: photo.alt,
    blob: photo.blob,
    mimeType: photo.blob.type || "image/jpeg",
    size: photo.blob.size,
  };
}

export function toPilotRecord(record: DemoRecord, trashState: "active" | "trash", previous?: PilotRecord): PilotRecord {
  const now = new Date().toISOString();
  return {
    id: record.id,
    kind: record.kind,
    detectedDate: record.detectedDate,
    detectedBy: record.detectedBy,
    sku: record.sku,
    productName: record.productName,
    supplier: record.supplier,
    quantity: record.quantity,
    quantityValue: record.quantityValue,
    unit: record.unit,
    condition: record.condition,
    resolution: record.resolution,
    treatmentDate: record.treatmentDate,
    approvalStatus: record.approvalStatus,
    photos: record.photos.map((photo, index) => persistablePhoto(record.id, photo, index)),
    note: record.note ?? "",
    trashState,
    createdAt: previous?.createdAt ?? record.createdAt ?? now,
    updatedAt: now,
    deletedAt: trashState === "trash" ? previous?.deletedAt ?? now : null,
    lastExportedAt: previous?.lastExportedAt ?? record.lastExportedAt ?? null,
  };
}

export async function loadPilotRecords() {
  const db = await database();
  const records = await db.getAll("records");
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function savePilotRecord(record: DemoRecord, trashState: "active" | "trash" = "active") {
  const db = await database();
  const previous = await db.get("records", record.id);
  const stored = toPilotRecord(record, trashState, previous);
  await db.put("records", stored);
  return stored;
}

export async function patchPilotRecords(
  recordIds: readonly string[],
  patch: Partial<Pick<PilotRecord, "approvalStatus" | "deletedAt" | "lastExportedAt" | "trashState">>,
) {
  const db = await database();
  const transaction = db.transaction("records", "readwrite");
  const now = new Date().toISOString();
  for (const recordId of recordIds) {
    const current = await transaction.store.get(recordId);
    if (!current) continue;
    await transaction.store.put({ ...current, ...patch, updatedAt: now });
  }
  await transaction.done;
}

export async function recordPilotExport(kind: KphKind, records: readonly DemoRecord[], fileName: string) {
  const db = await database();
  const transaction = db.transaction(["export_runs", "records"], "readwrite");
  const createdAt = new Date().toISOString();
  const run: PilotExportRun = {
    id: globalThis.crypto?.randomUUID?.() ?? `export-${Date.now()}`,
    kind,
    recordIds: records.map(({ id }) => id),
    fileName,
    createdAt,
    templateVersion: "BM-331.CF-01",
  };
  await transaction.objectStore("export_runs").put(run);
  for (const record of records) {
    const current = await transaction.objectStore("records").get(record.id);
    if (current) await transaction.objectStore("records").put({ ...current, lastExportedAt: createdAt, updatedAt: createdAt });
  }
  await transaction.done;
  return run;
}

export async function getPilotExportRuns() {
  const db = await database();
  return db.getAllFromIndex("export_runs", "by-created-at");
}

export async function setPilotSetting(key: string, value: unknown) {
  const db = await database();
  await db.put("settings", { key, value, updatedAt: new Date().toISOString() });
}

export async function getPilotSetting<T>(key: string): Promise<T | undefined> {
  const db = await database();
  return (await db.get("settings", key))?.value as T | undefined;
}

export async function resetPilotDatabaseForTests() {
  const db = await database();
  db.close();
  databasePromise = undefined;
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Không thể reset IndexedDB test"));
  });
}
