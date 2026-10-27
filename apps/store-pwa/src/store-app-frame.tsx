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
import "./store-feature-colors.css";
import "./store-kph-fresh.css";
import "./store-date-fresh.css";
import "./store-sticky-tabs.css";
import "./store-navigation.css";
import "./store-material.css";
import "./store-mobile-refinements.css";
import "./store-scrollbars.css";
import "./store-form-soft.css";
import "./store-component-soft.css";
import "./store-button-system.css";
import "./store-chrome-soft.css";
import "./store-size-tokens.css";
import "./store-functional-layout.css";
import "./store-record-items.css";
import "./store-utility-layout.css";
import "./store-fresh-foundations.css";
import "./store-date-notification-surfaces.css";

export function StoreAppFrame({ screen, profile, navigate, onKphIntent, account, children, footer, quickOpen = false }: {
  screen: StoreAppScreen; profile: StoreProfile; navigate: (screen: Screen) => void;
  onKphIntent?: () => void; account: ReactNode; children: ReactNode; footer?: ReactNode; quickOpen?: boolean;
}) {
  const definition = storeScreens[screen];
  const renderHeader = (options: StorePageHeaderOptions = {}) => <StoreAppHeader
    leading={definition.leading} title={definition.title} subtitle={definition.subtitle} storeName={profile.storeName}
    account={account} hideCopy={screen === "home"} onHome={() => navigate("home")}
    {...(options.onBack ? { parent: { label: definition.title, onNavigate: options.onBack } } : {})} {...options} />;
  return <div className={`store-app store-screen-${screen}`}>
    <a className="sr-only focus:not-sr-only" href="#store-page-content" onClick={event => { event.preventDefault(); document.getElementById("store-page-content")?.focus(); }}>Đến nội dung</a>
    <StoreNavigation screen={screen} profile={profile} navigate={navigate} onKphIntent={onKphIntent} hidden={quickOpen} />
    <section className="store-main-column"><div className="store-frame-canvas">
      <main id="store-content" tabIndex={-1}><StorePageHeaderContext.Provider value={renderHeader}>{children}</StorePageHeaderContext.Provider></main>
    </div></section>
    {footer}
  </div>;
}
