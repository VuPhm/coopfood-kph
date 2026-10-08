import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateRecordDialog } from "./create-record-dialog";
import { mockBarcodeLookup, mockProfile } from "./store-app-mock";

describe("Store App review before submit", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:evidence") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });
  it("does not save at review; editing preserves evidence, and retry preserves the idempotency key", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("Mất kết nối")).mockResolvedValue(undefined);
    render(<CreateRecordDialog kind="TPTS" open profile={mockProfile} actorReadOnly onlineMode presentation="screen" onSaved={save} onOpenChange={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Sản phẩm tổng hợp" } });
    const file = new File(["synthetic"], "evidence.png", { type: "image/png" });
    const picker = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
    fireEvent.change(picker, { target: { files: [file] } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.click(screen.getByRole("button", { name: "Xem lại" }));
    await screen.findByRole("heading", { name: /Xem lại phiếu KPH/ });
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Chỉnh sửa" }));
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Sản phẩm tổng hợp");
    expect(screen.getByLabelText("Ảnh đã chọn")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Xem lại" }));
    await screen.findByRole("button", { name: "Gửi phiếu" });
    fireEvent.click(screen.getByRole("button", { name: "Gửi phiếu" }));
    await screen.findByRole("alert", { hidden: false });
    expect(screen.getByRole("alert", { hidden: false })).toHaveTextContent("Mất kết nối");
    expect(save).toHaveBeenCalledTimes(1);
    const first = save.mock.calls[0]![0];
    expect(first.photos).toHaveLength(1);
    expect(first.photos[0].originalFile).toBe(file);
    fireEvent.click(screen.getByRole("button", { name: "Gửi phiếu" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]![0].idempotencyKey).toBe(first.idempotencyKey);
  });

  it.each([false, true])("retains only the current lookup SKU in the draft (rescan miss: %s)", async (miss) => {
    const save = vi.fn().mockResolvedValue(undefined);
    render(<CreateRecordDialog kind="TPTS" open profile={mockProfile} actorReadOnly onlineMode presentation="screen" onBarcodeLookup={mockBarcodeLookup} onSaved={save} onOpenChange={vi.fn()} />);
    const barcode = screen.getByRole("textbox", { name: "Mã SKU / UPC" });
    fireEvent.change(barcode, { target: { value: "29123415005" } });
    fireEvent.blur(barcode);
    await screen.findByText("Đã tìm thấy 0011730.");
    if (miss) {
      fireEvent.change(barcode, { target: { value: "0010000000001" } });
      fireEvent.blur(barcode);
      await screen.findByText(/Không tìm thấy barcode/);
      fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Sản phẩm nhập tay" } });
    }
    const picker = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
    fireEvent.change(picker, { target: { files: [new File(["synthetic"], "evidence.png", { type: "image/png" })] } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.click(screen.getByRole("button", { name: "Xem lại" }));
    fireEvent.click(await screen.findByRole("button", { name: "Gửi phiếu" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const draft = save.mock.calls[0]![0];
    expect(draft.barcode).toBe(miss ? "0010000000001" : "29123415005");
    if (miss) expect(draft).not.toHaveProperty("skuCode");
    else expect(draft.skuCode).toBe("0011730");
  });
});
