import ExcelJS from "exceljs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_RECORDS } from "./demo-records";
import { buildKphWorkbook } from "./excel-export";
import { OnlineApiError, type OnlineExportBundle } from "./online-kph";
import { downloadOnlineKphExport } from "./store-online-export";

vi.mock("./excel-export", async importOriginal => {
  const actual = await importOriginal<typeof import("./excel-export")>();
  return { ...actual, buildKphWorkbook: vi.fn(actual.buildKphWorkbook) };
});

const storeId = "20000000-0000-4000-8000-000000000001";
function bundle(): OnlineExportBundle {
  return {
    exportId: "export-synthetic", exportedAt: "2026-11-15T01:00:00Z",
    store: { id: storeId, code: "0001", name: "Cửa hàng mẫu" },
    records: [{ ...DEMO_RECORDS[0]!, id: "record-synthetic", kind: "TPCN", approvalStatus: "APPROVED", reviewedBy: "=Quản lý mẫu",
      photos: [1, 2, 3].map(index => ({ id: `photo-${index}`, src: `/api/v1/stores/${storeId}/kph/record-synthetic/photos/${index}`, alt: `Ảnh ${index}` })) }],
  };
}
function imageBlob(index: number) {
  return { type: "image/jpeg", size: 5, arrayBuffer: async () => new Uint8Array([0xff, 0xd8, index, 0xff, 0xd9]).buffer } as Blob;
}
function readBlob(blob: Blob) {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(blob);
  });
}

describe("Fresh online export", () => {
  const created: Blob[] = [];
  const build = vi.mocked(buildKphWorkbook);
  let click: ReturnType<typeof vi.spyOn>;
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    created.length = 0;
    click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    vi.spyOn(URL, "createObjectURL").mockImplementation(blob => { created.push(blob as Blob); return `blob:synthetic-${created.length}`; });
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    class TestImage {
      naturalWidth = 200; naturalHeight = 100;
      onload: (() => void) | null = null;
      set src(_value: string) { this.onload?.(); }
    }
    vi.stubGlobal("Image", TestImage);
    fetchMock = vi.fn().mockImplementation(async (path: string) => ({ ok: true, status: 200, blob: async () => imageBlob(Number(path.at(-1))) }));
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); build.mockClear(); });

  it("downloads a real workbook from server snapshots with private ordered images and protected reviewer R", async () => {
    expect(await downloadOnlineKphExport(bundle(), "TPCN", () => true)).toBe(true);
    expect(click).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls.map(call => call[0])).toEqual(bundle().records[0]!.photos.map(photo => photo.src));
    for (const call of fetchMock.mock.calls) expect(call[1]).toEqual({ credentials: "same-origin", cache: "no-store" });
    const downloaded = created.find(blob => blob.type.includes("spreadsheetml"))!;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await readBlob(downloaded));
    const sheet = workbook.getWorksheet("Thực phẩm khô & khác")!;
    expect(sheet.getCell("A2").value).toBe("CO.OP FOOD: Cửa hàng mẫu");
    expect(sheet.getCell("A3").value).toBe("STORE: 0001");
    expect(sheet.getCell("R9").value).toBe("'=Quản lý mẫu");
    const images = sheet.getImages();
    expect(images.map(image => Math.floor(image.range.tl.col))).toEqual([14, 15, 16]);
    expect(images.map(image => Array.from(new Uint8Array(workbook.getImage(Number(image.imageId)).buffer as unknown as ArrayBuffer))))
      .toEqual([1, 2, 3].map(index => [0xff, 0xd8, index, 0xff, 0xd9]));
  });

  it.each(["kind", "approval", "foreign-photo", "missing-photo", "duplicate"])("rejects an inconsistent %s bundle before requesting private media", async failure => {
    const data = bundle(); const record = data.records[0]!;
    if (failure === "kind") record.kind = "TPTS";
    if (failure === "approval") record.approvalStatus = "PENDING";
    if (failure === "foreign-photo") record.photos = [{ ...record.photos[0]!, src: "https://example.org/photo.jpg" }];
    if (failure === "missing-photo") record.photos = [];
    if (failure === "duplicate") data.records.push(record);
    await expect(downloadOnlineKphExport(data, "TPCN", () => true)).rejects.toThrow("Dữ liệu xuất phiếu không hợp lệ");
    expect(fetchMock).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled();
  });

  it("propagates private media denial to the session boundary without generating a partial workbook", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 403 });
    await expect(downloadOnlineKphExport(bundle(), "TPCN", () => true)).rejects.toMatchObject({ status: 403, name: "OnlineApiError" } satisfies Partial<OnlineApiError>);
    expect(build).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled();
  });

  it("does not skip an invalid private stamped image", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, blob: async () => new Blob(["error"], { type: "text/html" }) });
    await expect(downloadOnlineKphExport(bundle(), "TPCN", () => true)).rejects.toThrow("Ảnh minh chứng không hợp lệ");
    expect(build).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled();
  });

  it("reports a photo network failure without producing a partial workbook", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(downloadOnlineKphExport(bundle(), "TPCN", () => true)).rejects.toThrow("Hãy kiểm tra kết nối và thử lại");
    expect(build).not.toHaveBeenCalled(); expect(click).not.toHaveBeenCalled();
  });

  it("rechecks scope immediately before the browser download", async () => {
    let current = true;
    vi.mocked(URL.createObjectURL).mockImplementation(blob => {
      if ((blob as Blob).type.includes("spreadsheetml")) current = false;
      return "blob:synthetic";
    });
    expect(await downloadOnlineKphExport(bundle(), "TPCN", () => current)).toBe(false);
    expect(click).not.toHaveBeenCalled();
  });

  it.each(["before-fetch", "after-fetch", "after-blob", "after-build", "after-serialization"])("cancels stale scope %s without downloading", async stage => {
    let current = stage !== "before-fetch";
    if (stage === "after-fetch") fetchMock.mockImplementation(async () => { current = false; return { ok: true, status: 200 }; });
    if (stage === "after-blob") fetchMock.mockResolvedValue({ ok: true, status: 200, blob: async () => { current = false; return imageBlob(1); } });
    if (stage === "after-build" || stage === "after-serialization") {
      build.mockImplementationOnce(async () => {
        if (stage === "after-build") current = false;
        return { xlsx: { writeBuffer: async () => { current = false; return new Uint8Array([1, 2, 3]).buffer; } } } as unknown as ExcelJS.Workbook;
      });
    }
    expect(await downloadOnlineKphExport(bundle(), "TPCN", () => current)).toBe(false);
    expect(click).not.toHaveBeenCalled();
    if (stage === "before-fetch") expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces workbook errors without claiming a download", async () => {
    build.mockRejectedValueOnce(new Error("Không thể đọc kích thước ảnh minh chứng"));
    await expect(downloadOnlineKphExport(bundle(), "TPCN", () => true)).rejects.toThrow("Không thể đọc kích thước ảnh minh chứng");
    expect(click).not.toHaveBeenCalled();
  });
});
