import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StoreApp } from "./store-app";

describe("Store App session and route ownership", () => {
  beforeEach(() => {
    window.location.hash = "home";
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  it("retains DATE updates across Home navigation and updates the Home summary", async () => {
    render(<StoreApp />);
    const home = () => within(document.querySelector('.store-launcher-mobile') as HTMLElement);
    fireEvent.click(home().getByRole("button", { name: "Quản lý DATE" }));
    fireEvent.click(await screen.findByRole("button", { name: /Sản phẩm C/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Ghi nhận" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Xử lý cảnh báo DATE" })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    await screen.findByText("1 cảnh báo đang mở");
    fireEvent.click(home().getByRole("button", { name: "Quản lý DATE" }));
    await screen.findByRole("heading", { name: "Cần xử lý" });
    expect(screen.queryByRole("button", { name: /Sản phẩm C/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Đã ghi nhận 3/ }));
    expect(screen.getByRole("button", { name: /Sản phẩm C/ })).toBeInTheDocument();
  });

  it("dismisses the quick utility when changing routes", async () => {
    render(<StoreApp />);
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "KPH" }));
    fireEvent.click(await screen.findByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" }));
    expect(screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).not.toBeInTheDocument());
    fireEvent.click(within(document.querySelector('.store-launcher-mobile') as HTMLElement).getByRole("button", { name: "Tra cứu lùi hàng" }));
    await screen.findByRole("textbox", { name: "Ngày sản xuất" });
    expect(document.querySelectorAll('#shelf-nsx')).toHaveLength(1);
    expect(document.querySelector('#quick-shelf-nsx')).toBeNull();
  });
});

it("keeps quick utility inputs when dismissing the account dialog", async () => {
  window.location.hash = "kph";
  await new Promise(resolve => setTimeout(resolve, 0));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(<StoreApp />);
  fireEvent.click(screen.getByRole("button", { name: "Mở tiện ích tra cứu lùi hàng" }));
  const quick = screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" });
  fireEvent.change(within(quick).getByRole("textbox", { name: "Ngày sản xuất" }), { target: { value: "01/10/2026" } });
  fireEvent.click(screen.getByRole("button", { name: "Tài khoản và cửa hàng" }));
  fireEvent.keyDown(await screen.findByRole("dialog", { name: "Tài khoản" }), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tài khoản" })).not.toBeInTheDocument());
  expect(within(screen.getByRole("dialog", { name: "Tra cứu lùi hàng nhanh" })).getByRole("textbox", { name: "Ngày sản xuất" })).toHaveValue("01/10/2026");
});

it("dismisses the account dialog after a hash route change", async () => {
  window.location.hash = "kph";
  await new Promise(resolve => setTimeout(resolve, 0));
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  render(<StoreApp />);
  fireEvent.click(screen.getByRole("button", { name: "Tài khoản và cửa hàng" }));
  await screen.findByRole("dialog", { name: "Tài khoản" });
  window.location.hash = "date"; fireEvent(window, new Event("hashchange"));
  await waitFor(() => expect(screen.queryByRole("dialog", { name: "Tài khoản" })).not.toBeInTheDocument());
  await waitFor(() => expect(document.getElementById("store-content")).toHaveFocus());
});
