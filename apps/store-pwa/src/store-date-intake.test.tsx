import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateIntake } from "./store-date-intake";
import { mockBarcodeLookup, mockCatalogProducts } from "./store-app-mock";
vi.mock("./store-app-mock", async original => ({ ...await original<typeof import("./store-app-mock")>(), mockBarcodeLookup: vi.fn() }));
const lookup = vi.mocked(mockBarcodeLookup);
function form(onSave = vi.fn()) { render(<DateIntake today="2026-10-28" onSave={onSave} onCancel={vi.fn()} onOpenExisting={vi.fn()} />); return onSave; }
function type(label: string, value: string) { fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } }); }
describe("DATE entry recovery", () => {
  it("opens direct manual entry without making a catalog miss or lookup", async () => {
    lookup.mockReset(); const save = form();
    fireEvent.click(screen.getByRole("button", { name: "Tự nhập" }));
    expect(screen.getByRole("button", { name: "Tự nhập" })).toHaveAttribute("aria-pressed", "true");
    type("SKU", "0000018"); type("Tên sản phẩm", "Hàng tự nhập"); type("Barcode (nếu có)", " 00001234 ");
    type("Ngày sản xuất (NSX)", "01/10/2026"); type("Hạn sử dụng (HSD)", "31/10/2026");
    fireEvent.click(screen.getByRole("button", { name: "Thêm vào theo dõi" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(lookup).not.toHaveBeenCalled();
    expect(save.mock.calls[0]![0]).toMatchObject({ sku: "0000018", productSnapshot: { lookupStatus: "MANUAL", barcode: "00001234", kind: null } });
  });
  it("ignores stale lookup results after the operator changes the code", async () => {
    let resolve!: (result: Awaited<ReturnType<typeof mockBarcodeLookup>>) => void;
    lookup.mockImplementationOnce(() => new Promise(r => { resolve = r; })); form();
    type("SKU hoặc barcode sản phẩm", "8936000123456"); fireEvent.click(screen.getByRole("button", { name: "Tra mã" }));
    type("SKU hoặc barcode sản phẩm", "Mã khác");
    await act(async () => resolve({ status: "FOUND", barcode: "8936000123456", product: mockCatalogProducts[0]! }));
    expect(screen.queryByText(mockCatalogProducts[0]!.name)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm vào theo dõi" })).toBeDisabled();
  });
  it("keeps unavailable distinct from a miss, preserves manual identity and date input on failure/retry", async () => {
    lookup.mockRejectedValueOnce(new Error("Danh mục chưa sẵn sàng")); const save = form(vi.fn().mockRejectedValueOnce(new Error("test save error")).mockResolvedValue(undefined));
    type("SKU hoặc barcode sản phẩm", "0000000000000"); fireEvent.click(screen.getByRole("button", { name: "Tra mã" }));
    await screen.findByText("Danh mục chưa sẵn sàng"); expect(screen.queryByText(/Không tìm thấy sản phẩm/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nhập tay thông tin sản phẩm" })); expect(screen.getByRole("checkbox", { name: "Dùng mã vừa tra làm barcode" })).not.toBeChecked(); type("SKU", "0000099"); type("Tên sản phẩm", "Hàng nhập tay");
    type("Ngày sản xuất (NSX)", "01/10/2026"); type("Hạn sử dụng (HSD)", "01/10/2026"); fireEvent.click(screen.getByRole("button", { name: "Thêm vào theo dõi" }));
    await screen.findByText("HSD phải sau NSX."); expect(save).not.toHaveBeenCalled();
    type("Hạn sử dụng (HSD)", "31/10/2026"); fireEvent.click(screen.getByRole("button", { name: "Thêm vào theo dõi" }));
    await screen.findByText(/Chưa thêm được lô/); expect(screen.getByRole("textbox", { name: "SKU" })).toHaveValue("0000099");
    fireEvent.click(screen.getByRole("button", { name: "Thêm vào theo dõi" })); await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]![0]).toMatchObject({ sku: "0000099", date: "2026-10-31", productSnapshot: { lookupStatus: "CATALOG_UNAVAILABLE", kind: null, barcode: "", lookupInput: "0000000000000" } });
    expect(save.mock.calls[1]![0].id).toBe(save.mock.calls[0]![0].id);
  });
});
