import { addDays, calculateShelfLife, daysBetween, type LocalDate } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "../business-date";

export type DemoActor = "employee" | "manager";
export type SessionStatus = "IN_PROGRESS" | "SUBMITTED" | "APPROVED" | "RECOUNT_REQUIRED";
export type DateBand = "OVER_70" | "50_70" | "20_50" | "UNDER_20";
export type DemoProduct = { id: string; sku: string; barcode: string; name: string; group: string; unit: string; supplier: string; location: string };
export type DemoLot = { id: string; productId: string; nsx: LocalDate; hsd: LocalDate; quantity: number };
export type StocktakeEntry = { productId: string; systemQuantity: number; actualQuantity: number; reason: string; note: string };
export type StocktakeSession = { id: string; date: LocalDate; employee: string; status: SessionStatus; entries: StocktakeEntry[] };
export type InventoryAdjustment = { id: string; sessionId: string; productId: string; delta: number; date: LocalDate; source: "STOCKTAKE"; status: "APPROVED" };
export type DemoState = { lots: DemoLot[]; sessions: StocktakeSession[]; adjustments: InventoryAdjustment[] };
export const demoToday = () => formatBusinessDate(new Date()).iso;
export const demoProducts: readonly DemoProduct[] = [
  { id: "milk", sku: "SP000123", barcode: "8938501434012", name: "Sữa tươi TH true milk 1L", group: "Sữa & sản phẩm lạnh", unit: "Hộp", supplier: "TH Food", location: "Kệ lạnh A1" },
  { id: "bread", sku: "SP000124", barcode: "8935001712345", name: "Bánh mì sandwich 300g", group: "Bánh & thực phẩm nhanh", unit: "Gói", supplier: "ABC Bakery", location: "Kệ B2" },
  { id: "water", sku: "SP000125", barcode: "8936036021190", name: "Nước suối 500ml", group: "Nước giải khát", unit: "Chai", supplier: "Co.op Select", location: "Kệ C1" },
  { id: "eggs", sku: "SP000126", barcode: "8934563120019", name: "Trứng gà hộp 10 quả", group: "Thực phẩm tươi", unit: "Hộp", supplier: "V.Food", location: "Kệ mát A3" },
  { id: "greens", sku: "SP000127", barcode: "8938505970042", name: "Rau cải thìa VietGAP 500g", group: "Rau củ quả", unit: "Gói", supplier: "Nông trại Xanh", location: "Quầy rau R2" },
  { id: "noodles", sku: "SP000128", barcode: "8934822107761", name: "Mì ăn liền bò hầm", group: "Thực phẩm khô", unit: "Gói", supplier: "Masan", location: "Kệ D4" },
];
export function createDemoState(today = demoToday()): DemoState {
  const lot = (id: string, productId: string, quantity: number, age: number, remaining: number): DemoLot => ({
    id, productId, quantity, nsx: addDays(today, -age), hsd: addDays(today, remaining),
  });
  return {
    lots: [
      lot("LO-TH-01", "milk", 20, 70, 30), lot("LO-TH-02", "milk", 4, 15, 85),
      lot("LO-BM-01", "bread", 18, 8, 2), lot("LO-NS-01", "water", 48, 100, 260),
      lot("LO-TG-01", "eggs", 15, 23, 7), lot("LO-RA-01", "greens", 12, 3, 2),
      lot("LO-MI-01", "noodles", 36, 80, 100),
    ],
    sessions: [{
      id: `KK-${today.replaceAll("-", "")}-01`, date: today, employee: "Trần Minh Anh", status: "SUBMITTED",
      entries: [
        { productId: "bread", systemQuantity: 18, actualQuantity: 17, reason: "Hao hụt", note: "Đối chiếu cuối ca" },
        { productId: "water", systemQuantity: 48, actualQuantity: 48, reason: "", note: "" },
      ],
    }],
    adjustments: [],
  };
}
export function inventoryQuantity(state: DemoState, productId: string) {
  return state.lots.filter((lot) => lot.productId === productId).reduce((sum, lot) => sum + lot.quantity, 0);
}
export function lotDate(lot: DemoLot, today = demoToday()) {
  const rule = calculateShelfLife(lot.nsx, lot.hsd, today);
  const elapsed = Math.max(0, daysBetween(lot.nsx, today));
  const percent = Math.min(100, Math.round(elapsed / rule.shelfLifeDays * 100));
  const band: DateBand = percent > 70 ? "OVER_70" : percent >= 50 ? "50_70" : percent >= 20 ? "20_50" : "UNDER_20";
  return { ...rule, percent, band };
}
export const signed = (value: number) => value > 0 ? `+${value}` : String(value);
export function saveEntry(state: DemoState, sessionId: string, entry: StocktakeEntry): DemoState {
  return { ...state, sessions: state.sessions.map((session) => session.id !== sessionId ? session : {
    ...session, status: "IN_PROGRESS",
    entries: [...session.entries.filter((current) => current.productId !== entry.productId), entry],
  }) };
}
export function decideSession(state: DemoState, sessionId: string, decision: "APPROVED" | "RECOUNT_REQUIRED"): DemoState {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.status !== "SUBMITTED") return state;
  if (decision === "RECOUNT_REQUIRED") return {
    ...state, sessions: state.sessions.map((item) => item.id === sessionId ? { ...item, status: decision, entries: [] } : item),
  };
  const adjustments: InventoryAdjustment[] = session.entries.filter((entry) => entry.actualQuantity !== entry.systemQuantity).map((entry) => ({
    id: `${session.id}-${entry.productId}`, sessionId, productId: entry.productId,
    delta: entry.actualQuantity - entry.systemQuantity, date: demoToday(), source: "STOCKTAKE", status: "APPROVED",
  }));
  const remaining = new Map(adjustments.map((item) => [item.productId, item.delta]));
  const lots = state.lots.map((lot) => {
    const delta = remaining.get(lot.productId) ?? 0;
    if (delta === 0) return lot;
    const applied = delta < 0 ? Math.max(-lot.quantity, delta) : delta;
    remaining.set(lot.productId, delta - applied);
    return { ...lot, quantity: lot.quantity + applied };
  });
  return {
    lots, adjustments: [...state.adjustments, ...adjustments],
    sessions: state.sessions.map((item) => item.id === sessionId ? { ...item, status: decision } : item),
  };
}
