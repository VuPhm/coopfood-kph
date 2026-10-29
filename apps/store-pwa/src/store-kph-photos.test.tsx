import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KphWorkspace } from "./store-kph-workspace";
import { mockProfile, mockRecords } from "./store-app-mock";
import { processEvidencePhoto } from "./image-processing";

vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  let serial = 0;
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => `blob:photo-${++serial}`) });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

describe("Store KPH uses the Pilot evidence workflow", () => {
  it("stamps ordered photos, removes one in the gallery and retains originals separately when saving", async () => {
    vi.mocked(processEvidencePhoto).mockImplementation(async file => ({ blob: new Blob([`stamped-${file.name}`], {type:"image/jpeg"}), capturedAt:new Date("2026-10-30T02:18:00Z"), width:1280, height:720 }));
    const change = vi.fn();
    render(<KphWorkspace records={mockRecords} onRecordsChange={change} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", {name:"Tạo phiếu TP khô & khác"}));
    await screen.findByRole("textbox", {name:"Tên hàng hóa"}, {timeout:5000});
    fireEvent.change(screen.getByRole("textbox", {name:"Tên hàng hóa"}), {target:{value:"Hàng kiểm tra ảnh"}});
    const files = ["first.png", "second.jpg", "third.png"].map(name=>new File([`original-${name}`],name,{type:name.endsWith("png")?"image/png":"image/jpeg"}));
    fireEvent.change(screen.getByLabelText("Chọn ảnh"), {target:{files}});
    await screen.findByText(/Đã xử lý 3\/3 ảnh/);
    expect(processEvidencePhoto).toHaveBeenCalledTimes(3);
    expect(processEvidencePhoto).toHaveBeenNthCalledWith(1, files[0], {storeCode:mockProfile.storeCode,storeName:mockProfile.storeName});
    fireEvent.click(screen.getByRole("button", {name:"Xem ảnh minh chứng 2"}));
    expect(screen.getByAltText("Ảnh minh chứng second.jpg đã đóng tem")).toBeVisible();
    fireEvent.click(screen.getByRole("button", {name:"Ảnh trước"}));
    expect(screen.getByAltText("Ảnh minh chứng first.png đã đóng tem")).toBeVisible();
    fireEvent.click(screen.getByRole("button", {name:"Ảnh sau"}));
    fireEvent.click(screen.getByRole("button", {name:"Xóa ảnh đang xem"}));
    expect(screen.queryByRole("dialog", {name:"Xem ảnh minh chứng"})).not.toBeInTheDocument();
    expect(screen.getByText(/Đã xử lý 2\/3 ảnh/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {name:"Xem lại"}));
    fireEvent.click(await screen.findByRole("button", {name:"Gửi phiếu"}));
    await waitFor(()=>expect(change).toHaveBeenCalledOnce());
    const saved = change.mock.calls[0]![0][0];
    expect(saved.photos).toHaveLength(2);
    expect(saved.photos.map((p: {originalFile: File})=>p.originalFile)).toEqual([files[0],files[2]]);
    for (const photo of saved.photos) {
      expect(photo.blob.type).toBe("image/jpeg");
      expect(photo.blob).not.toBe(photo.originalFile);
      expect(photo.capturedAt).toBe("2026-10-30T02:18:00.000Z");
    }
  });

  it("opens the saved detail as a read-only gallery with navigation", () => {
    const record = {...mockRecords[0]!,photos:[{id:"a",src:"/a.jpg",alt:"Ảnh đầu"},{id:"b",src:"/b.jpg",alt:"Ảnh sau"}]};
    render(<KphWorkspace records={[record]} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", {name:`Mở phiếu ${record.productName}`}));
    fireEvent.click(screen.getByRole("button", {name:"Xem ảnh minh chứng 1"}));
    expect(within(screen.getByRole("dialog", {name:"Xem ảnh minh chứng"})).getByAltText("Ảnh đầu")).toBeVisible();
    expect(screen.getByRole("button", {name:"Ảnh trước"})).toBeDisabled();
    fireEvent.click(screen.getByRole("button", {name:"Ảnh sau"}));
    expect(within(screen.getByRole("dialog", {name:"Xem ảnh minh chứng"})).getByAltText("Ảnh sau")).toBeVisible();
    expect(screen.getByRole("button", {name:"Ảnh sau"})).toBeDisabled();
    expect(screen.queryByRole("button", {name:"Xóa ảnh đang xem"})).not.toBeInTheDocument();
  });
});
