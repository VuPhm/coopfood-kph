import { describe, expect, it } from "vitest";

import { DEMO_RECORDS } from "./demo-records";
import { buildKphWorkbook, escapeFormulaText } from "./excel-export";

describe("KPH Excel export", () => {
  it("guards spreadsheet formulas without changing normal text", () => {
    expect(escapeFormulaText("  =2+2")).toBe("'  =2+2");
    expect(escapeFormulaText("Sản phẩm A")).toBe("Sản phẩm A");
  });

  it("builds the accepted BM-331.CF structure and leaves approver blank", async () => {
    const record = { ...DEMO_RECORDS[0]!, productName: "=2+2", photos: [] };
    const workbook = await buildKphWorkbook("TPCN", [record], { storeCode: "0123", storeName: "Cống Quỳnh" });
    const worksheet = workbook.getWorksheet("Thực phẩm khô & khác")!;

    expect(worksheet.getCell("A1").value).toBe("CÔNG TY TNHH MTV THỰC PHẨM SAIGON CO.OP");
    expect(worksheet.getCell("A1").isMerged).toBe(false);
    expect(worksheet.getCell("A1").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A2").value).toBe("CO.OP FOOD: Cống Quỳnh");
    expect(worksheet.getCell("A3").value).toBe("STORE: 0123");
    expect(worksheet.getCell("A2").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A3").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A5").value).toBe("PHIẾU THEO DÕI HÀNG KHÔNG PHÙ HỢP (Thực phẩm khô & khác)");
    expect(worksheet.getRow(5).height).toBe(25);
    expect(worksheet.getCell("J7").value).toBe("BIỆN PHÁP XỬ LÝ\n(đánh dấu \"X\")");
    expect(worksheet.getCell("L8").value).toBe("XUẤT\nTRẢ");
    expect(worksheet.getCell("M8").value).toBe("KHÁC (ghi rõ\nnội dung xử lý)");
    expect(worksheet.getCell("N7").value).toBe("Ghi ngày\nxử lý");
    expect(worksheet.getCell("O7").value).toBe("ẢNH MINH\nCHỨNG");
    expect(worksheet.getCell("R7").value).toBe("BĐH THEO DÕI\nXỬ LÝ\n(ký và ghi rõ họ tên)");
    expect(worksheet.getCell("Q8").master.address).toBe("O7");
    expect(worksheet.getCell("R8").master.address).toBe("R7");
    expect(worksheet.getRow(7).height).toBe(25);
    expect(worksheet.getRow(8).height).toBe(25);
    expect(worksheet.getCell("A7").font).toMatchObject({ name: "Times New Roman", size: 8.5, bold: true });
    expect(worksheet.getCell("A7").fill).not.toMatchObject({ pattern: "solid" });
    expect(worksheet.getCell("D9").value).toBe("'=2+2");
    expect(worksheet.getCell("K9").value).toBe("X");
    expect(worksheet.getCell("R9").value).toBe("");
    expect(worksheet.getRow(9).height).toBe(105);
    expect(worksheet.getCell("D9").font).toMatchObject({ name: "Times New Roman", size: 9 });
    expect(worksheet.getCell("O9").border.right).toBeUndefined();
    expect(worksheet.getCell("P9").border.left).toBeUndefined();
    expect(worksheet.getCell("P9").border.right).toBeUndefined();
    expect(worksheet.getCell("Q9").border.left).toBeUndefined();
    expect(worksheet.getCell("Q9").border.right?.style).toBe("thin");
    expect(worksheet.pageSetup.orientation).toBe("landscape");
    expect(worksheet.pageSetup.fitToWidth).toBe(1);
    expect(worksheet.headerFooter.oddFooter).toContain("BM-331.CF");
    const protection = (worksheet.model as unknown as { sheetProtection?: { objects?: boolean; scenarios?: boolean; sheet?: boolean; spinCount?: number } }).sheetProtection;
    expect(protection).toMatchObject({ sheet: true, spinCount: 100_000, objects: false, scenarios: false });
  });
});
