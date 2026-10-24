import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readStoreDensity, STORE_DENSITY_KEY, StoreDensityProvider, StoreDensityScope, StoreDensitySetting } from "./store-density";
import { StorePageHero } from "./store-page-hero";
import { StoreAppHeader } from "./store-app-header";

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
});
