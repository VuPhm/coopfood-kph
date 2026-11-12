import { useState, type ReactNode } from "react";
import { Boxes, CalendarClock, ChevronDown, ChevronRight, KeyRound, LayoutDashboard, LogOut, Menu, PanelLeftClose, PanelLeftOpen, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@coopfood-kph/ui";
import type { AdminSession } from "./lifecycle-admin";

export type AdminWorkspace = "overview" | "identity" | "catalog" | "lifecycle";
const destinations = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, group: "Không gian làm việc" },
  { id: "identity", label: "Tài khoản", icon: Users, group: "Quản lý vận hành" },
  { id: "catalog", label: "Catalog", icon: Boxes, group: "Quản lý vận hành" },
  { id: "lifecycle", label: "Lifecycle", icon: CalendarClock, group: "Quản lý vận hành" },
] as const;

export function AdminShell({ session, workspace, canIdentity, canCatalog, canLifecycle, onNavigate, onChangePassword, onLogout, logoutBusy, children }: {
  session: AdminSession; workspace: AdminWorkspace; canIdentity: boolean; canCatalog: boolean; canLifecycle: boolean;
  onNavigate(workspace: AdminWorkspace): void; onChangePassword(): void; onLogout(): void; logoutBusy: boolean; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = destinations.filter(item => item.id === "overview" || item.id === "identity" && canIdentity || item.id === "catalog" && canCatalog || item.id === "lifecycle" && canLifecycle);
  const current = destinations.find(item => item.id === workspace)!;
  const role = canIdentity ? "Quản trị chuỗi" : canCatalog && !canLifecycle ? "Quản trị catalog" : canLifecycle ? "Quản lý vận hành" : "Tài khoản";
  function navigate(id: AdminWorkspace) { onNavigate(id); setMobileOpen(false); }
  const nav = <nav aria-label="Điều hướng Admin">{items.map((item, index) => <div key={item.id}>
    {(index > 0 && item.group !== items[index - 1]?.group) && <p className="admin-nav-group">{item.group}</p>}
    <button type="button" aria-current={workspace === item.id ? "page" : undefined} className={`admin-nav-item ${workspace === item.id ? "is-active" : ""}`} title={item.label} onClick={() => navigate(item.id)}><item.icon size={18} aria-hidden="true" /><span>{item.label}</span>{workspace === item.id && <ChevronRight className="nav-arrow" size={14} aria-hidden="true" />}</button>
  </div>)}</nav>;
  return <div className={`admin-shell ${collapsed ? "is-collapsed" : ""}`}>
    <a href="#admin-main" className="admin-skip" onClick={event => { event.preventDefault(); document.getElementById("admin-main")?.focus(); }}>Bỏ qua đến nội dung chính</a>
    <aside className="admin-sidebar" aria-label="Thanh bên Admin">
      <a className="admin-brand" href="#overview" onClick={() => navigate("overview")} aria-label="Co.op Food Admin · Tổng quan"><span className="admin-logo"><img src={`${import.meta.env.BASE_URL}brand/coopfood-logo-light.png`} alt="Co.op Food" width={598} height={246} /></span><span><small>Admin</small></span></a>
      {nav}
      <div className="admin-sidebar-footer"><button className="admin-nav-item collapse-button" type="button" aria-expanded={!collapsed} aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelLeftOpen size={18} aria-hidden="true" /> : <PanelLeftClose size={18} aria-hidden="true" />}<span>Thu gọn thanh bên</span></button></div>
    </aside>
    <div className="admin-inset">
      <header className="admin-topbar">
        <div className="admin-breadcrumb"><button className="admin-icon-button mobile-menu" aria-label="Mở điều hướng" onClick={() => setMobileOpen(true)}><Menu size={20} aria-hidden="true" /></button><strong>{current.label}</strong></div>
        <div className="admin-topbar-actions"><span className={`admin-source ${workspace === "overview" ? "is-mock" : ""}`}><span />{workspace === "overview" ? "Dữ liệu minh họa" : "Dữ liệu API"}</span>
          <DropdownMenu><DropdownMenuTrigger asChild><button className="admin-account" aria-label="Menu tài khoản"><span className="admin-avatar">{session.user.displayName.trim().split(/\s+/).slice(-2).map(x => x[0]).join("")}</span><span className="account-copy"><strong>{session.user.displayName}</strong><small>{role}</small></span><ChevronDown size={14} aria-hidden="true" /></button></DropdownMenuTrigger>
            <DropdownMenuContent className="admin-account-menu"><DropdownMenuLabel>{session.user.username}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={onChangePassword}><KeyRound size={16} aria-hidden="true" />Đổi mật khẩu</DropdownMenuItem><DropdownMenuItem className="admin-signout" disabled={logoutBusy} onSelect={onLogout}><LogOut size={16} aria-hidden="true" />{logoutBusy ? "Đang đăng xuất…" : "Đăng xuất"}</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main id="admin-main" className="admin-content" tabIndex={-1}>{children}</main>

    </div>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent className="admin-mobile-nav" closeTone="neutral"><DialogHeader><DialogTitle>Co.op Food Admin</DialogTitle><DialogDescription>Điều hướng không gian quản trị</DialogDescription></DialogHeader>{nav}</DialogContent></Dialog>
  </div>;
}
