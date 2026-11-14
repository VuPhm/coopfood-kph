import { useStoreDesktopLayout } from "./use-store-desktop-layout";
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
import "./store-desktop-chrome.css";

export function StoreAppFrame({ screen, profile, navigate, onKphIntent, account, children, footer, quickOpen = false }: {
  screen: StoreAppScreen; profile: StoreProfile; navigate: (screen: Screen) => void;
  onKphIntent?: () => void; account: ReactNode; children: ReactNode; footer?: ReactNode; quickOpen?: boolean;
}) {
  const definition = storeScreens[screen];
  const desktop = useStoreDesktopLayout();
  const renderHeader = (options: StorePageHeaderOptions = {}) => {
    const title = options.title ?? definition.title;
    const subtitle = options.subtitle ?? definition.subtitle;
    return <><StoreAppHeader
      leading={definition.leading} title={title} subtitle={subtitle} storeName={profile.storeName}
      account={account} hideCopy={screen === "home"} onHome={() => navigate("home")}
      {...(options.onBack ? { parent: { label: definition.title, onNavigate: options.onBack } } : {})} {...options} heading={!desktop} />
      {desktop && <div className="store-desktop-page-heading"><h1 id={options.titleId} ref={options.titleRef} tabIndex={options.titleRef ? -1 : undefined}>{title}</h1>{screen !== "home" && subtitle && <p>{subtitle}</p>}</div>}
    </>;
  };
  return <div className={`store-app fresh-desktop-frame store-screen-${screen}`}>
    <a className="sr-only focus:not-sr-only" href="#store-page-content" onClick={event => { event.preventDefault(); document.getElementById("store-page-content")?.focus(); }}>Đến nội dung</a>
    <StoreNavigation screen={screen} profile={profile} navigate={navigate} onKphIntent={onKphIntent} hidden={quickOpen} />
    <section className="store-main-column"><div className="store-frame-canvas">
      <main id="store-content" tabIndex={-1}><StorePageHeaderContext.Provider value={renderHeader}>{children}</StorePageHeaderContext.Provider></main>
    </div></section>
    {footer}
  </div>;
}
