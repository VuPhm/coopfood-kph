import { useState, type ReactNode } from "react";
import { Boxes, ClipboardList, CalendarClock, KeyRound, LayoutDashboard, LogOut, Menu, UserRoundCog, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DesktopSidebar, DesktopNavItem, DesktopHeader, DesktopAccountButton } from "@coopfood-kph/ui";
import type { AdminSession } from "./lifecycle-admin";

export type AdminWorkspace = "overview" | "kph" | "identity" | "catalog" | "lifecycle" | "memberships";
const destinations = [
  { id: "overview", label: "Tổng quan", icon: LayoutDashboard, group: "Không gian làm việc" },
  { id: "kph", label: "Phiếu KPH", icon: ClipboardList, group: "Quản lý vận hành" },
  { id: "identity", label: "Tài khoản", icon: Users, group: "Quản lý vận hành" },
  { id: "memberships", label: "Quyền cửa hàng", icon: UserRoundCog, group: "Quản lý vận hành" },
  { id: "catalog", label: "Catalog", icon: Boxes, group: "Quản lý vận hành" },
  { id: "lifecycle", label: "Lifecycle", icon: CalendarClock, group: "Quản lý vận hành" },
] as const;

export function AdminShell({ session, workspace, canMonitorKph, canIdentity, canCatalog, canLifecycle, canMemberships, onNavigate, onChangePassword, onLogout, logoutBusy, children }: {
  session: AdminSession; workspace: AdminWorkspace; canMonitorKph: boolean; canIdentity: boolean; canCatalog: boolean; canLifecycle: boolean; canMemberships: boolean;
  onNavigate(workspace: AdminWorkspace): void; onChangePassword(): void; onLogout(): void; logoutBusy: boolean; children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = destinations.filter(item => item.id === "overview" || item.id === "kph" && canMonitorKph || item.id === "identity" && canIdentity || item.id === "catalog" && canCatalog || item.id === "lifecycle" && canLifecycle || item.id === "memberships" && canMemberships);
  const current = destinations.find(item => item.id === workspace)!;
  const role = canIdentity ? "Quản trị chuỗi" : canMonitorKph ? "Quản trị vùng" : canCatalog && !canLifecycle ? "Quản trị catalog" : canLifecycle ? "Quản lý vận hành" : "Tài khoản";
  function navigate(id: AdminWorkspace) { onNavigate(id); setMobileOpen(false); }
  const nav = <nav aria-label="Điều hướng Admin">{items.map((item, index) => <div key={item.id}>
    {(index > 0 && item.group !== items[index - 1]?.group) && <p className="admin-nav-group fresh-sidebar-group-title">{item.group}</p>}
    <DesktopNavItem className={`admin-nav-item ${workspace === item.id ? "is-active" : ""}`} label={item.label} icon={<item.icon size={18} aria-hidden="true" />} active={workspace === item.id} onClick={() => navigate(item.id)} />
  </div>)}</nav>;
  return <div className={`admin-shell fresh-desktop-frame ${collapsed ? "is-collapsed" : ""}`}>
    <a href="#admin-main" className="admin-skip" onClick={event => { event.preventDefault(); document.getElementById("admin-main")?.focus(); }}>Bỏ qua đến nội dung chính</a>
    <DesktopSidebar className="admin-sidebar" label="Thanh bên Admin" logo={`${import.meta.env.BASE_URL}brand/coopfood-logo-light.png`} homeHref="#overview" homeLabel="Co.op Food Admin · Tổng quan" onHome={() => navigate("overview")} collapsed={collapsed} onCollapsedChange={setCollapsed}>{nav}</DesktopSidebar>
    <div className="admin-inset">
      <DesktopHeader className="admin-topbar" location={<div className="admin-breadcrumb"><button className="admin-icon-button mobile-menu" aria-label="Mở điều hướng" onClick={() => setMobileOpen(true)}><Menu size={20} aria-hidden="true" /></button><strong>{current.label}</strong></div>} actions={<div className="admin-topbar-actions"><span className={`admin-source ${workspace === "overview" ? "is-mock" : ""}`}><span />{workspace === "overview" ? "Dữ liệu minh họa" : "Dữ liệu API"}</span>
          <DropdownMenu><DropdownMenuTrigger asChild><DesktopAccountButton className="admin-account" aria-label="Menu tài khoản" initials={session.user.displayName.trim().split(/\s+/).slice(-2).map(x => x[0]).join("")} name={session.user.displayName} detail={role} avatarClassName="admin-avatar" copyClassName="account-copy" /></DropdownMenuTrigger>
            <DropdownMenuContent className="admin-account-menu"><DropdownMenuLabel>{session.user.username}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={onChangePassword}><KeyRound size={16} aria-hidden="true" />Đổi mật khẩu</DropdownMenuItem><DropdownMenuItem className="admin-signout" disabled={logoutBusy} onSelect={onLogout}><LogOut size={16} aria-hidden="true" />{logoutBusy ? "Đang đăng xuất…" : "Đăng xuất"}</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>} />
      <main id="admin-main" className="admin-content" tabIndex={-1}>{children}</main>

    </div>
    <Dialog open={mobileOpen} onOpenChange={setMobileOpen}><DialogContent className="admin-mobile-nav" closeTone="neutral"><DialogHeader><DialogTitle>Co.op Food Admin</DialogTitle><DialogDescription>Điều hướng không gian quản trị</DialogDescription></DialogHeader>{nav}</DialogContent></Dialog>
  </div>;
}
