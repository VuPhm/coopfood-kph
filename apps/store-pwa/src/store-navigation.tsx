import { useEffect, useState } from "react";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import { storeFeatures, storePrimaryNavigation, isStoreFeature, type Screen, type StoreFeatureScreen } from "./store-app-routes";
import type { StoreProfile } from "./store-profile";
import { assetUrl } from "./asset-url";

const recentKey = "coopfood:store-recent-feature:v1";
function readRecent(screen: Screen): StoreFeatureScreen | null {
  if (isStoreFeature(screen)) return screen;
  try { const value = sessionStorage.getItem(recentKey); return isStoreFeature(value) ? value : null; } catch { return null; }
}

export function StoreNavigation({ screen, profile, navigate, onKphIntent, hidden = false }: {
  screen: Screen; profile: StoreProfile; navigate: (screen: Screen) => void; onKphIntent?: (() => void) | undefined; hidden?: boolean;
}) {
  const [recent, setRecent] = useState<StoreFeatureScreen | null>(() => readRecent(screen));
  useEffect(() => {
    if (!isStoreFeature(screen)) return;
    setRecent(screen);
    try { sessionStorage.setItem(recentKey, screen); } catch { /* Navigation remains available without preference storage. */ }
  }, [screen]);
  const latest = storeFeatures.find(feature => feature.screen === (isStoreFeature(screen) ? screen : recent));
  const LatestIcon = latest?.icon ?? LayoutGrid;
  const link = (route: Screen, label: string, Icon: LucideIcon) => <a key={route} href={`#${route}`} aria-current={screen === route ? "page" : undefined}
    onPointerEnter={route === "kph" ? onKphIntent : undefined} onFocus={route === "kph" ? onKphIntent : undefined}><Icon size={21} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></a>;
  const primaryLinks = () => storePrimaryNavigation.map(item => link(item.screen, item.label, item.icon));
  return <>
    <aside className="store-desktop-rail" aria-label="Điều hướng cửa hàng">
      <a className="store-sidebar-brand" href="#home" aria-label="Co.op Food — Trang chủ"><img src={assetUrl("brand/coopfood-home-logo-144.webp")} alt="Co.op Food" width={72} height={39} /><span>Vận hành cửa hàng</span></a>
      <nav aria-label="Điều hướng chung">{primaryLinks()}</nav>
      <p className="store-rail-label">TÍNH NĂNG</p>
      <nav aria-label="Tính năng cửa hàng">{storeFeatures.map(feature => link(feature.screen, feature.sidebarLabel, feature.icon))}</nav>
      <div className="store-rail-store"><small>CỬA HÀNG HIỆN TẠI</small><strong>{profile.storeName}</strong><span>Mã cửa hàng {profile.storeCode}</span></div>
    </aside>
    <nav className="store-mobile-toolbar" hidden={hidden} aria-label="Điều hướng chính trên mobile">
      {primaryLinks()}
      <a href={`#${latest?.screen ?? "home"}`} data-recent-feature={latest?.screen ?? ""} aria-current={latest && screen === latest.screen ? "page" : undefined}
        title={latest ? `Tính năng gần nhất: ${latest.title}` : "Tất cả tính năng"}
        onPointerEnter={latest?.screen === "kph" ? onKphIntent : undefined} onFocus={latest?.screen === "kph" ? onKphIntent : undefined}
        onClick={latest ? undefined : event => { event.preventDefault(); navigate("home"); requestAnimationFrame(() => document.getElementById("store-home-features")?.scrollIntoView({ block: "start" })); }}>
        <LatestIcon size={23} strokeWidth={1.8} aria-hidden="true" /><span>{latest?.label ?? "Tính năng"}</span>
      </a>
    </nav>
  </>;
}
