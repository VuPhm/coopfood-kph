import type { components } from "@coopfood-kph/api";
import type { RecordView } from "./record-view";
import type { StoreProfile } from "./store-profile";

// Synthetic, memory-only fixtures. Never used by the online application.
export const mockProfile: StoreProfile = {
  storeCode: "0001", storeName: "Cửa hàng mẫu", fullName: "Nguyễn Minh An",
  employeeCode: "DEMO-001", role: "STORE_MANAGER",
};

export const mockRecords: RecordView[] = [
  { id: "mock-tpts-1", kind: "TPTS", productName: "Cải thìa VietGAP 500 g", sku: "0011730", supplier: "Nông sản Miền Đông", detectedDate: "15/08/2026", detectedBy: mockProfile.fullName, quantity: "1.5 kg", quantityValue: 1.5, unit: "kg", condition: "Dập úng", resolution: "Hủy", treatmentDate: "", approvalStatus: "APPROVED", reviewedBy: "Quản lý mẫu", photos: [] },
  { id: "mock-tpcn-1", kind: "TPCN", productName: "Cá hộp sốt cà chua 155 g", sku: "0008421", supplier: "Nhà cung cấp mẫu", detectedDate: "15/08/2026", detectedBy: mockProfile.fullName, quantity: "2 EA", quantityValue: 2, unit: "EA", condition: "Rách bao bì", resolution: "Xuất trả", treatmentDate: "", approvalStatus: "PENDING", photos: [] },
];

export async function mockBarcodeLookup(barcode: string): Promise<components["schemas"]["BarcodeLookupResponse"]> {
  if (barcode === "0000000000000") throw new Error("Chưa thể tra cứu danh mục. Thử lại hoặc nhập tay; mã đã quét được giữ lại.");
  if (barcode !== "29123415005") return { status: "NOT_FOUND", barcode };
  return {
    status: "FOUND", barcode,
    product: { id: "synthetic-product-1", barcode, skuCode: "0011730", name: "Cải thìa VietGAP 500 g", primarySupplier: { code: "NCC001", name: "Nông sản Miền Đông" } },
  };
}
