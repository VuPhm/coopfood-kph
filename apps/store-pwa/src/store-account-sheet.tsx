import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@coopfood-kph/ui";
import { ArrowRight, Home, Store } from "lucide-react";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import { StoreAccountTrigger, storeAccountIdentity, storeAccountRole } from "./store-account-trigger";
import "./store-utility-polish.css";
import type { StoreProfile } from "./store-profile";

// Opening the account sheet should not render the entire active workspace.
export function StoreAccountControl({ profile, onHome, onLoginPreview, roleLabel, renderActions }: {
  profile: StoreProfile;
  onHome: () => void;
  onLoginPreview?: (() => void) | undefined;
  roleLabel?: string | undefined;
  renderActions?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { initials } = storeAccountIdentity(profile);
  return <>
    <StoreAccountTrigger ref={triggerRef} profile={profile} roleLabel={roleLabel} onClick={() => setOpen(true)} />
    <StoreAccountSheet open={open} onOpenChange={setOpen} profile={profile} initials={initials} triggerRef={triggerRef} roleLabel={roleLabel} actions={renderActions?.(() => setOpen(false))}
      onHome={() => { setOpen(false); onHome(); }}
      onLoginPreview={onLoginPreview ? () => { setOpen(false); onLoginPreview(); } : undefined} />
  </>;
}

export function StoreAccountSheet({ open, onOpenChange, profile, initials, triggerRef, onHome, onLoginPreview, roleLabel, actions }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StoreProfile;
  initials: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onHome: () => void;
  onLoginPreview?: (() => void) | undefined;
  roleLabel?: string | undefined;
  actions?: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="store-account-sheet" closeTone="inverse" onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus({ preventScroll: true }); }}>
      <div className="store-account-hero">
        <DialogTitle>Tài khoản</DialogTitle>
        <div className="store-account-identity"><span className="store-account-avatar" aria-hidden="true">{initials}</span><div><h3>{profile.fullName}</h3><span className="store-account-role">{roleLabel ?? storeAccountRole(profile)}</span></div></div>
      </div>
      <DialogDescription className="sr-only">Thông tin tài khoản và cửa hàng đang sử dụng</DialogDescription>
      <div className="store-account-body">
        <section className="store-account-store" aria-labelledby="account-store-title">
          <span className="store-account-store-icon"><Store size={24} strokeWidth={1.8} aria-hidden="true" /></span>
          <div><h3 id="account-store-title">Cửa hàng đang sử dụng</h3><p>{profile.storeName}</p><span>Mã cửa hàng · {profile.storeCode}</span></div>
        </section>
        {onLoginPreview ? <p className="store-account-preview-note">Bản dùng thử · Thông tin mẫu</p> : null}
        <div className="store-account-actions">
          <button className="store-account-home" onClick={onHome}><Home size={18} aria-hidden="true" />Trang chủ</button>
          {actions ?? (onLoginPreview ? <button className="store-account-login" onClick={onLoginPreview}>Xem trang đăng nhập<ArrowRight size={18} aria-hidden="true" /></button> : null)}
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
