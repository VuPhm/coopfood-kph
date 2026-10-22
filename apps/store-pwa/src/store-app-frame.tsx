import type { ReactNode } from "react";
import { StorePageHeaderContext, type StorePageHeaderOptions } from "./store-page-hero";
import { StoreAppHeader } from "./store-app-header";
import { storeScreens, type Screen, type StoreAppScreen } from "./store-app-routes";
import { StoreNavigation } from "./store-navigation";
import type { StoreProfile } from "./store-profile";
import "./store-app.css";
import "./store-frame-canvas.css";
import "./store-app-frame.css";
import "./store-header.css";
import "./store-kph-fresh.css";
import "./store-date-fresh.css";
import "./store-sticky-tabs.css";
import "./store-navigation.css";
import "./store-glass.css";
import "./store-mobile-refinements.css";

export function StoreAppFrame({ screen, profile, navigate, onKphIntent, account, children, footer, quickOpen = false }: {
  screen: StoreAppScreen; profile: StoreProfile; navigate: (screen: Screen) => void;
  onKphIntent?: () => void; account: ReactNode; children: ReactNode; footer?: ReactNode; quickOpen?: boolean;
}) {
  const definition = storeScreens[screen];
  const renderHeader = (options: StorePageHeaderOptions = {}) => <StoreAppHeader
    leading={definition.leading} title={definition.title} subtitle={definition.subtitle} storeName={profile.storeName}
    account={account} onHome={() => navigate("home")} {...options} />;
  return <div className={`store-app store-screen-${screen}`}>
    <a className="sr-only focus:not-sr-only" href="#store-page-content" onClick={event => { event.preventDefault(); document.getElementById("store-page-content")?.focus(); }}>Đến nội dung</a>
    <StoreNavigation screen={screen} profile={profile} navigate={navigate} onKphIntent={onKphIntent} hidden={quickOpen} />
    <section className="store-main-column"><div className="store-frame-canvas">
      <main id="store-content" tabIndex={-1}><StorePageHeaderContext.Provider value={renderHeader}>{children}</StorePageHeaderContext.Provider></main>
    </div></section>
    {footer}
  </div>;
}
