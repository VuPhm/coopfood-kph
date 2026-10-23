import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateWorkspace } from "./store-date-workspace";
import { mockDateLots } from "./store-app-mock";
import { useState } from "react";
function StoreLookupWorkspace() {
  const [lots, setLots] = useState(mockDateLots);
  return <DateWorkspace lots={lots} onLotsChange={setLots} onCreateKph={async () => "synthetic-kph"} />;
}

describe("DATE unified product and lot lookup", () => {
  afterEach(() => vi.useRealTimers());

  it("keeps leading zero identifiers and displays the matched lot fixture", async () => {
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm SKU, barcode, tên hàng hoặc lô" }), { target: { value: "0008421" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" }));
    await screen.findByRole("heading", { name: "Bánh quy bơ hộp 300 g" });
    expect(screen.getByText("SKU 0008421 · UPC 8936000123456")).toBeInTheDocument();
    expect(screen.getByText(/Lô A24-301/)).toBeInTheDocument();
  });

  it("derives remaining percentages from inclusive shelf life and Ho Chi Minh business date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm SKU, barcode, tên hàng hoặc lô" }), { target: { value: "0008421" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" })); await Promise.resolve(); });
    expect(screen.getByText("Còn 38% HSD")).toBeInTheDocument();
    expect(screen.getByText("Còn 13% HSD")).toBeInTheDocument();
    expect(screen.getByText("Còn 1% HSD")).toBeInTheDocument();
  });

  it("resolves an exact tracked lot ID to its product", async () => {
    render(<StoreLookupWorkspace />);
    fireEvent.change(screen.getByRole("textbox", { name: "Tìm SKU, barcode, tên hàng hoặc lô" }), { target: { value: "C24-118" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" }));
    await screen.findByRole("heading", { name: "Cải thìa VietGAP 500 g" });
    expect(screen.getByText(/Lô C24-118/)).toBeInTheDocument();
    expect(screen.getByText("Thực phẩm tươi sống")).toBeInTheDocument();
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.queryByText("Thực phẩm khô")).not.toBeInTheDocument();
  });

  it("maps an exact barcode to the same editable SKU lots without inferring a partial name", async () => {
    render(<StoreLookupWorkspace />);
    const input = screen.getByRole("textbox", { name: "Tìm SKU, barcode, tên hàng hoặc lô" });
    fireEvent.change(input, { target: { value: "8936000123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" }));
    await screen.findByRole("heading", { name: "Bánh quy bơ hộp 300 g" });
    expect(document.querySelectorAll(".store-date-lot")).toHaveLength(3);
    fireEvent.change(input, { target: { value: "A24-198" } });
    expect(document.querySelectorAll(".store-date-lot")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Bánh quy bơ hộp 300 g" })).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "Bánh quy" } });
    expect(document.querySelectorAll(".store-date-lot")).toHaveLength(3);
    expect(screen.queryByRole("region", { name: "Thông tin mã hàng" })).not.toBeInTheDocument();
  });

  it("keeps a barcode miss separate from catalog recovery", async () => {
    render(<StoreLookupWorkspace />);
    const input = screen.getByRole("textbox", { name: "Tìm SKU, barcode, tên hàng hoặc lô" });
    fireEvent.change(input, { target: { value: "0000000000001" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Không tìm thấy mã hàng"));
    expect(screen.queryByRole("heading", { name: "Bánh quy bơ hộp 300 g" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: "0000000000000" } });
    fireEvent.click(screen.getByRole("button", { name: "Tìm mã hàng" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Chưa thể tra cứu danh mục"));
  });
});
