import type { KphKind } from "@coopfood-kph/kph-rules";
import { type DBSchema, openDB } from "idb";

import type { DemoApprovalStatus, DemoRecord } from "./demo-records";

const DATABASE_NAME = "coopfood-kph-pilot";

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

// The storage codec accepts legacy Blobs, but writes bytes to avoid WebKit's
// Blob/File temporary-file failure. Public/UI records still expose Blobs.
type StoredPhoto = Omit<PilotPhoto, "blob"> & { blob: Blob | ArrayBuffer };
type StoredRecord = Omit<PilotRecord, "photos"> & { photos: StoredPhoto[] };

interface PilotDatabase extends DBSchema {
  records: {
    key: string;
    value: StoredRecord;
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
  // Open the existing version when a browser already has a newer compatible schema.
  databasePromise ??= openDB<PilotDatabase>(DATABASE_NAME, undefined, {
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

export function toPilotRecord(record: DemoRecord, trashState: "active" | "trash", previous?: StoredRecord): PilotRecord {
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

function photoBytes(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error("Không thể đọc dữ liệu ảnh để lưu"));
    reader.onabort = () => reject(new Error("Đọc dữ liệu ảnh bị gián đoạn"));
    reader.readAsArrayBuffer(blob);
  });
}

async function storedPhotos(photos: readonly StoredPhoto[]): Promise<StoredPhoto[]> {
  return Promise.all(photos.map(async (photo) => {
    const blob = photo.blob instanceof Blob ? await photoBytes(photo.blob) : photo.blob;
    if (blob.byteLength !== photo.size) throw new Error("Không thể đọc đầy đủ dữ liệu ảnh để lưu");
    return { ...photo, blob };
  }));
}

function readableRecord(record: StoredRecord): PilotRecord {
  return {
    ...record,
    photos: record.photos.map((photo) => ({
      ...photo,
      blob: photo.blob instanceof Blob ? photo.blob : new Blob([photo.blob], { type: photo.mimeType }),
    })),
  };
}

async function preparePhotoWrites(recordIds: readonly string[]) {
  const db = await database();
  const prepared = new Map<string, StoredPhoto[]>();
  // File reads must finish before starting a write transaction (Safari can
  // auto-close transactions while non-IDB asynchronous work is pending).
  for (const id of recordIds) {
    const record = await db.get("records", id);
    if (record) prepared.set(id, await storedPhotos(record.photos));
  }
  return prepared;
}

function photosForWrite(current: StoredRecord, prepared: ReadonlyMap<string, StoredPhoto[]>): StoredPhoto[] {
  if (current.photos.every(({ blob }) => !(blob instanceof Blob))) return current.photos;
  const photos = prepared.get(current.id);
  if (!photos || photos.length !== current.photos.length || photos.some((photo, index) => {
    const latest = current.photos[index];
    return !latest || photo.id !== latest.id || photo.size !== latest.size || photo.mimeType !== latest.mimeType;
  })) {
    throw new Error("Ảnh của phiếu vừa thay đổi. Vui lòng thử lại thao tác.");
  }
  return current.photos.map((photo, index) => ({ ...photo, blob: photos[index]!.blob }));
}

export async function loadPilotRecords() {
  const db = await database();
  const records: PilotRecord[] = [];
  // Decode one record at a time instead of retaining every raw image buffer
  // alongside its restored Blob while hydrating a large history.
  let cursor = await db.transaction("records").store.openCursor();
  while (cursor) {
    records.push(readableRecord(cursor.value));
    cursor = await cursor.continue();
  }
  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function savePilotRecord(record: DemoRecord, trashState: "active" | "trash" = "active") {
  const db = await database();
  const previous = await db.get("records", record.id);
  const stored = toPilotRecord(record, trashState, previous);
  const photos = await storedPhotos(stored.photos);
  await db.put("records", { ...stored, photos });
  return stored;
}

export async function patchPilotRecords(
  recordIds: readonly string[],
  patch: Partial<Pick<PilotRecord, "approvalStatus" | "deletedAt" | "lastExportedAt" | "trashState">>,
) {
  const db = await database();
  const photos = await preparePhotoWrites(recordIds);
  const transaction = db.transaction("records", "readwrite");
  void transaction.done.catch(() => {});
  const now = new Date().toISOString();
  try {
    for (const recordId of recordIds) {
      const current = await transaction.store.get(recordId);
      if (!current) continue;
      await transaction.store.put({ ...current, ...patch, photos: photosForWrite(current, photos), updatedAt: now });
    }
    await transaction.done;
  } catch (error) {
    try { transaction.abort(); } catch { /* Already aborted/finished. */ }
    await transaction.done.catch(() => {});
    throw error;
  }
}

export async function recordPilotExport(kind: KphKind, records: readonly DemoRecord[], fileName: string) {
  const db = await database();
  const photos = await preparePhotoWrites(records.map(({ id }) => id));
  const transaction = db.transaction(["export_runs", "records"], "readwrite");
  void transaction.done.catch(() => {});
  const createdAt = new Date().toISOString();
  const run: PilotExportRun = {
    id: globalThis.crypto?.randomUUID?.() ?? `export-${Date.now()}`,
    kind,
    recordIds: records.map(({ id }) => id),
    fileName,
    createdAt,
    templateVersion: "BM-331.CF-01",
  };
  try {
    await transaction.objectStore("export_runs").put(run);
    for (const record of records) {
      const current = await transaction.objectStore("records").get(record.id);
      if (current) await transaction.objectStore("records").put({ ...current, photos: photosForWrite(current, photos), lastExportedAt: createdAt, updatedAt: createdAt });
    }
    await transaction.done;
  } catch (error) {
    try { transaction.abort(); } catch { /* Already aborted/finished. */ }
    await transaction.done.catch(() => {});
    throw error;
  }
  return run;
}

export async function getPilotExportRuns() {
  const db = await database();
  return db.getAllFromIndex("export_runs", "by-created-at");
}

export async function setPilotSetting(key: string, value: unknown) {
  await setPilotSettings([{ key, value }]);
}

export async function setPilotSettings(settings: readonly { key: string; value: unknown }[]) {
  await transactPilotSettings([], () => ({ writes: settings, result: undefined }));
}

export async function transactPilotSettings<T>(
  keys: readonly string[],
  update: (current: ReadonlyMap<string, unknown>) => { writes: readonly { key: string; value: unknown }[]; result: T },
): Promise<T> {
  const db = await database();
  const transaction = db.transaction("settings", "readwrite");
  const current = new Map<string, unknown>();
  for (const key of keys) {
    current.set(key, (await transaction.store.get(key))?.value);
  }
  const { writes, result } = update(current);
  const updatedAt = new Date().toISOString();
  for (const { key, value } of writes) {
    await transaction.store.put({ key, value, updatedAt });
  }
  await transaction.done;
  return result;
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
