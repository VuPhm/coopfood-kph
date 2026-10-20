import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { StoreChoiceSheet } from "./store-choice-sheet";
import { StoreSearchField } from "./store-search-field";

function Harness({ applied }: { applied: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("a");
  return <><button onClick={() => setOpen(true)}>Chọn mục</button><output data-testid="value">{value}</output><StoreChoiceSheet open={open} onOpenChange={setOpen} value={value} options={[{ value: "a", label: "Mục A" }, { value: "b", label: "Mục B" }]} onApply={next => { setValue(next); applied(next); }} title="Chọn một mục" description="Chọn rồi áp dụng" searchLabel="Tìm mục" searchPlaceholder="Nhập tên mục" /></>;
}

describe("Store choice sheet contract", () => {
  it("keeps provisional changes local, cancels them, and commits only on Apply", async () => {
    const applied = vi.fn(); render(<Harness applied={applied} />);
    fireEvent.click(screen.getByRole("button", { name: "Chọn mục" }));
    fireEvent.click(screen.getByRole("radio", { name: "Mục B" }));
    expect(applied).not.toHaveBeenCalled(); expect(screen.getByTestId("value")).toHaveTextContent("a");
    fireEvent.click(screen.getByRole("button", { name: "Hủy" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Chọn mục" }));
    expect(screen.getByRole("radio", { name: "Mục A" })).toBeChecked();
    fireEvent.click(screen.getByRole("radio", { name: "Mục B" }));
    fireEvent.click(screen.getByRole("button", { name: "Áp dụng" }));
    expect(applied).toHaveBeenCalledExactlyOnceWith("b"); expect(screen.getByTestId("value")).toHaveTextContent("b");
  });

  it("does not apply a choice hidden by search and lets clear restore the query field", () => {
    render(<Harness applied={vi.fn()} />); fireEvent.click(screen.getByRole("button", { name: "Chọn mục" }));
    fireEvent.click(screen.getByRole("radio", { name: "Mục B" }));
    const query = screen.getByRole("textbox", { name: "Tìm mục" });
    fireEvent.change(query, { target: { value: "Mục A" } });
    expect(screen.getByRole("button", { name: "Áp dụng" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Xóa tìm kiếm" }));
    expect(query).toHaveValue(""); expect(query).toHaveFocus();
    expect(screen.getByRole("button", { name: "Áp dụng" })).toBeEnabled();
  });
});

it("search clear is a button action, not a form submission", () => {
  const submitted = vi.fn();
  function SearchForm() { const [value, setValue] = useState("abc"); return <form onSubmit={event => { event.preventDefault(); submitted(); }}><StoreSearchField value={value} onValueChange={setValue} label="Tìm hàng" placeholder="Tìm" /></form>; }
  render(<SearchForm />); fireEvent.click(screen.getByRole("button", { name: "Xóa tìm kiếm" }));
  expect(submitted).not.toHaveBeenCalled(); expect(screen.getByRole("textbox", { name: "Tìm hàng" })).toHaveValue(""); expect(screen.getByRole("textbox", { name: "Tìm hàng" })).toHaveFocus();
});
