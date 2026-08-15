import type { KphKind } from "@coopfood-kph/kph-rules";

export type DemoRecord = {
  id: string;
  kind: KphKind;
  detectedDate: string;
  detectedBy: string;
  sku: string;
  productName: string;
  supplier: string;
  quantity: string;
  condition: string;
  resolution: string;
  photos: number;
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
    condition: "Cận date",
    resolution: "ĐỔI",
    photos: 2,
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
    condition: "Hư hỏng",
    resolution: "HỦY",
    photos: 1,
  },
];
