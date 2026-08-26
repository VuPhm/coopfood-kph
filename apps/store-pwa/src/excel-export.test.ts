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
    const workbook = await buildKphWorkbook("TPCN", [record]);
    const worksheet = workbook.getWorksheet("Thực phẩm khô & khác")!;

    expect(worksheet.getCell("A1").value).toBe("CÔNG TY TNHH MTV THỰC PHẨM SAIGON CO.OP");
    expect(worksheet.getCell("A5").value).toContain("PHIẾU THEO DÕI HÀNG KHÔNG PHÙ HỢP");
    expect(worksheet.getCell("J7").value).toContain("BIỆN PHÁP XỬ LÝ");
    expect(worksheet.getCell("O7").value).toBe("HÌNH ẢNH MINH CHỨNG");
    expect(worksheet.getCell("R7").value).toBe("NGƯỜI DUYỆT");
    expect(worksheet.getCell("D9").value).toBe("'=2+2");
    expect(worksheet.getCell("K9").value).toBe("X");
    expect(worksheet.getCell("R9").value).toBe("");
    expect(worksheet.getRow(9).height).toBe(105);
    expect(worksheet.pageSetup.orientation).toBe("landscape");
    expect(worksheet.pageSetup.fitToWidth).toBe(1);
    expect(worksheet.headerFooter.oddFooter).toContain("BM-331.CF");
    const protection = (worksheet.model as unknown as { sheetProtection?: { sheet?: boolean } }).sheetProtection;
    expect(protection?.sheet).toBe(true);
  });
});
