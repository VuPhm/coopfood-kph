import type { ReactNode } from "react";
import { ArrowLeft, CalendarDays, FileWarning, History, House, Package } from "lucide-react";
import { figmaAsset } from "./figma-assets";
import { assetUrl } from "./asset-url";
import type { StoreProfile } from "./store-profile";
import "./store-app.css";
import "./store-header.css";
import "./store-kph-fresh.css";
import "./store-date-fresh.css";

export type Screen = "home" | "kph" | "shelf" | "date" | "login";
const screens = {
  login: { title: "Đăng nhập", subtitle: "Tài khoản cửa hàng" },
  home: { title: "Trang chủ", subtitle: "Cửa hàng hiện tại" },
  kph: { title: "KPH", subtitle: "Hàng không phù hợp" },
  shelf: { title: "Tra cứu lùi hàng", subtitle: "NSX · HSD · hạn lùi" },
  date: { title: "DATE", subtitle: "Tra mã hàng · Theo dõi lô" },
};
const homeModuleIcons = { kph: FileWarning, shelf: History, date: Package };
const mobileDestinations = [
  { screen: "home", label: "Trang chủ", icon: House },
  { screen: "kph", label: "KPH", icon: FileWarning },
  { screen: "date", label: "DATE", icon: CalendarDays },
] as const;
export function HomeModuleIcon({ screen }: { screen: keyof typeof homeModuleIcons }) {
  const Icon = homeModuleIcons[screen];
  return <span className="store-module-icon"><Icon size={28} strokeWidth={1.8} aria-hidden="true" /></span>;
}

export function readStoreScreen(): Screen {
  const key = window.location.hash.slice(1);
  if (key === "lookup") return "date";
  return key in screens ? key as Screen : "home";
}

export function StoreAppFrame({ screen, profile, navigate, onKphIntent, account, children, footer, quickOpen = false }: {
  screen: Screen; profile: StoreProfile; navigate: (screen: Screen) => void;
  onKphIntent?: () => void; account: ReactNode; children: ReactNode; footer?: ReactNode; quickOpen?: boolean;
}) {
  const raisedSurface = screen === "home" || screen === "shelf";
  return <div className={`store-app store-screen-${screen}${raisedSurface ? " store-raised-surface" : ""}`}>
    <a className="sr-only focus:not-sr-only" href="#store-content" onClick={event => { event.preventDefault(); document.getElementById("store-content")?.focus(); }}>Đến nội dung</a>
    <aside className="store-desktop-rail" aria-label="Điều hướng cửa hàng">
      <p className="store-rail-label">NGHIỆP VỤ</p>
      <nav>
        <button className={screen === "kph" ? "is-active" : ""} onPointerEnter={onKphIntent} onFocus={onKphIntent} onClick={() => navigate("kph")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherXSquare")} alt="" />KPH</button>
        <button className={screen === "date" ? "is-active" : ""} onClick={() => navigate("date")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" />DATE</button>
      </nav>
      <p className="store-rail-label">TIỆN ÍCH</p>
      <nav><button className={screen === "shelf" ? "is-active" : ""} onClick={() => navigate("shelf")}><img data-figma-render-width="18" data-figma-render-height="18" src={figmaAsset("main-0", "imgFeatherCalendar")} alt="" />Tra hạn lùi hàng</button></nav>
      <div className="store-rail-store"><small>CỬA HÀNG HIỆN TẠI</small><strong>{profile.storeName}</strong></div>
    </aside>
    <section className="store-main-column">
      <header className="store-header" onFocusCapture={raisedSurface ? () => window.scrollTo({ top: 0, behavior: "instant" }) : undefined}>
        {screen === "home" ? <button className="store-header-brand" aria-label="Co.op Food — Trang chủ" onClick={() => navigate("home")}><img src={assetUrl("brand/coopfood-home-logo-144.webp")} srcSet={`${assetUrl("brand/coopfood-home-logo-144.webp")} 144w, ${assetUrl("brand/coopfood-home-logo-288.webp")} 288w`} sizes="72px" alt="Co.op Food" width={1024} height={550} loading="eager" fetchPriority="high" decoding="async" /></button> : null}
        {screen !== "home" ? <button className="store-back" aria-label="Về trang chủ" onClick={() => navigate("home")}><ArrowLeft size={20} /></button> : null}
        <div className={screen === "home" ? "sr-only" : "store-header-copy"}><h1>{screens[screen].title}</h1><p>{screens[screen].subtitle}</p></div>
        <span className="store-header-store">{profile.storeName}</span>
        {account}
        {screen === "home" ? <div className="store-home-welcome"><span>Xin chào,</span><h2>{profile.fullName}</h2><p>Cửa hàng: {profile.storeCode} · {profile.storeName}</p></div> : null}
      </header>
      <main id="store-content" tabIndex={-1}>{children}</main>
    </section>
    <nav className="store-mobile-toolbar" hidden={quickOpen} aria-label="Điều hướng chính trên mobile">
      {mobileDestinations.map(({ screen: destination, label, icon: Icon }) => <a key={destination} href={`#${destination}`} onPointerEnter={destination === "kph" ? onKphIntent : undefined} onFocus={destination === "kph" ? onKphIntent : undefined} aria-current={screen === destination ? "page" : undefined}><span className="store-mobile-toolbar-icon"><Icon size={23} strokeWidth={1.8} aria-hidden="true" /></span><span>{label}</span></a>)}
    </nav>
    {footer}
  </div>;
}
