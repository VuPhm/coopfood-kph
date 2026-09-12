import type { KphKind } from "@coopfood-kph/kph-rules";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type RecordView = {
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
  approvalStatus: ApprovalStatus;
  photos: readonly EvidencePhotoView[];
  note?: string;
  createdAt?: string;
  lastExportedAt?: string | null;
};

export type EvidencePhotoView = {
  id: string;
  src: string;
  alt: string;
  blob?: Blob;
  fileName?: string;
};

export const approvalLabels: Record<ApprovalStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Không duyệt",
};
