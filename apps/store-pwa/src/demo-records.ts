import type { KphKind } from "@coopfood-kph/kph-rules";

import { assetUrl } from "./asset-url";

export type DemoApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type DemoRecord = {
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
  photos: readonly DemoPhoto[];
  note?: string;
};

export type DemoPhoto = {
  id: string;
  src: string;
  alt: string;
  blob?: Blob;
};

export const DEMO_RECORDS: readonly DemoRecord[] = [
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
      { id: "cookie-front", src: assetUrl("demo/evidence-cookie-front.svg"), alt: "Mặt trước hộp bánh quy tại quầy" },
      { id: "cookie-expiry", src: assetUrl("demo/evidence-cookie-expiry.svg"), alt: "Thông tin hạn dùng trên hộp bánh quy" },
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
      { id: "vegetable-damage", src: assetUrl("demo/evidence-vegetable.svg"), alt: "Tình trạng cải thìa tại quầy" },
    ],
    note: "Dập úa lá ngoài khi kiểm hàng đầu ca sáng.",
  },
];
