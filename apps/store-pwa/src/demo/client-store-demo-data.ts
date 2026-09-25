import { addDays, calculateShelfLife, daysBetween, type LocalDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "../business-date";

export type DemoActor = "employee" | "manager";
export type DateBand = "OVER_70" | "50_70" | "20_50" | "UNDER_20";
export type DemoProduct = { id: string; sku: string; barcode: string; name: string; group: string; unit: string; supplier: string; location: string };
export type DemoLot = { id: string; productId: string; nsx: LocalDate; hsd: LocalDate; quantity: number; lotCode?: string; receivedOn?: LocalDate };
export type InventoryReferenceRow = { productId: string; sku: string; quantity: number };
export type InventoryReferenceSnapshot = {
  id: string;
  sourceFile: string;
  sourceApp: string;
  importedAt: string;
  mapping: "DEMO_ONLY_SKU_REFERENCE_QUANTITY_V1";
  rows: InventoryReferenceRow[];
};
export type InventoryCheckLog = {
  id: string;
  productId: string;
  referenceQuantity: number;
  externalReferenceQuantity: number;
  referenceBasis: "INVENTORY_SNAPSHOT" | "LATEST_CHECK";
  actualQuantity: number;
  difference: number;
  checkerName: string;
  checkedAt: string;
  reason?: string;
  note?: string;
  referenceSnapshotId: string;
  referenceSourceFile: string;
};
export type DemoState = {
  lots: DemoLot[];
  inventoryReferenceSnapshots: InventoryReferenceSnapshot[];
  activeInventoryReferenceSnapshotId: string;
  inventoryCheckLogs: InventoryCheckLog[];
};
export const demoToday = () => formatBusinessDate(new Date()).iso;
export const demoProducts: readonly DemoProduct[] = [
  { id: "milk", sku: "SP000123", barcode: "8938501434012", name: "Sữa tươi TH true milk 1L", group: "Sữa & sản phẩm lạnh", unit: "Hộp", supplier: "TH Food", location: "Kệ lạnh A1" },
  { id: "bread", sku: "SP000124", barcode: "8935001712345", name: "Bánh mì sandwich 300g", group: "Bánh & thực phẩm nhanh", unit: "Gói", supplier: "ABC Bakery", location: "Kệ B2" },
  { id: "water", sku: "SP000125", barcode: "8936036021190", name: "Nước suối 500ml", group: "Nước giải khát", unit: "Chai", supplier: "Co.op Select", location: "Kệ C1" },
  { id: "eggs", sku: "SP000126", barcode: "8934563120019", name: "Trứng gà hộp 10 quả", group: "Thực phẩm tươi", unit: "Hộp", supplier: "V.Food", location: "Kệ mát A3" },
  { id: "greens", sku: "SP000127", barcode: "8938505970042", name: "Rau cải thìa VietGAP 500g", group: "Rau củ quả", unit: "Gói", supplier: "Nông trại Xanh", location: "Quầy rau R2" },
  { id: "noodles", sku: "SP000128", barcode: "8934822107761", name: "Mì ăn liền bò hầm", group: "Thực phẩm khô", unit: "Gói", supplier: "Masan", location: "Kệ D4" },
];

const demoReferenceRows: InventoryReferenceRow[] = [
  { productId: "milk", sku: "SP000123", quantity: 24 },
  { productId: "bread", sku: "SP000124", quantity: 18 },
  { productId: "water", sku: "SP000125", quantity: 48 },
  { productId: "eggs", sku: "SP000126", quantity: 15 },
  { productId: "greens", sku: "SP000127", quantity: 12 },
  { productId: "noodles", sku: "SP000128", quantity: 36 },
];

export function createDemoState(today = demoToday()): DemoState {
  const lot = (id: string, productId: string, quantity: number, age: number, remaining: number): DemoLot => ({
    id, productId, quantity, nsx: addDays(today, -age), hsd: addDays(today, remaining),
  });
  const initialSnapshot: InventoryReferenceSnapshot = {
    id: `DEMO-INV-${today.replaceAll("-", "")}-01`, sourceFile: "inventory-reference-demo.csv",
    sourceApp: "Ứng dụng quản lý tồn kho riêng (fixture demo)", importedAt: `${today}T08:00:00+07:00`,
    mapping: "DEMO_ONLY_SKU_REFERENCE_QUANTITY_V1", rows: demoReferenceRows.map((row) => ({ ...row })),
  };
  return {
    lots: [
      lot("LO-TH-01", "milk", 20, 70, 30), lot("LO-TH-02", "milk", 4, 15, 85),
      lot("LO-BM-01", "bread", 18, 8, 2), lot("LO-NS-01", "water", 48, 100, 260),
      lot("LO-TG-01", "eggs", 15, 23, 7), lot("LO-RA-01", "greens", 12, 3, 2),
      lot("LO-MI-01", "noodles", 36, 80, 100),
    ],
    inventoryReferenceSnapshots: [initialSnapshot],
    activeInventoryReferenceSnapshotId: initialSnapshot.id,
    inventoryCheckLogs: [{
    id: `CHECK-${today.replaceAll("-", "")}-001`, productId: "bread", referenceQuantity: 18, externalReferenceQuantity: 18, referenceBasis: "INVENTORY_SNAPSHOT",
      actualQuantity: 17, difference: -1, checkerName: "Trần Minh Anh", checkedAt: `${today}T08:12:00+07:00`,
      reason: "Hao hụt", note: "Đối chiếu cuối ca", referenceSnapshotId: initialSnapshot.id,
      referenceSourceFile: initialSnapshot.sourceFile,
    }],
  };
}

export function inventoryQuantity(state: DemoState, productId: string) {
  return state.lots.filter((lot) => lot.productId === productId).reduce((sum, lot) => sum + lot.quantity, 0);
}
export const lotLabel = (lot: DemoLot) => lot.lotCode || lot.id;

export function activeInventoryReferenceSnapshot(state: DemoState) {
  return state.inventoryReferenceSnapshots.find((snapshot) => snapshot.id === state.activeInventoryReferenceSnapshotId);
}
export function inventoryReferenceQuantity(state: DemoState, productId: string) {
  return activeInventoryReferenceSnapshot(state)?.rows.find((row) => row.productId === productId)?.quantity;
}
export function latestInventoryCheck(state: DemoState, productId: string) {
  return state.inventoryCheckLogs.filter((log) => log.productId === productId).at(-1);
}
export function latestCheckedQuantity(state: DemoState, productId: string) {
  return latestInventoryCheck(state, productId)?.actualQuantity;
}

export type DemoReferenceImportError = { row: number; message: string };
export function parseDemoInventoryReferenceCsv(text: string): { rows: InventoryReferenceRow[]; errors: DemoReferenceImportError[] } {
  const matrix: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]!;
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"' && cell.length === 0) quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); matrix.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (quoted) return { rows: [], errors: [{ row: 1, message: "CSV có dấu ngoặc kép chưa đóng." }] };
  if (cell.length > 0 || row.length > 0) { row.push(cell); matrix.push(row); }
  const nonEmpty = matrix.filter((cells) => cells.some((value) => value.trim() !== ""));
  const header = nonEmpty[0]?.map((value) => value.trim().replace(/^\uFEFF/, "").toLocaleLowerCase("en-US"));
  if (header?.[0] !== "sku" || header?.[1] !== "reference quantity" || header.length !== 2) {
    return { rows: [], errors: [{ row: 1, message: 'Mapping demo yêu cầu đúng hai cột "SKU,Reference quantity".' }] };
  }
  const errors: DemoReferenceImportError[] = [];
  const rows: InventoryReferenceRow[] = [];
  const seen = new Set<string>();
  for (const [index, cells] of nonEmpty.slice(1).entries()) {
    const rowNumber = index + 2;
    const sku = cells[0]?.trim() ?? "";
    const quantityText = cells[1]?.trim() ?? "";
    const item = demoProducts.find((candidate) => candidate.sku === sku);
    const quantity = Number(quantityText);
    if (cells.length !== 2 || !item || !/^\d+$/.test(quantityText) || !Number.isSafeInteger(quantity)) {
      errors.push({ row: rowNumber, message: !item ? "SKU demo không được nhận diện: " + (sku || "(trống)") + "." : "Cần đúng 2 cột và số lượng nguyên từ 0 trở lên." });
      continue;
    }
    if (seen.has(sku)) { errors.push({ row: rowNumber, message: "SKU bị lặp: " + sku + "." }); continue; }
    seen.add(sku);
    rows.push({ productId: item.id, sku, quantity });
  }
  if (rows.length === 0 && errors.length === 0) errors.push({ row: 2, message: "CSV không có dòng sản phẩm." });
  return { rows, errors };
}

export function importDemoInventoryReference(state: DemoState, fileName: string, csvText: string, importedAt = new Date().toISOString()): { state: DemoState; errors: DemoReferenceImportError[] } {
  const parsed = parseDemoInventoryReferenceCsv(csvText);
  if (parsed.errors.length) return { state, errors: parsed.errors };
  const sequence = state.inventoryReferenceSnapshots.length + 1;
  const snapshot: InventoryReferenceSnapshot = {
    id: "DEMO-INV-" + demoToday().replaceAll("-", "") + "-" + String(sequence).padStart(2, "0"),
    sourceFile: fileName, sourceApp: "Ứng dụng quản lý tồn kho riêng (import demo)", importedAt,
    mapping: "DEMO_ONLY_SKU_REFERENCE_QUANTITY_V1", rows: parsed.rows.map((item) => ({ ...item })),
  };
  return {
    state: { ...state, inventoryReferenceSnapshots: [...state.inventoryReferenceSnapshots, snapshot], activeInventoryReferenceSnapshotId: snapshot.id },
    errors: [],
  };
}

export function recordInventoryCheck(state: DemoState, input: {
  productId: string; actualQuantity: number; checkerName: string; checkedAt?: string; reason?: string; note?: string;
}): DemoState {
  const snapshot = activeInventoryReferenceSnapshot(state);
  const reference = snapshot?.rows.find((row) => row.productId === input.productId);
  if (!snapshot || !reference) throw new Error("Hãy nạp snapshot có SKU này trước khi ghi nhận.");
  if (!Number.isSafeInteger(input.actualQuantity) || input.actualQuantity < 0) throw new Error("Số thực tế phải là số nguyên từ 0 trở lên.");
  const id = "CHECK-" + demoToday().replaceAll("-", "") + "-" + String(state.inventoryCheckLogs.length + 1).padStart(3, "0");
  const previous = latestInventoryCheck(state, input.productId);
  const comparisonQuantity = previous?.actualQuantity ?? reference.quantity;
  const log: InventoryCheckLog = {
    id, productId: input.productId, referenceQuantity: comparisonQuantity, externalReferenceQuantity: reference.quantity,
    referenceBasis: previous ? "LATEST_CHECK" : "INVENTORY_SNAPSHOT", actualQuantity: input.actualQuantity,
    difference: input.actualQuantity - comparisonQuantity, checkerName: input.checkerName,
    checkedAt: input.checkedAt ?? new Date().toISOString(), ...(input.reason ? { reason: input.reason } : {}),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}), referenceSnapshotId: snapshot.id,
    referenceSourceFile: snapshot.sourceFile,
  };
  return { ...state, inventoryCheckLogs: [...state.inventoryCheckLogs, log] };
}

export type ReceiveLotInput = {
  productId: string;
  nsx: LocalDate;
  hsd: LocalDate;
  receivedOn: LocalDate;
  quantity: number;
  lotCode?: string;
};

export function receiveLot(state: DemoState, input: ReceiveLotInput, today = demoToday()): { state: DemoState; lot: DemoLot } {
  if (!demoProducts.some((item) => item.id === input.productId)) throw new Error("Sản phẩm không có trong danh mục demo.");
  calculateShelfLife(input.nsx, input.hsd, today);
  if (daysBetween(input.nsx, input.receivedOn) < 0) throw new Error("Ngày nhập phải từ ngày sản xuất trở đi.");
  if (daysBetween(input.receivedOn, today) < 0) throw new Error("Ngày nhập không được sau hôm nay.");
  if (!Number.isSafeInteger(input.quantity) || input.quantity <= 0) throw new Error("Số lượng phải là số nguyên lớn hơn 0.");
  const lotCode = input.lotCode?.trim();
  if (lotCode && lotCode.length > 40) throw new Error("Số lô tối đa 40 ký tự.");
  let sequence = 1;
  let id = "";
  do {
    id = "NH-" + today.replaceAll("-", "") + "-" + String(sequence++).padStart(2, "0");
  } while (state.lots.some((lot) => lot.id === id));
  const lot: DemoLot = { id, productId: input.productId, nsx: input.nsx, hsd: input.hsd,
    receivedOn: input.receivedOn, quantity: input.quantity, ...(lotCode ? { lotCode } : {}) };
  return { state: { ...state, lots: [...state.lots, lot] }, lot };
}

export function lotDate(lot: DemoLot, today = demoToday()) {
  const rule = calculateShelfLife(lot.nsx, lot.hsd, today);
  const elapsed = Math.max(0, daysBetween(lot.nsx, today));
  const percent = Math.min(100, Math.round(elapsed / rule.shelfLifeDays * 100));
  const band: DateBand = percent > 70 ? "OVER_70" : percent >= 50 ? "50_70" : percent >= 20 ? "20_50" : "UNDER_20";
  return { ...rule, percent, band };
}
export const signed = (value: number) => value > 0 ? `+${value}` : String(value);
