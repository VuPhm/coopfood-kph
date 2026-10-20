import { formatDisplayDate } from "@coopfood-kph/kph-rules";
import { DATE_PHASE_LABELS } from "./store-date-assessment";
import { filterLabel, periodLabel, processingLabels, type DateReport } from "./store-date-report-model";

export async function createDateReportWorkbook(report: DateReport & { title?: string; id?: string }) {
  const { default: ExcelJS } = await import("exceljs");
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet("DATE");
  sheet.addRow([`${report.title ?? "BÁO CÁO DATE"} — DỮ LIỆU MẪU`]);
  sheet.addRow(["Cửa hàng", report.store]);
  sheet.addRow(["Kỳ báo cáo", periodLabel(report.period)]);
  sheet.addRow(["Ngày chốt", formatDisplayDate(report.asOf)]);
  sheet.addRow(["Bộ lọc", filterLabel(report.filter)]);
  sheet.addRow(["Ngày tạo", report.createdAt]);
  sheet.addRow(["Nguồn", "Danh mục lô DATE hiện tại; chưa có số lượng tồn, đơn vị hoặc lịch sử chốt kỳ."]);
  sheet.addRow([]);
  const header = sheet.addRow(["SKU", "Tên sản phẩm", "Lô", "NSX", "HSD", "Tồn", "Đơn vị", "DATE", "Xử lý"]);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF00724E" } };
  for (const row of report.rows) sheet.addRow([row.sku, row.name, row.id, row.manufactured ?? "Chưa có", formatDisplayDate(row.date), "Chưa có", "Chưa có", DATE_PHASE_LABELS[row.assessment.phase], processingLabels[row.status]]);
  sheet.columns.forEach((column, index) => { column.width = index === 1 ? 38 : 24; });
  sheet.getColumn(1).numFmt = "@";
  sheet.autoFilter = { from: { row: header.number, column: 1 }, to: { row: header.number + report.rows.length, column: 9 } };
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  return book;
}
export async function downloadDateReport(report: DateReport & { title?: string; id?: string }) {
  const book = await createDateReportWorkbook(report);
  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a");
  link.href = url; link.download = `DATE-mau-${report.asOf}${report.id ? `-${report.id.slice(0, 8)}` : ""}.xlsx`; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
