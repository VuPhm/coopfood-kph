import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readStoreDensity, STORE_DENSITY_KEY, StoreDensityProvider, StoreDensityScope, StoreDensitySetting, useStoreDensityValue } from "./store-density";
import { StorePageHero } from "./store-page-hero";
import { StoreAppHeader } from "./store-app-header";
import { KphCreateButton } from "./store-kph-create-button";
import { StoreReportSettings } from "./store-report-settings";
import { KphWorkspace } from "./store-kph-workspace";
import { StoreKphList } from "./store-kph-list";
import { mockRecords } from "./store-app-mock";

// This Node runtime exposes an unavailable global Web Storage getter to jsdom.
// Supply a deterministic storage boundary; browser persistence is tested in E2E.
beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    clear: () => values.clear(),
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.removeAttribute("data-store-density"); });

function Preference({ active = true }: { active?: boolean }) {
  return <StoreDensityProvider>{active ? <StoreDensityScope /> : null}<StoreDensitySetting /></StoreDensityProvider>;
}

describe("Store density preference", () => {
  it("defaults to comfortable and accepts only the known compact value", () => {
    for (const value of [null, "", "true", "dense", '{"density":"compact"}', "comfortable"]) {
      window.localStorage.clear();
      if (value !== null) window.localStorage.setItem(STORE_DENSITY_KEY, value);
      expect(readStoreDensity()).toBe("comfortable");
    }
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    expect(readStoreDensity()).toBe("compact");
  });

  it("survives a blocked storage read", () => {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => { throw new Error("denied"); });
    render(<Preference />);
    expect(screen.getByRole("switch", { name: "Chế độ gọn" })).toHaveAttribute("aria-checked", "false");
    expect(document.documentElement).toHaveAttribute("data-store-density", "comfortable");
  });

  it("applies immediately, persists and restores after remount", () => {
    const view = render(<Preference />);
    fireEvent.click(screen.getByRole("switch", { name: "Chế độ gọn" }));
    expect(window.localStorage.getItem(STORE_DENSITY_KEY)).toBe("compact");
    expect(document.documentElement).toHaveAttribute("data-store-density", "compact");
    view.unmount();
    expect(document.documentElement).not.toHaveAttribute("data-store-density");
    render(<Preference />);
    expect(screen.getByRole("switch", { name: "Chế độ gọn" })).toHaveAttribute("aria-checked", "true");
    fireEvent.click(screen.getByRole("switch", { name: "Chế độ gọn" }));
    expect(window.localStorage.getItem(STORE_DENSITY_KEY)).toBe("comfortable");
  });

  it("continues in memory when persistence fails and explains that limitation", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("quota"); });
    render(<Preference />);
    const toggle = screen.getByRole("switch", { name: "Chế độ gọn" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Đang áp dụng trong phiên này");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("keeps draft and selection nodes in an already open portal without re-rendering the workspace", () => {
    let renders = 0;
    function Workspace() {
      renders++;
      const [draft, setDraft] = useState("");
      const [selected, setSelected] = useState(false);
      return createPortal(<div className="store-create-screen"><input aria-label="Draft" value={draft} onChange={event => setDraft(event.target.value)} /><input type="checkbox" aria-label="Selected" checked={selected} onChange={event => setSelected(event.target.checked)} /></div>, document.body);
    }
    render(<StoreDensityProvider><StoreDensityScope /><StoreDensitySetting /><Workspace /></StoreDensityProvider>);
    const draft = screen.getByRole("textbox", { name: "Draft" });
    fireEvent.change(draft, { target: { value: "Đang nhập" } });
    fireEvent.click(screen.getByRole("checkbox", { name: "Selected" }));
    const before = renders;
    fireEvent.click(screen.getByRole("switch", { name: "Chế độ gọn" }));
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("Đang nhập");
    expect(screen.getByRole("checkbox", { name: "Selected" })).toBeChecked();
    expect(renders).toBe(before);
    expect(draft.closest("html")).toHaveAttribute("data-store-density", "compact");
  });

  it("removes scope on login/unmount and reapplies the in-session choice on return", () => {
    const view = render(<Preference />);
    fireEvent.click(screen.getByRole("switch", { name: "Chế độ gọn" }));
    view.rerender(<Preference active={false} />);
    expect(document.documentElement).not.toHaveAttribute("data-store-density");
    view.rerender(<Preference active />);
    expect(document.documentElement).toHaveAttribute("data-store-density", "compact");
  });

  it("uses the stored preference for the pre-entry loading frame", () => {
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    render(<StoreDensityScope />);
    expect(document.documentElement).toHaveAttribute("data-store-density", "compact");
  });

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

  it("provides two direct Compact create actions without repeated caption/card structure", () => {
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    const dry = vi.fn(), fresh = vi.fn();
    render(<StoreDensityProvider><KphCreateButton kind="TPCN" onClick={dry} /><KphCreateButton kind="TPTS" onClick={fresh} /></StoreDensityProvider>);
    const dryButton=screen.getByRole("button", { name: "Tạo phiếu TP khô & khác" });
    expect(dryButton).toHaveTextContent("Tạo TPCN");
    expect(dryButton.querySelector(".store-create-kind-label,.store-create-heading")).toBeNull();
    fireEvent.click(dryButton);fireEvent.click(screen.getByRole("button", { name: "Tạo phiếu TP tươi sống" }));
    expect(dry).toHaveBeenCalledOnce();expect(fresh).toHaveBeenCalledOnce();
  });

  it("keeps sort available in the existing filter when Compact removes the standalone shortcut", () => {
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    render(<StoreDensityProvider><StoreDensitySetting /><KphWorkspace records={mockRecords} onRecordsChange={vi.fn()} onNotice={vi.fn()} /></StoreDensityProvider>);
    expect(screen.getAllByRole("button", { name: /^Tạo phiếu TP/ })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /^Sắp xếp phiếu:/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lọc phiếu KPH" }));
    fireEvent.click(screen.getByRole("button", { name: "Tên hàng" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "Lọc & sắp xếp" })).getByRole("button", { name: "Xong" }));
    fireEvent.click(screen.getByRole("switch", { name: "Chế độ gọn" }));
    expect(screen.getByRole("button", { name: "Sắp xếp phiếu: Tên hàng" })).toBeInTheDocument();
  });

  it("preserves report settings meaning and callbacks in the reduced composition", () => {
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    const period=vi.fn(), filter=vi.fn();
    render(<StoreDensityProvider><StoreReportSettings period="01/10/2026 – 31/10/2026" scope="Hết HSD · Mở" filterCount={2} onPeriod={period} onFilter={filter} /></StoreDensityProvider>);
    const group=screen.getByRole("region", { name: "Thiết lập báo cáo" });
    expect(group.querySelectorAll("button")).toHaveLength(2);
    expect(group.querySelector(".store-settings-row")).toBeNull();
    const periodButton=screen.getByRole("button", { name: "Chọn kỳ báo cáo" });
    expect(periodButton).toHaveAccessibleDescription("01/10/2026 – 31/10/2026");
    const filterButton=screen.getByRole("button", { name: "Lọc danh mục báo cáo" });
    expect(filterButton).toHaveAccessibleDescription("Hết HSD · Mở");
    fireEvent.click(periodButton);fireEvent.click(filterButton);
    expect(period).toHaveBeenCalledOnce();expect(filter).toHaveBeenCalledOnce();
  });

  it("uses the comfortable composition for print and restores Compact without losing a draft", () => {
    window.localStorage.setItem(STORE_DENSITY_KEY, "compact");
    let printing=false;const listeners=new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({get matches(){return printing;},addEventListener:(_type:string,listener:()=>void)=>listeners.add(listener),removeEventListener:(_type:string,listener:()=>void)=>listeners.delete(listener)}));
    function View(){ const density=useStoreDensityValue();return <><p>{density}</p><input aria-label="Print draft" defaultValue="Đang nhập" /></>; }
    render(<StoreDensityProvider><View /></StoreDensityProvider>);
    const draft=screen.getByRole("textbox", { name: "Print draft" });expect(screen.getByText("compact")).toBeInTheDocument();
    act(()=>{printing=true;listeners.forEach(notify=>notify());});expect(screen.getByText("comfortable")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Print draft" })).toBe(draft);
    act(()=>{printing=false;listeners.forEach(notify=>notify());});expect(screen.getByText("compact")).toBeInTheDocument();expect(draft).toHaveValue("Đang nhập");
  });

  it("keeps the accepted dense list in either screen preference and restores full labels for print", () => {
    let printing=false; const listeners=new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({get matches(){return printing;},addEventListener:(_type:string,listener:()=>void)=>listeners.add(listener),removeEventListener:(_type:string,listener:()=>void)=>listeners.delete(listener)}));
    render(<StoreDensityProvider><StoreDensitySetting /><StoreKphList desktop={false} visible={[mockRecords[0]!]} /></StoreDensityProvider>);
    const row=document.querySelector('[data-record-id]');
    const labels=()=>document.querySelectorAll('.store-ticket-tags [data-label-kind]');
    expect(document.querySelector('.store-ticket-quick [data-label-kind="approval"]')).not.toBeNull();
    expect(labels()).toHaveLength(2);
    fireEvent.click(screen.getByRole('switch',{name:'Chế độ gọn'}));
    expect(document.querySelector('[data-record-id]')).toBe(row);expect(labels()).toHaveLength(2);
    act(()=>{printing=true;listeners.forEach(notify=>notify());});
    expect(labels()).toHaveLength(3);expect(document.querySelector('.store-ticket-quick [data-label-kind="approval"]')).toBeNull();
    act(()=>{printing=false;listeners.forEach(notify=>notify());});
    expect(document.querySelector('[data-record-id]')).toBe(row);expect(labels()).toHaveLength(2);
  });
});
