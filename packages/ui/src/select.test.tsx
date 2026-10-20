import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select } from "./select";

const options = [{ value: "", label: "Tất cả" }, { value: "0008421", label: "Mã hàng 0008421" }];
describe("Select application values", () => {
  it("displays an empty All value and submits an unmodified application value", () => {
    const { rerender } = render(<form aria-label="Bộ lọc"><Select aria-label="Mã hàng" name="sku" value="" onValueChange={() => {}} options={options} /></form>);
    expect(screen.getByRole("combobox", { name: "Mã hàng" })).toHaveTextContent("Tất cả");
    expect(new FormData(screen.getByRole("form", { name: "Bộ lọc" }) as HTMLFormElement).get("sku")).toBe("");
    rerender(<form aria-label="Bộ lọc"><Select aria-label="Mã hàng" name="sku" value="0008421" onValueChange={() => {}} options={options} /></form>);
    expect(new FormData(screen.getByRole("form", { name: "Bộ lọc" }) as HTMLFormElement).get("sku")).toBe("0008421");
  });
  it("disables the trigger and excludes a disabled named field from form data", () => {
    render(<form aria-label="Khóa"><Select aria-label="Mã hàng" name="sku" value="0008421" disabled onValueChange={() => {}} options={options} /></form>);
    expect(screen.getByRole("combobox", { name: "Mã hàng" })).toBeDisabled();
    expect(new FormData(screen.getByRole("form", { name: "Khóa" }) as HTMLFormElement).has("sku")).toBe(false);
  });
});
