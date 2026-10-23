import { createRef } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreAppFrame } from "./store-app-frame";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { mockProfile } from "./store-app-mock";

const account = <button type="button">Tài khoản thử nghiệm</button>;

describe("Global Store frame", () => {
  it("keeps account/sidebar identity and route selection when a feature changes its header content", () => {
    const navigate = vi.fn(); const onBack = vi.fn();
    const titleRef = createRef<HTMLHeadingElement>();
    const profile = { ...mockProfile, storeName: "Cửa hàng kiểm tra" };
    const app = render(<StoreAppFrame screen="reports" profile={profile} account={account} navigate={navigate}>
      <StorePageHero header={{ title: "Mẫu riêng", onBack, backLabel: "Về danh sách mẫu", titleRef }}><input aria-label="Tìm trong mẫu" /></StorePageHero>
    </StoreAppFrame>);
    const header = document.querySelector(".store-header");
    const sidebar = screen.getByRole("complementary", { name: "Điều hướng cửa hàng" });
    const accountControl = screen.getByRole("button", { name: "Tài khoản thử nghiệm" });
    expect(titleRef.current).toBe(screen.getByRole("heading", { name: "Mẫu riêng" }));
    expect(within(sidebar).getByRole("link", { name: "Báo cáo" })).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByText("Cửa hàng kiểm tra")).toBeInTheDocument();
    fireEvent.click(document.querySelector(".store-back")!);
    expect(onBack).toHaveBeenCalledOnce(); expect(navigate).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("navigation", { name: "Vị trí hiện tại" })).getByRole("button", { name: "Về danh sách mẫu" }));
    expect(onBack).toHaveBeenCalledTimes(2); expect(navigate).not.toHaveBeenCalled();

    app.rerender(<StoreAppFrame screen="date" profile={profile} account={account} navigate={navigate}>
      <StorePageHero><input aria-label="Tra mã hàng" /></StorePageHero>
    </StoreAppFrame>);
    expect(document.querySelectorAll(".store-header")).toHaveLength(1);
    expect(document.querySelector(".store-header")).toBe(header);
    expect(screen.getByRole("button", { name: "Tài khoản thử nghiệm" })).toBe(accountControl);
    expect(screen.getByRole("complementary", { name: "Điều hướng cửa hàng" })).toBe(sidebar);
    expect(screen.getByRole("heading", { name: "DATE" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mẫu riêng" })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole("link", { name: "Quản lý DATE" })).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: "Báo cáo" })).not.toHaveAttribute("aria-current");
    fireEvent.click(screen.getByRole("button", { name: "Về trang chủ" }));
    expect(navigate).toHaveBeenCalledWith("home");
  });

  it("uses the same page slots and app bar for Home and shelf pages", () => {
    const navigate = vi.fn();
    const app = render(<StoreAppFrame screen="home" profile={mockProfile} account={account} navigate={navigate}><StorePageLayout><StorePageHero /><StorePageSurface>Nội dung Home</StorePageSurface></StorePageLayout></StoreAppFrame>);
    expect(document.querySelectorAll(".store-header")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Trang chủ" })).toBeInTheDocument();
    expect(screen.queryByText("Cửa hàng hiện tại")).not.toBeInTheDocument();
    expect(document.querySelector(".store-header-copy > div")).toHaveClass("sr-only");
    const appBar = document.querySelector(".store-appbar-row");
    app.rerender(<StoreAppFrame screen="shelf" profile={mockProfile} account={account} navigate={navigate}><StorePageLayout><StorePageHero /><StorePageSurface>Nội dung Tra hạn</StorePageSurface></StorePageLayout></StoreAppFrame>);
    expect(document.querySelectorAll(".store-header")).toHaveLength(1);
    expect(document.querySelector(".store-appbar-row")).toBe(appBar);
    expect(screen.getByRole("heading", { name: "Tra cứu lùi hàng" })).toBeInTheDocument();
    expect(screen.queryByText("Xin chào,")).not.toBeInTheDocument();
    const features = within(screen.getByRole("navigation", { name: "Tính năng cửa hàng" }));
    expect(features.getAllByRole("link")).toHaveLength(4);
    expect(features.getByRole("link", { name: "Tra hạn lùi" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the report ancestor action when a template shares the module title", () => {
    const onBack = vi.fn();
    render(<StoreAppFrame screen="reports" profile={mockProfile} account={account} navigate={vi.fn()}>
      <StorePageHero header={{ title: "Báo cáo", onBack, backLabel: "Về menu báo cáo" }} />
    </StoreAppFrame>);
    const location = within(screen.getByRole("navigation", { name: "Vị trí hiện tại" }));
    fireEvent.click(location.getByRole("button", { name: "Về menu báo cáo" }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});
