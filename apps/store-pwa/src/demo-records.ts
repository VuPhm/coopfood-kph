import type { RecordView } from "./record-view";

const DEMO_PHOTO_SRC = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E";

export const DEMO_RECORDS: readonly RecordView[] = [
  {
    id: "KPH-260815-018",
    kind: "TPCN",
    detectedDate: "15/08/2026",
    detectedBy: "Nguyễn Minh An",
    sku: "0008421",
    productName: "Bánh quy bơ hộp 300 g",
    supplier: "NCC-0042 · Công ty Thực phẩm An Việt",
    quantity: "2 EA",
    quantityValue: 2,
    unit: "EA",
    condition: "Cận date",
    resolution: "ĐỔI",
    treatmentDate: "16/08/2026",
    approvalStatus: "PENDING",
    photos: [
      { id: "cookie-front", src: DEMO_PHOTO_SRC, alt: "Mặt trước hộp bánh quy tại quầy" },
      { id: "cookie-expiry", src: DEMO_PHOTO_SRC, alt: "Thông tin hạn dùng trên hộp bánh quy" },
    ],
    note: "Hàng cận hạn dùng còn 3 ngày, đã liên hệ NCC đổi lô mới.",
  },
  {
    id: "KPH-260815-017",
    kind: "TPTS",
    detectedDate: "15/08/2026",
    detectedBy: "Trần Gia Hân",
    sku: "0011730",
    productName: "Cải thìa VietGAP 500 g",
    supplier: "NCC-0108 · Nông sản Miền Đông",
    quantity: "1.5 kg",
    quantityValue: 1.5,
    unit: "kg",
    condition: "Dập úng",
    resolution: "HỦY",
    treatmentDate: "15/08/2026",
    approvalStatus: "APPROVED",
    photos: [
      { id: "vegetable-damage", src: DEMO_PHOTO_SRC, alt: "Tình trạng cải thìa tại quầy" },
    ],
    note: "Dập úa lá ngoài khi kiểm hàng đầu ca sáng.",
  },
];
