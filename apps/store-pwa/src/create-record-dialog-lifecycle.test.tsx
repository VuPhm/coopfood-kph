import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement, StrictMode, type ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateRecordDialog, type CreatedRecordDraft } from "./create-record-dialog";
import { processEvidencePhoto } from "./image-processing";
import { DEFAULT_STORE_PROFILE } from "./store-profile";
import { CalendarClock } from "lucide-react";

vi.mock("./image-processing", () => ({ processEvidencePhoto: vi.fn() }));
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return { ...actual, CalendarClock: vi.fn((props) => createElement(actual.CalendarClock as ComponentType, props)) };
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const processed = () => ({ blob: new Blob(["synthetic stamped JPEG"], { type: "image/jpeg" }), capturedAt: new Date(), width: 640, height: 480 });
const files = (count: number) => Array.from({ length: count }, (_, i) => new File(["synthetic"], `test-${i}.jpg`, { type: "image/jpeg" }));
const picker = () => screen.getByText("Chọn ảnh").closest("label")!.querySelector("input")!;
const form = () => screen.getByRole("button", { name: "Lưu phiếu" }).closest("form")!;
function fillRequired() {
  fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Sản phẩm tổng hợp" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Tên người nhập" }), { target: { value: "Người kiểm thử" } });
}

describe("Create form async lifecycle and rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(processEvidencePhoto).mockReset();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:synthetic") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  it.each(["TPCN", "TPTS"] as const)("stops the remaining %s photo batch after close, without publishing stale photos", async (kind) => {
    const pending = deferred<ReturnType<typeof processed>>();
    vi.mocked(processEvidencePhoto).mockReturnValueOnce(pending.promise);
    const props = { kind, open: true, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.change(picker(), { target: { files: files(3) } });
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    view.rerender(<CreateRecordDialog {...props} />);
    await act(async () => pending.resolve(processed()));
    expect(processEvidencePhoto).toHaveBeenCalledTimes(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Ảnh đã chọn")).not.toBeInTheDocument();
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    fireEvent.change(picker(), { target: { files: files(1) } });
    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
  });

  it("releases partially prepared URLs on unmount and skips the remaining files", async () => {
    const pending = deferred<ReturnType<typeof processed>>();
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed()).mockReturnValueOnce(pending.promise);
    const view = render(<CreateRecordDialog kind="TPCN" open onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    fireEvent.change(picker(), { target: { files: files(3) } });
    await waitFor(() => expect(processEvidencePhoto).toHaveBeenCalledTimes(2));
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(processed()));
    expect(processEvidencePhoto).toHaveBeenCalledTimes(2);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it.each(["kind", "profile"] as const)("ignores stale photo errors when %s changes", async (change) => {
    const pending = deferred<ReturnType<typeof processed>>();
    vi.mocked(processEvidencePhoto).mockReturnValueOnce(pending.promise);
    const props = { kind: "TPCN" as const, open: true, onOpenChange: vi.fn(), onSaved: vi.fn(), profile: DEFAULT_STORE_PROFILE };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.change(picker(), { target: { files: files(2) } });
    view.rerender(<CreateRecordDialog {...props} kind={change === "kind" ? "TPTS" : "TPCN"} profile={change === "profile" ? { ...DEFAULT_STORE_PROFILE, storeCode: "9999" } : props.profile} />);
    await act(async () => pending.reject(new Error("stale synthetic failure")));
    expect(screen.queryByText("stale synthetic failure")).not.toBeInTheDocument();
    expect(picker()).not.toBeDisabled();
  });

  it("serializes overlapping picker events instead of decoding two batches", async () => {
    const pending = deferred<ReturnType<typeof processed>>();
    vi.mocked(processEvidencePhoto).mockReturnValue(pending.promise);
    render(<CreateRecordDialog kind="TPTS" open onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    const input = picker();
    act(() => {
      fireEvent.change(input, { target: { files: files(1) } });
      fireEvent.change(input, { target: { files: files(1) } });
    });
    expect(processEvidencePhoto).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve(processed()));
    expect(screen.getByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
  });

  it("preserves an existing photo through a failed batch, close/reopen and retry", async () => {
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    const props = { kind: "TPCN" as const, open: true, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.change(picker(), { target: { files: files(1) } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    vi.mocked(URL.createObjectURL).mockReturnValueOnce("blob:failed-batch");
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed()).mockRejectedValueOnce(new Error("synthetic decode failure"));
    fireEvent.change(picker(), { target: { files: files(2) } });
    expect(await screen.findByText("synthetic decode failure")).toBeVisible();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:failed-batch");
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith("blob:synthetic");
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    view.rerender(<CreateRecordDialog {...props} />);
    expect(screen.getByRole("button", { name: "Xem ảnh minh chứng 1" })).toBeVisible();
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    fireEvent.change(picker(), { target: { files: files(1) } });
    expect(await screen.findByText(/Đã xử lý 2\/3 ảnh/)).toBeVisible();
  });

  it("keeps photo processing usable after StrictMode effect replay", async () => {
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    const view = render(<StrictMode><CreateRecordDialog kind="TPTS" open onOpenChange={vi.fn()} onSaved={vi.fn()} /></StrictMode>);
    fireEvent.change(picker(), { target: { files: files(1) } });
    expect(await screen.findByText(/Đã xử lý 1\/3 ảnh/)).toBeVisible();
    view.unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it("closes the scanner when its parent form closes, without reopening it with the draft", () => {
    const props = { kind: "TPTS" as const, open: true, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Quét mã barcode" }));
    expect(screen.getByRole("dialog", { name: "Quét mã SKU / UPC" })).toBeInTheDocument();
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    expect(screen.queryByRole("dialog", { name: "Quét mã SKU / UPC" })).not.toBeInTheDocument();
    view.rerender(<CreateRecordDialog {...props} />);
    expect(screen.queryByRole("dialog", { name: "Quét mã SKU / UPC" })).not.toBeInTheDocument();
  });

  it("closes the photo viewer with the form and keeps the prepared draft on reopen", async () => {
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    const props = { kind: "TPTS" as const, open: true, onOpenChange: vi.fn(), onSaved: vi.fn() };
    const view = render(<CreateRecordDialog {...props} />);
    fireEvent.change(picker(), { target: { files: files(1) } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.click(screen.getByRole("button", { name: "Xem ảnh minh chứng 1" }));
    expect(screen.getByAltText("Ảnh minh chứng test-0.jpg đã đóng tem")).toBeInTheDocument();
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    expect(screen.queryByAltText("Ảnh minh chứng test-0.jpg đã đóng tem")).not.toBeInTheDocument();
    view.rerender(<CreateRecordDialog {...props} />);
    expect(screen.getByRole("button", { name: "Xem ảnh minh chứng 1" })).toBeVisible();
    expect(screen.queryByAltText("Ảnh minh chứng test-0.jpg đã đóng tem")).not.toBeInTheDocument();
  });

  it("does not submit a draft closed while its validation was pending", async () => {
    const onSaved = vi.fn();
    vi.mocked(processEvidencePhoto).mockResolvedValueOnce(processed());
    const props = { kind: "TPCN" as const, open: true, onOpenChange: vi.fn(), onSaved };
    const view = render(<CreateRecordDialog {...props} />);
    fillRequired();
    fireEvent.change(picker(), { target: { files: files(1) } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.submit(form());
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    await act(async () => {});
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each(["TPCN", "TPTS"] as const)("deduplicates %s submissions before async validation and storage finish", async (kind) => {
    const pending = deferred<void>();
    const onSaved = vi.fn<(draft: CreatedRecordDraft) => Promise<void>>().mockReturnValue(pending.promise);
    vi.mocked(processEvidencePhoto).mockResolvedValue(processed());
    render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={onSaved} />);
    fillRequired();
    fireEvent.change(picker(), { target: { files: files(1) } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    const currentForm = form();
    act(() => { fireEvent.submit(currentForm); fireEvent.submit(currentForm); });
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    fireEvent.submit(currentForm);
    await act(async () => pending.resolve());
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it.each(["resolve", "reject"] as const)("does not clear or close a new draft when an old save ends with %s", async (outcome) => {
    const pending = deferred<void>();
    const onSaved = vi.fn().mockReturnValue(pending.promise);
    const onOpenChange = vi.fn();
    vi.mocked(processEvidencePhoto).mockResolvedValue(processed());
    const props = { kind: "TPCN" as const, open: true, onOpenChange, onSaved };
    const view = render(<CreateRecordDialog {...props} />);
    fillRequired();
    fireEvent.change(picker(), { target: { files: files(1) } });
    await screen.findByText(/Đã xử lý 1\/3 ảnh/);
    fireEvent.submit(form());
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    view.rerender(<CreateRecordDialog {...props} open={false} />);
    view.rerender(<CreateRecordDialog {...props} kind="TPTS" />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tên hàng hóa" }), { target: { value: "Phiếu mới tổng hợp" } });
    await act(async () => outcome === "resolve" ? pending.resolve() : pending.reject(new Error("old save failure")));
    expect(screen.getByRole("textbox", { name: "Tên hàng hóa" })).toHaveValue("Phiếu mới tổng hợp");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByText("old save failure")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu phiếu" })).toBeEnabled();
  });

  it.each(["TPCN", "TPTS"] as const)("keeps %s choice icons from rendering again on 20 watched form updates", (kind) => {
    render(<CreateRecordDialog kind={kind} open onOpenChange={vi.fn()} onSaved={vi.fn()} />);
    const initialRenders = vi.mocked(CalendarClock).mock.calls.length;
    expect(initialRenders).toBeGreaterThan(0);
    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(screen.getByRole("radio", { name: i % 2 ? "Cận date" : "Khác" }));
    }
    expect(vi.mocked(CalendarClock)).toHaveBeenCalledTimes(initialRenders);
  });
});
