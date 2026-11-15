import type { KphKind } from "@coopfood-kph/kph-rules";
import { formatBusinessDate } from "./business-date";
import { OnlineApiError, onlineExportSelectionError, type OnlineExportBundle } from "./online-kph";
import type { RecordView } from "./record-view";

// The bundle is already authorized/audited by the server. Hydrate its private
// stamped images before building the workbook; never fall back to list data.
export async function downloadOnlineKphExport(bundle: OnlineExportBundle, kind: KphKind, stillCurrent: () => boolean): Promise<boolean> {
  if (!stillCurrent()) return false;
  const limitError = onlineExportSelectionError(bundle.records.length);
  if (limitError) throw new Error(limitError);
  if (!bundle.records.length || new Set(bundle.records.map(record => record.id)).size !== bundle.records.length
    || bundle.records.some(record => record.kind !== kind || record.approvalStatus !== "APPROVED"
      || record.photos.length < 1 || record.photos.length > 3
      || record.photos.some((photo, index) => photo.src !== `/api/v1/stores/${bundle.store.id}/kph/${record.id}/photos/${index + 1}`))) {
    throw new Error("Dữ liệu xuất phiếu không hợp lệ. Hãy tải lại danh sách và thử lại.");
  }
  const records: RecordView[] = [];
  for (const record of bundle.records) {
    const photos = [];
    for (const photo of record.photos) {
      let response: Response;
      try { response = await fetch(photo.src, { credentials: "same-origin", cache: "no-store" }); }
      catch {
        if (!stillCurrent()) return false;
        throw new Error("Không thể tải ảnh minh chứng. Hãy kiểm tra kết nối và thử lại.");
      }
      if (!stillCurrent()) return false;
      if (!response.ok) throw new OnlineApiError(`Không thể tải ảnh minh chứng (${response.status}). Hãy thử lại.`, response.status);
      let blob: Blob;
      try { blob = await response.blob(); }
      catch {
        if (!stillCurrent()) return false;
        throw new Error("Không thể đọc ảnh minh chứng. Hãy thử lại.");
      }
      if (!stillCurrent()) return false;
      if (blob.type !== "image/jpeg" || !blob.size) throw new Error("Ảnh minh chứng không hợp lệ. Chưa tạo file Excel.");
      photos.push({ ...photo, blob });
    }
    records.push({ ...record, photos });
  }
  const { buildKphWorkbook } = await import("./excel-export");
  if (!stillCurrent()) return false;
  const workbook = await buildKphWorkbook(kind, records, { storeCode: bundle.store.code, storeName: bundle.store.name });
  if (!stillCurrent()) return false;
  const buffer = await workbook.xlsx.writeBuffer();
  if (!stillCurrent()) return false;
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    const typeName = kind === "TPCN" ? "Thuc_pham_kho_va_khac" : "Thuc_pham_tuoi_song";
    const date = formatBusinessDate(new Date()).display.replaceAll("/", "-");
    anchor.href = url;
    anchor.download = `Phieu_Theo_Doi_Hang_KPH_${typeName}_${date}.xlsx`;
    if (!stillCurrent()) return false;
    document.body.append(anchor);
    anchor.click();
    return true;
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
