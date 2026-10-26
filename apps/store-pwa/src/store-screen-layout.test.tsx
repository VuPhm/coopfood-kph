import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createPortal } from "react-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StorePageHero } from "./store-page-hero";
import { StoreAppHeader } from "./store-app-header";
import { KphCreateButton } from "./store-kph-create-button";
import { StoreReportSettings } from "./store-report-settings";
import { KphWorkspace } from "./store-kph-workspace";
import { StoreKphList } from "./store-kph-list";
import { StoreAccountControl } from "./store-account-sheet";
import { mockProfile, mockRecords } from "./store-app-mock";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Store single screen layout", () => {
  it("keeps account and portal focus from resetting the reading position, while revealing other hero controls", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const account = <><button className="store-account">Tài khoản</button>{createPortal(<button>Cài đặt popup</button>, document.body)}</>;
    render(<StorePageHero appHeader={<StoreAppHeader title="KPH" subtitle="KPH" account={account} onHome={() => {}} />}><input aria-label="Tìm hàng" /></StorePageHero>);
    fireEvent.focus(screen.getByRole("button", { name: "Tài khoản" }));
    fireEvent.focus(screen.getByRole("button", { name: "Cài đặt popup" }));
    expect(scroll).not.toHaveBeenCalled();
    fireEvent.focus(screen.getByRole("textbox", { name: "Tìm hàng" }));
    expect(scroll).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
  });


  it.each(["comfortable", "compact", "invalid"])("ignores the retired preference %s without reading storage", value => {
    const getItem = vi.fn(() => value);
    vi.stubGlobal("localStorage", { getItem, setItem: vi.fn() });
    const dry = vi.fn(), fresh = vi.fn();
    render(<><KphCreateButton kind="TPCN" onClick={dry} /><KphCreateButton kind="TPTS" onClick={fresh} /></>);
    const button = screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" });
    expect(button).toHaveTextContent("Tạo TPCN");
    expect(button.querySelector(".store-create-kind-label,.store-create-heading")).toBeNull();
    fireEvent.click(button); fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu TP tươi sống" }));
    expect(dry).toHaveBeenCalledOnce(); expect(fresh).toHaveBeenCalledOnce();
    expect(getItem).not.toHaveBeenCalled();
  });

  it("has no appearance switch in the actual account sheet and keeps actions", () => {
    render(<StoreAccountControl profile={mockProfile} onHome={vi.fn()} onLoginPreview={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Tài khoản và cửa hàng" }));
    expect(screen.queryByRole("switch", { name: "Chế độ gọn" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Tài khoản" })).toHaveTextContent(mockProfile.storeName);
    expect(screen.getByRole("button", { name: "Trang chủ" })).toBeInTheDocument();
  });

  it("keeps sort in the filter and preserves selection after filtering", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    render(<KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} />);
    expect(screen.getAllByRole("button", { name: /^Tạo phiếu TP/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^Sắp xếp phiếu:/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    fireEvent.click(screen.getByRole("button", { name: "Tên hàng" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Lọc & sắp xếp" })).getByRole("button", { name: "Xong" }));
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    expect(screen.getByRole("button", { name: "Tên hàng" })).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps both report setting actions and their accessible context", () => {
    const period=vi.fn(), filter=vi.fn();
    render(<StoreReportSettings period="01/10/2026 – 31/10/2026" scope="Hết HSD · Mở" filterCount={2} onPeriod={period} onFilter={filter} />);
    const group=screen.getByRole("region", { name: "Thiết lập báo cáo" });
    expect(group.querySelectorAll("button")).toHaveLength(2);
    expect(group.querySelector(".store-settings-row")).toBeNull();
    const periodButton=screen.getByRole("button", { name: "Chọn kỳ báo cáo" });
    expect(periodButton).toHaveAccessibleDescription("01/10/2026 – 31/10/2026");
    const filterButton=screen.getByRole("button", { name: "Lọc danh mục báo cáo" });
    expect(filterButton).toHaveAccessibleDescription("Hết HSD · Mở");
    fireEvent.click(periodButton); fireEvent.click(filterButton);
    expect(period).toHaveBeenCalledOnce(); expect(filter).toHaveBeenCalledOnce();
  });

  it("prints all labels and restores the same screen row without losing selection", () => {
    let printing=false; const listeners=new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({get matches(){return printing;},addEventListener:(_type:string,listener:()=>void)=>listeners.add(listener),removeEventListener:(_type:string,listener:()=>void)=>listeners.delete(listener)}));
    render(<StoreKphList desktop={false} visible={[mockRecords[0]!]} />);
    const row=document.querySelector('[data-record-id]');
    const labels=()=>document.querySelectorAll('.store-ticket-tags [data-label-kind]');
    expect(document.querySelector('.store-ticket-quick [data-label-kind="approval"]')).not.toBeNull();
    expect(labels()).toHaveLength(2);
    act(()=>{printing=true;listeners.forEach(notify=>notify());});
    expect(labels()).toHaveLength(3);expect(document.querySelector('.store-ticket-quick [data-label-kind="approval"]')).toBeNull();
    act(()=>{printing=false;listeners.forEach(notify=>notify());});
    expect(document.querySelector('[data-record-id]')).toBe(row);expect(labels()).toHaveLength(2);
  });
});
