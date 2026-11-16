import { forwardRef, type ComponentProps, type ReactNode } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import "./desktop-chrome.css";

export function DesktopSidebar({ logo, homeHref, homeLabel, onHome, label, collapsed, onCollapsedChange, className = "", children }: {
  logo: string; homeHref: string; homeLabel: string; onHome?: () => void;
  label: string; collapsed: boolean; onCollapsedChange(value: boolean): void; className?: string; children: ReactNode;
}) {
  return <aside className={`fresh-desktop-sidebar ${className}`.trim()} aria-label={label} data-collapsed={collapsed}>
    <a className="fresh-sidebar-brand" href={homeHref} aria-label={homeLabel} onClick={onHome}>
      <span className="fresh-sidebar-logo"><img src={logo} alt="Co.op Food" width={598} height={246} /></span>
    </a>
    <div className="fresh-sidebar-navigation">{children}</div>
    <div className="fresh-sidebar-footer"><button type="button" className="fresh-sidebar-item" aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"} title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"} aria-expanded={!collapsed} onClick={() => onCollapsedChange(!collapsed)}>
      {collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}<span className="fresh-sidebar-item-label">Thu gọn thanh bên</span>
    </button></div>
  </aside>;
}

export function DesktopNavItem({ label, icon, active, href, onClick, onIntent, className = "" }: {
  label: string; icon: ReactNode; active: boolean; href?: string; className?: string; onClick?: () => void; onIntent?: (() => void) | undefined;
}) {
  const props = { className: `fresh-sidebar-item ${className}`.trim(), "aria-label": label, "aria-current": active ? "page" as const : undefined, title: label, onClick, onPointerEnter: onIntent, onFocus: onIntent };
  const content = <>{icon}<span className="fresh-sidebar-item-label">{label}</span>{active && <ChevronRight className="fresh-sidebar-item-arrow" size={14} aria-hidden="true" />}</>;
  return href ? <a {...props} href={href}>{content}</a> : <button {...props} type="button">{content}</button>;
}

/** Desktop layout is shared; mobile leading/content slots retain each app's navigation. */
export function DesktopHeader({ location, actions, mobileLeading, className = "", contentClassName = "", ...props }: Omit<ComponentProps<"header">, "children"> & {
  location: ReactNode; actions: ReactNode; mobileLeading?: ReactNode; contentClassName?: string;
}) {
  return <header className={`fresh-desktop-header ${className}`} {...props}>
    <div className={`fresh-desktop-header-inner ${contentClassName}`}>
      {mobileLeading && <div className="fresh-mobile-leading">{mobileLeading}</div>}
      <div className="fresh-desktop-location">{location}</div>
      <div className="fresh-desktop-header-actions">{actions}</div>
    </div>
  </header>;
}

export const DesktopAccountButton = forwardRef<HTMLButtonElement, ComponentProps<"button"> & {
  initials: string; name: string; detail: string; avatarClassName?: string; copyClassName?: string;
}>(({ initials, name, detail, className = "", avatarClassName = "", copyClassName = "", ...props }, ref) => <button type="button" {...props} ref={ref} className={`fresh-desktop-account ${className}`}>
  <span className={`fresh-desktop-avatar ${avatarClassName}`} aria-hidden="true">{initials}</span><span className={`fresh-desktop-account-copy ${copyClassName}`}><strong title={name}>{name}</strong><small title={detail}>{detail}</small></span><ChevronDown className="fresh-desktop-account-chevron" size={14} aria-hidden="true" />
</button>);
DesktopAccountButton.displayName = "DesktopAccountButton";
