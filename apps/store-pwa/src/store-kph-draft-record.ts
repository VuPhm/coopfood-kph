import type { CreatedRecordDraft } from "./create-record-dialog";
import type { RecordView } from "./record-view";
// Shared by the two in-session Store entry points; online persistence is separate.
export function kphRecordFromDraft(draft: CreatedRecordDraft): RecordView {
  return {
      id: draft.idempotencyKey ?? crypto.randomUUID(), kind: draft.kind,
      detectedDate: draft.detectedDate, detectedBy: draft.detectedBy,
      sku: draft.skuCode ?? "", barcode: draft.barcode, productName: draft.productName, supplier: draft.supplier,
      quantity: `${draft.quantity} ${draft.unit}`, quantityValue: draft.quantity, unit: draft.unit,
      condition: draft.condition, resolution: draft.resolution, treatmentDate: draft.treatmentDate,
      approvalStatus: "PENDING", note: draft.note,
      photos: draft.photos.map((p, i) => ({ id: p.id, blob: p.blob, originalFile: p.originalFile, capturedAt: p.capturedAt.toISOString(), fileName: p.fileName, src: URL.createObjectURL(p.blob), alt: `Ảnh minh chứng ${i + 1}` })),
  };
}
