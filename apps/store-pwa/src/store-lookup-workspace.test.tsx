import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as mocks from "./store-app-mock";
import { StoreLookupWorkspace } from "./store-lookup-workspace";

describe("memory-only product and lot lookup", () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

  it("keeps leading zero identifiers and displays the matched lot fixture", async () => {
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" }), { target: { value: "0008421" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await screen.findByRole("heading", { name: "Bánh quy bơ hộp 300 g" });
    expect(screen.getByText("SKU 0008421 · UPC 8936000123456")).toBeInTheDocument();
    expect(screen.getByText("A24-301")).toBeInTheDocument();
  });

  it("derives remaining days from fixture expiry and Ho Chi Minh business date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" }), { target: { value: "0008421" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tra cứu" })); await Promise.resolve(); });
    expect(screen.getByText("39 ngày")).toBeInTheDocument();
    expect(screen.getByText("11 ngày")).toBeInTheDocument();
    expect(screen.getByText("0 ngày")).toBeInTheDocument();
  });

  it("resolves an exact tracked lot ID to its product", async () => {
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" }), { target: { value: "C24-118" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await screen.findByRole("heading", { name: "Cải thìa VietGAP 500 g" });
    expect(screen.getByText("C24-118")).toBeInTheDocument();
    expect(screen.getByText("Thực phẩm tươi sống")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.queryByText("Thực phẩm khô")).not.toBeInTheDocument();
  });

  it("keeps a barcode miss separate from catalog recovery", async () => {
    render(<StoreLookupWorkspace />);
    const input = screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" });
    fireEvent.change(input, { target: { value: "0000000000001" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Không tìm thấy mã hàng"));
    expect(screen.queryByRole("heading", { name: "Bánh quy bơ hộp 300 g" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "0000000000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Chưa thể tra cứu danh mục"));
  });

  it("resolves a unique partial product name and clears its result when editing", async () => {
    render(<StoreLookupWorkspace />);
    const input = screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" });
    fireEvent.change(input, { target: { value: " bánh quy " } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await screen.findByRole("heading", { name: "Bánh quy bơ hộp 300 g" });
    fireEvent.change(input, { target: { value: "0011730" } });
    expect(screen.queryByRole("heading", { name: "Bánh quy bơ hộp 300 g" })).not.toBeInTheDocument();
  });

  it("ignores a delayed lookup response after the query changes", async () => {
    let finish!: (result: Awaited<ReturnType<typeof mocks.mockBarcodeLookup>>) => void;
    vi.spyOn(mocks, "mockBarcodeLookup").mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<StoreLookupWorkspace />);
    const input = screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" });
    fireEvent.change(input, { target: { value: "old-code" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    fireEvent.change(input, { target: { value: "0011730" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await screen.findByRole("heading", { name: "Cải thìa VietGAP 500 g" });
    await act(async () => { finish({ status: "NOT_FOUND", barcode: "old-code" }); });
    expect(screen.getByRole("heading", { name: "Cải thìa VietGAP 500 g" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("asks for a precise identifier when a name matches multiple fixtures", async () => {
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Mã hàng, tên hàng hoặc lô" }), { target: { value: "g" } });
    fireEvent.click(screen.getByRole("button", { name: "Tra cứu" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("khớp nhiều sản phẩm"));
    expect(document.querySelector(".store-lookup-product")).toBeNull();
  });
});
