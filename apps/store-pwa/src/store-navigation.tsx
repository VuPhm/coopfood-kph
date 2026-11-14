import { DesktopSidebar, DesktopNavItem } from "@coopfood-kph/ui";
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
  const [collapsed, setCollapsed] = useState(false);
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
    <DesktopSidebar label="Điều hướng cửa hàng" logo={assetUrl("brand/coopfood-logo-light.png")} appName="Store" homeHref="#home" homeLabel="Co.op Food — Trang chủ" collapsed={collapsed} onCollapsedChange={setCollapsed}>
      <nav aria-label="Điều hướng chung">{storePrimaryNavigation.map(item => <DesktopNavItem key={item.screen} href={`#${item.screen}`} label={item.label} icon={<item.icon size={18} aria-hidden="true" />} active={screen === item.screen} />)}</nav>
      <p className="fresh-sidebar-group-title">Tính năng</p>
      <nav aria-label="Tính năng cửa hàng">{storeFeatures.map(feature => <DesktopNavItem key={feature.screen} href={`#${feature.screen}`} label={feature.sidebarLabel} icon={<feature.icon size={18} aria-hidden="true" />} active={screen === feature.screen} onIntent={feature.screen === "kph" ? onKphIntent : undefined} />)}</nav>
    </DesktopSidebar>
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
