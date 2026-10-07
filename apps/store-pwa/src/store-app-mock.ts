import type { components } from "@coopfood-kph/api";
import type { RecordView } from "./record-view";
import type { StoreProfile } from "./store-profile";

// Synthetic, memory-only fixtures. Never used by the online application.
export const mockProfile: StoreProfile = {
  storeCode: "0001", storeName: "Cửa hàng mẫu", fullName: "Nguyễn Minh An",
  employeeCode: "DEMO-001", role: "STORE_MANAGER",
};

const generatedKphRecords: RecordView[] = Array.from({ length: 56 }, (_, index) => {
  const kind = index % 2 === 0 ? "TPCN" : "TPTS";
  const number = Math.floor(index / 2) + 1;
  const condition = kind === "TPCN"
    ? ["Cận date", "Hết HSD", "Rách bao bì", "Xì chân không", "Khác"][(number - 1) % 5]!
    : ["Dập úng", "Thối mốc", "Cận date", "Hết HSD", "Khác"][(number - 1) % 5]!;
  const dayDate = new Date(Date.UTC(2026, 7, 15 - number));
  const detectedDate = `${String(dayDate.getUTCDate()).padStart(2, "0")}/${String(dayDate.getUTCMonth() + 1).padStart(2, "0")}/${dayDate.getUTCFullYear()}`;
  const approvalStatus = (["APPROVED", "PENDING", "REJECTED"] as const)[(number - 1) % 3]!;
  return {
    id: `mock-${kind.toLowerCase()}-${number}`, kind,
    productName: `${kind === "TPCN" ? "Hàng khô" : "Nông sản"} mẫu ${String(number).padStart(2, "0")}`,
    sku: `${kind === "TPCN" ? "00" : "01"}${String(number).padStart(5, "0")}`,
    supplier: "Nhà cung cấp mẫu", detectedDate, detectedBy: mockProfile.fullName,
    quantity: `${number % 4 + 1} ${kind === "TPCN" ? "EA" : "kg"}`,
    quantityValue: number % 4 + 1, unit: kind === "TPCN" ? "EA" : "kg",
    condition, resolution: kind === "TPCN" ? (["Hủy", "Đổi", "Xuất trả", "Khác"] as const)[(number - 1) % 4]! : (["Hủy", "Khác"] as const)[(number - 1) % 2]!,
    treatmentDate: "", approvalStatus, photos: [],
  };
});

export const mockRecords: RecordView[] = [
  { id: "mock-tpts-1", kind: "TPTS", productName: "Cải thìa VietGAP 500 g", sku: "0011730", supplier: "Nông sản Miền Đông", detectedDate: "15/08/2026", detectedBy: mockProfile.fullName, quantity: "1.5 kg", quantityValue: 1.5, unit: "kg", condition: "Dập úng", resolution: "Hủy", treatmentDate: "", approvalStatus: "APPROVED", reviewedBy: "Quản lý mẫu", photos: [] },
  { id: "mock-tpcn-1", kind: "TPCN", productName: "Cá hộp sốt cà chua 155 g", sku: "0008421", supplier: "Nhà cung cấp mẫu", detectedDate: "15/08/2026", detectedBy: mockProfile.fullName, quantity: "2 EA", quantityValue: 2, unit: "EA", condition: "Rách bao bì", resolution: "Xuất trả", treatmentDate: "", approvalStatus: "PENDING", photos: [] },
  ...generatedKphRecords,
];

export type MockDateLotStatus = "open" | "acknowledged" | "resolved";
export const mockDateLots: { id: string; name: string; sku: string; date: `${number}-${number}-${number}`; status: MockDateLotStatus }[] = [
  { id: "C24-118", name: "Sản phẩm C", sku: "089332", date: "2026-10-07", status: "open" },
  { id: "D24-090", name: "Sản phẩm D", sku: "071204", date: "2026-10-12", status: "open" },
  { id: "A24-008", name: "Sản phẩm A", sku: "000008", date: "2026-10-20", status: "acknowledged" },
  { id: "B24-011", name: "Sản phẩm B", sku: "000011", date: "2026-10-25", status: "acknowledged" },
];

export async function mockBarcodeLookup(barcode: string): Promise<components["schemas"]["BarcodeLookupResponse"]> {
  if (barcode === "0000000000000") throw new Error("Chưa thể tra cứu danh mục. Thử lại hoặc nhập tay; mã đã quét được giữ lại.");
  if (barcode === "8936000123456") return {
    status: "FOUND", barcode,
    product: { id: "synthetic-product-2", barcode, skuCode: "0008421", name: "Bánh quy bơ hộp 300 g", primarySupplier: { code: "NCC001", name: "Công ty Thực phẩm An Việt" } },
  };
  if (barcode !== "29123415005") return { status: "NOT_FOUND", barcode };
  return {
    status: "FOUND", barcode,
    product: { id: "synthetic-product-1", barcode, skuCode: "0011730", name: "Cải thìa VietGAP 500 g", primarySupplier: { code: "NCC001", name: "Nông sản Miền Đông" } },
  };
}
