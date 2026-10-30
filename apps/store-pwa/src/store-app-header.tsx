import type { ReactNode, Ref } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { assetUrl } from "./asset-url";
import "./store-header.css";

export type StorePageHeaderOptions = {
  title?: string; subtitle?: string; onBack?: () => void; backLabel?: string; titleRef?: Ref<HTMLHeadingElement>; titleId?: string;
};

/** One row and one geometry for every page, including Home, shelf and sign-in. */
export function StoreAppHeader({ leading = "back", title, subtitle, storeName, account, onHome, onBack = onHome, backLabel = "Về trang chủ", titleRef, titleId, hideCopy = false, parent }: {
  hideCopy?: boolean; parent?: { label: string; onNavigate: () => void };
  leading?: "brand" | "back"; title: string; subtitle: string; storeName?: string;
  account?: ReactNode; onHome?: () => void; onBack?: () => void; backLabel?: string; titleRef?: Ref<HTMLHeadingElement>; titleId?: string;
}) {
  const logo = <img src={assetUrl("brand/coopfood-home-logo-144.webp")} alt="Co.op Food" width={1024} height={550} loading="eager" fetchPriority="high" decoding="async" />;
  return <header className={`store-header${hideCopy ? " is-home" : ""}`} onFocusCapture={event => {
    if (!event.currentTarget.contains(event.target) || event.target.closest(".store-account, .store-online-account")) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }}>
    <div className="store-appbar-row">
      {leading === "brand" ? onHome ? <button type="button" className="store-header-brand" aria-label="Co.op Food — Trang chủ" onClick={onHome}>{logo}</button> : <span className="store-header-brand">{logo}</span>
        : <button type="button" className="store-back" aria-label={backLabel} onClick={onBack}><ArrowLeft size={20} aria-hidden="true" /></button>}
      <div className="store-header-copy"><div className={hideCopy ? "sr-only" : undefined}>
        <nav className="store-header-location" aria-label="Vị trí hiện tại"><ol>
          {!hideCopy && onHome ? <li className="store-header-ancestor"><button type="button" onClick={onHome}>Trang chủ</button><ChevronRight size={14} aria-hidden="true" /></li> : null}
          {!hideCopy && parent ? <li className="store-header-ancestor"><button type="button" onClick={parent.onNavigate} aria-label={backLabel}>{parent.label}</button><ChevronRight size={14} aria-hidden="true" /></li> : null}
          <li aria-current="page"><h1 title={title} id={titleId} ref={titleRef} tabIndex={titleRef ? -1 : undefined}>{title}</h1></li>
        </ol></nav>
        {!hideCopy && subtitle ? <p title={subtitle}>{subtitle}</p> : null}
      </div>{storeName ? <span className="store-header-store" title={storeName}>{storeName}</span> : null}</div>
      <div className="store-header-account">{account}</div>
    </div>
  </header>;
}
