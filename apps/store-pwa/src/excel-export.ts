import type { KphKind } from "@coopfood-kph/kph-rules";
import type ExcelJS from "exceljs";

import { formatBusinessDate } from "./business-date";
import type { DemoPhoto, DemoRecord } from "./demo-records";

const STORE = { code: "CF-DEMO-001", name: "Nguyễn Kiệm" };
const COMPANY = "CÔNG TY TNHH MTV THỰC PHẨM SAIGON CO.OP";
const SHEET_NAMES: Record<KphKind, string> = {
  TPCN: "Thực phẩm khô & khác",
  TPTS: "Thực phẩm tươi sống",
};

export function escapeFormulaText(value: string) {
  const first = value.trimStart().charAt(0);
  return ["=", "+", "-", "@"].includes(first) ? `'${value}` : value;
}

function treatmentMark(record: DemoRecord, resolution: string) {
  return record.resolution.trim().toUpperCase() === resolution ? "X" : "";
}

function safeText(value: string) {
  return escapeFormulaText(value.trim());
}

function imageDimensions(source: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("Không thể đọc kích thước ảnh minh chứng"));
    image.src = source;
  });
}

async function normalizePhoto(photo: DemoPhoto) {
  let sourceBlob: Blob;
  if (photo.blob) {
    sourceBlob = photo.blob;
  } else {
    const response = await fetch(photo.src);
    if (!response.ok) throw new Error(`Không thể tải ảnh minh chứng (${response.status})`);
    sourceBlob = await response.blob();
  }
  const sourceUrl = URL.createObjectURL(sourceBlob);

  try {
    const dimensions = await imageDimensions(sourceUrl);
    if (sourceBlob.type === "image/png" || sourceBlob.type === "image/jpeg") {
      return { blob: sourceBlob, extension: sourceBlob.type === "image/png" ? "png" as const : "jpeg" as const, ...dimensions };
    }

    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Trình duyệt không hỗ trợ chuyển ảnh sang PNG");
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Không thể chuyển ảnh minh chứng sang PNG"));
      image.src = sourceUrl;
    });
    context.drawImage(image, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Không thể tạo ảnh PNG")), "image/png"));
    return { blob, extension: "png" as const, ...dimensions };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function fitImage(width: number, height: number) {
  const maxWidth = 64;
  const maxHeight = 132;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function buildKphWorkbook(kind: KphKind, records: readonly DemoRecord[]) {
  const module = await import("exceljs");
  const Excel = module.default;
  const workbook = new Excel.Workbook();
  workbook.creator = "Co.op Food KPH PWA";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(SHEET_NAMES[kind], {
    views: [{ showGridLines: true }],
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
    headerFooter: { oddFooter: "&L&IBM-331.CF&C&ILần ban hành: 01&R&ITrang &P / &N" },
  });

  [6, 14, 16, 28, 18, 8, 10, 24, 18, 7, 7, 11, 24, 14, 10, 10, 10, 20].forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  worksheet.getCell("A1").value = COMPANY;
  worksheet.getCell("A2").value = `CO.OP FOOD: ${STORE.name}`;
  worksheet.getCell("A3").value = `STORE: ${STORE.code}`;
  worksheet.mergeCells("A1:R1");
  worksheet.mergeCells("A2:R2");
  worksheet.mergeCells("A3:R3");
  worksheet.mergeCells("A5:R5");
  worksheet.getCell("A5").value = `PHIẾU THEO DÕI HÀNG KHÔNG PHÙ HỢP - ${SHEET_NAMES[kind].toUpperCase()}`;

  for (const rowNumber of [1, 2, 3]) {
    worksheet.getCell(`A${rowNumber}`).font = { name: "Times New Roman", size: 11, bold: rowNumber === 1 };
  }
  worksheet.getCell("A5").font = { name: "Times New Roman", size: 15, bold: true };
  worksheet.getCell("A5").alignment = { horizontal: "center", vertical: "middle" };
  worksheet.getRow(5).height = 28;

  const headers: Record<string, string> = {
    A7: "STT", B7: "NGÀY\nPHÁT\nHIỆN", C7: "SKU/UPC", D7: "TÊN HÀNG HÓA", E7: "NCC",
    F7: "ĐƠN\nVỊ\nTÍNH", G7: "SỐ\nLƯỢNG", H7: "MÔ TẢ TÌNH\nTRẠNG\nHÀNG KPH",
    I7: "NGƯỜI\nPHÁT HIỆN\nSP KPH\n(ký và ghi rõ\nhọ tên)", J7: "BIỆN PHÁP XỬ LÝ\n(đánh dấu \"X\")",
    J8: "HỦY", K8: "ĐỔI", L8: "XUẤT TRẢ", M8: "KHÁC", N7: "NGÀY\nXỬ LÝ", O7: "HÌNH ẢNH MINH CHỨNG", R7: "NGƯỜI DUYỆT",
  };
  Object.entries(headers).forEach(([cell, value]) => { worksheet.getCell(cell).value = value; });
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "N", "R"].forEach((column) => worksheet.mergeCells(`${column}7:${column}8`));
  worksheet.mergeCells("J7:M7");
  worksheet.mergeCells("O7:Q8");
  worksheet.getRow(7).height = 48;
  worksheet.getRow(8).height = 30;

  for (let row = 7; row <= 8; row += 1) {
    for (let column = 1; column <= 18; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.font = { name: "Times New Roman", size: 9, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE9F5ED" } };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
      };
    }
  }

  for (const [index, record] of records.entries()) {
    const rowNumber = 9 + index;
    const row = worksheet.getRow(rowNumber);
    row.height = 105;
    row.values = [
      index + 1,
      safeText(record.detectedDate),
      safeText(record.sku),
      safeText(record.productName),
      safeText(record.supplier),
      safeText(record.unit),
      record.quantityValue,
      safeText(record.condition),
      safeText(record.detectedBy),
      treatmentMark(record, "HỦY"),
      treatmentMark(record, "ĐỔI"),
      treatmentMark(record, "XUẤT TRẢ"),
      ["HỦY", "ĐỔI", "XUẤT TRẢ"].includes(record.resolution.trim().toUpperCase()) ? "" : safeText(record.resolution),
      safeText(record.treatmentDate),
      "", "", "", "",
    ];

    for (let column = 1; column <= 18; column += 1) {
      const cell = row.getCell(column);
      cell.font = { name: "Times New Roman", size: 10 };
      cell.alignment = { horizontal: column === 4 || column === 5 || column === 8 || column === 9 || column === 13 ? "left" : "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" },
      };
    }

    for (const [photoIndex, photo] of record.photos.slice(0, 3).entries()) {
      const normalized = await normalizePhoto(photo);
      const buffer = await normalized.blob.arrayBuffer();
      const imageId = workbook.addImage({ buffer: buffer as never, extension: normalized.extension });
      worksheet.addImage(imageId, { tl: { col: 14 + photoIndex + 0.08, row: rowNumber - 1 + 0.08 }, ext: fitImage(normalized.width, normalized.height), editAs: "oneCell" });
    }
  }

  await worksheet.protect(globalThis.crypto?.randomUUID?.() ?? `kph-${Date.now()}`, {
    spinCount: 100_000,
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    insertHyperlinks: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  });

  return workbook;
}

export async function downloadKphWorkbook(kind: KphKind, records: readonly DemoRecord[]) {
  const workbook = await buildKphWorkbook(kind, records);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const typeName = kind === "TPCN" ? "Thuc_pham_kho_va_khac" : "Thuc_pham_tuoi_song";
  const date = formatBusinessDate(new Date()).display.replaceAll("/", "-");
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `Phieu_Theo_Doi_Hang_KPH_${typeName}_${date}.xlsx`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export type KphWorkbook = ExcelJS.Workbook;
