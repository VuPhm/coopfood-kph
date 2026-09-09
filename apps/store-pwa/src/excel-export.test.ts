import ExcelJS from "exceljs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import excelFixture from "../../../contracts/fixtures/golden/excel/expected-structure.json";

import { DEMO_RECORDS } from "./demo-records";
import type { EvidencePhotoView, RecordView } from "./record-view";
import { buildKphWorkbook, escapeFormulaText } from "./excel-export";

type EmbeddedImage = {
  imageId: number;
  range: {
    editAs?: string;
    ext?: { width: number; height: number };
    tl: { col: number; row: number };
  };
};

type SyntheticBlob = Blob & { testDimensions: { width: number; height: number } };

function photo(index: number, width: number, height: number): EvidencePhotoView {
  const bytes = new Uint8Array([0xff, 0xd8, index, 0xff, 0xd9]);
  const blob = {
    type: "image/jpeg",
    testDimensions: { width, height },
    arrayBuffer: async () => bytes.buffer,
  } as SyntheticBlob;
  return { id: `photo-${index}`, src: `ignored-${index}`, alt: `Ảnh ${index}`, blob };
}

function record(kind: "TPCN" | "TPTS", photos: readonly EvidencePhotoView[] = []): RecordView {
  const source = kind === "TPCN" ? DEMO_RECORDS[0]! : DEMO_RECORDS[1]!;
  return { ...source, kind, photos };
}

async function serializeAndRead(workbook: ExcelJS.Workbook) {
  const serialized = await workbook.xlsx.writeBuffer();
  const readBack = new ExcelJS.Workbook();
  await readBack.xlsx.load(serialized);
  return readBack;
}

describe("KPH Excel export", () => {
  beforeEach(() => {
    let objectUrlSequence = 0;
    const dimensionsByUrl = new Map<string, SyntheticBlob["testDimensions"]>();
    vi.spyOn(URL, "createObjectURL").mockImplementation((source) => {
      const url = `blob:excel-photo-${objectUrlSequence++}`;
      dimensionsByUrl.set(url, (source as SyntheticBlob).testDimensions);
      return url;
    });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);

    class TestImage {
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;
      naturalWidth = 0;
      naturalHeight = 0;

      set src(value: string) {
        const dimensions = dimensionsByUrl.get(value);
        if (!dimensions) {
          this.onerror?.();
          return;
        }
        this.naturalWidth = dimensions.width;
        this.naturalHeight = dimensions.height;
        this.onload?.();
      }
    }

    vi.stubGlobal("Image", TestImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("consumes the golden fixture for formula guards and preserves leading spaces", () => {
    expect(excelFixture.id).toBe("XLSX-STRUCT-01");
    expect(excelFixture.formulaInputs.map(escapeFormulaText)).toEqual(excelFixture.formulaExpected);
    expect(excelFixture.safeInputs.map(escapeFormulaText)).toEqual(excelFixture.safeExpected);
  });

  it.each([
    ["TPCN", "Thực phẩm khô & khác"],
    ["TPTS", "Thực phẩm tươi sống"],
  ] as const)("serializes and reads back the accepted %s BM-331.CF structure", async (kind, sheetName) => {
    const unsafeRecord = {
      ...record(kind),
      sku: excelFixture.safeInputs[0]!,
      productName: excelFixture.formulaInputs[4]!,
      supplier: excelFixture.safeInputs[3]!,
      photos: [],
    };
    const workbook = await buildKphWorkbook(kind, [unsafeRecord], { storeCode: "0123", storeName: "Cống Quỳnh" });
    const sourceWorksheet = workbook.getWorksheet(sheetName)!;
    const readBack = await serializeAndRead(workbook);
    const worksheet = readBack.getWorksheet(sheetName)!;

    expect(worksheet.getCell("A1").value).toBe("CÔNG TY TNHH MTV THỰC PHẨM SAIGON CO.OP");
    expect(worksheet.getCell("A1").isMerged).toBe(false);
    expect(worksheet.getCell("A1").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A2").value).toBe("CO.OP FOOD: Cống Quỳnh");
    expect(worksheet.getCell("A3").value).toBe("STORE: 0123");
    expect(worksheet.getCell("A2").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A3").font).toMatchObject({ name: "Times New Roman", size: 9, bold: true });
    expect(worksheet.getCell("A5").value).toBe(`PHIẾU THEO DÕI HÀNG KHÔNG PHÙ HỢP (${sheetName})`);
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
    expect(sourceWorksheet.getCell("A7").font).toMatchObject({ name: "Times New Roman", size: 8.5, bold: true });
    expect(worksheet.getCell("A7").font).toMatchObject({ name: "Times New Roman", bold: true });
    expect(worksheet.getCell("A7").fill).not.toMatchObject({ pattern: "solid" });
    expect(worksheet.getCell("C9").value).toBe(excelFixture.safeExpected[0]);
    expect(worksheet.getCell("D9").value).toBe(excelFixture.formulaExpected[4]);
    expect(worksheet.getCell("E9").value).toBe(excelFixture.safeExpected[3]);
    expect([worksheet.getCell("J9").value, worksheet.getCell("K9").value]).toContain("X");
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

  it.each([1, 2, 3])("keeps %i image(s) in input order with proportional O:Q anchors after read-back", async (photoCount) => {
    const photos = [photo(1, 200, 100), photo(2, 100, 200), photo(3, 40, 20)].slice(0, photoCount);
    const workbook = await buildKphWorkbook("TPCN", [record("TPCN", photos)], { storeCode: "0123", storeName: "Cống Quỳnh" });
    const readBack = await serializeAndRead(workbook);
    const worksheet = readBack.getWorksheet("Thực phẩm khô & khác")!;
    const images = worksheet.getImages() as unknown as EmbeddedImage[];

    expect(images).toHaveLength(photoCount);
    expect(images.map(({ range }) => Math.floor(range.tl.col))).toEqual(excelFixture.imageColumns.slice(0, photoCount).map((_, index) => 14 + index));
    expect(images.map(({ range }) => Math.floor(range.tl.row))).toEqual(Array(photoCount).fill(8));
    expect(images.map(({ range }) => range.editAs)).toEqual(Array(photoCount).fill("oneCell"));

    const expectedAspectRatios = [2, 0.5, 2].slice(0, photoCount);
    expect(images.map(({ range }) => (range.ext!.width / range.ext!.height))).toEqual(
      expectedAspectRatios.map((ratio) => expect.closeTo(ratio, 2)),
    );
    expect(images.map(({ imageId }) => Array.from(new Uint8Array(readBack.getImage(imageId).buffer as unknown as ArrayBuffer)))).toEqual(
      photos.map((_, index) => [0xff, 0xd8, index + 1, 0xff, 0xd9]),
    );
  });
});
