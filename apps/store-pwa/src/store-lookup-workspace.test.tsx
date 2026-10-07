import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoreLookupWorkspace } from "./store-lookup-workspace";

describe("memory-only product and lot lookup", () => {
  afterEach(() => vi.useRealTimers());

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
});
