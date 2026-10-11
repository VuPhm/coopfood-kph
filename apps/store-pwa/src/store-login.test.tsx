import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreLogin } from "./store-login";

describe("Store login form boundary", () => {
  it("preserves password whitespace and Unicode through reveal and submit, trims only username", () => {
    const onSubmit = vi.fn();
    render(<StoreLogin busy={false} error="" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "  employee  " } });
    const password = screen.getByLabelText("Mật khẩu");
    fireEvent.change(password, { target: { value: "  tiếng Việt 🔑  " } });
    fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
    expect(password).toHaveAttribute("type", "text");
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Ẩn mật khẩu" }));
    expect(password).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(onSubmit).toHaveBeenCalledExactlyOnceWith("employee", "  tiếng Việt 🔑  ");
  });

  it("retains inputs on an authentication error and prevents duplicate submits while busy", () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<StoreLogin busy={false} error="" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText("Tên đăng nhập"), { target: { value: "employee" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "test-password" } });
    rerender(<StoreLogin busy error="" onSubmit={onSubmit} />);
    expect(screen.getByLabelText("Tên đăng nhập")).toBeDisabled();
    expect(screen.getByLabelText("Mật khẩu")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hiện mật khẩu" })).toBeDisabled();
    fireEvent.submit(screen.getByLabelText("Mật khẩu").closest("form")!);
    expect(onSubmit).not.toHaveBeenCalled();
    rerender(<StoreLogin busy={false} error="Không thể đăng nhập. Thử lại." onSubmit={onSubmit} />);
    expect(screen.getByRole("status")).toHaveTextContent("Không thể đăng nhập. Thử lại.");
    expect(screen.getByLabelText("Mật khẩu")).toHaveValue("test-password");
    expect(screen.getByRole("button", { name: "Đăng nhập" })).toBeEnabled();
  });
});
