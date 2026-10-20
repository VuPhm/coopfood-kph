import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CreateRecordDialog } from "./create-record-dialog";
import { processEvidencePhoto } from "./image-processing";

vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-20T05:00:00Z"));
  vi.mocked(processEvidencePhoto).mockResolvedValue({
    blob: new Blob(["synthetic stamped JPEG"], { type: "image/jpeg" }),
    capturedAt: new Date(), width: 640, height: 480,
  });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:synthetic-date-test") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe.each(["TPCN", "TPTS"] as const)("%s locked detected date", (kind) => {
  it("still rejects an invalid editable treatment date", async () => {
    const onSaved = vi.fn();
    render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={onSaved} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Ngày xử lý (nếu có)" }), { target: { value: "31/02/2026" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));
    expect(await screen.findByText("Nhập ngày hợp lệ theo dd/mm/yyyy")).toBeVisible();
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox", { name: "Ngày phát hiện" })).toHaveValue("20/10/2026");
  });

  it.each(["10/20/2026", "20 thg 10, 2026", "20\u200e/10\u200e/2026"])("saves without asking to edit the locked date when Intl.format returns %s", async (formatted) => {
    const prototype: { readonly format: unknown } = Intl.DateTimeFormat.prototype;
    vi.spyOn(prototype, "format", "get").mockReturnValue(() => formatted);
    const onSaved = vi.fn();
    render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={onSaved} />);
    const detectedDate = screen.getByRole("textbox", { name: "Ngày phát hiện" });
    expect(detectedDate).toHaveValue("20/10/2026");
    expect(detectedDate).toHaveAttribute("readonly");
    fireEvent.change(detectedDate, { target: { value: "" } });
    expect(detectedDate).toHaveValue("20/10/2026");
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Hàng tổng hợp kiểm thử ngày" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Tên người nhập" }), { target: { value: "Người kiểm thử" } });
    const picker = screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
    fireEvent.change(picker, { target: { files: [new File(["synthetic"], "date-test.jpg", { type: "image/jpeg" })] } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.click(screen.getByRole("button", { name: "Lưu phiếu" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ kind, detectedDate: "20/10/2026", treatmentDate: "" })));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
