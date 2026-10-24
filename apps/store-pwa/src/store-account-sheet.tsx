import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@coopfood-kph/ui";
import { ArrowRight, Home, Store } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { StoreAccountTrigger, storeAccountIdentity } from "./store-account-trigger";
import type { StoreProfile } from "./store-profile";
import { StoreDensitySetting } from "./store-density";

// Opening the account sheet should not render the entire active workspace.
export function StoreAccountControl({ profile, onHome, onLoginPreview }: {
  profile: StoreProfile;
  onHome: () => void;
  onLoginPreview: () => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { initials } = storeAccountIdentity(profile);
  return <>
    <StoreAccountTrigger ref={triggerRef} profile={profile} onClick={() => setOpen(true)} />
    <StoreAccountSheet open={open} onOpenChange={setOpen} profile={profile} initials={initials} triggerRef={triggerRef}
      onHome={() => { setOpen(false); onHome(); }}
      onLoginPreview={() => { setOpen(false); onLoginPreview(); }} />
  </>;
}

export function StoreAccountSheet({ open, onOpenChange, profile, initials, triggerRef, onHome, onLoginPreview }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: StoreProfile;
  initials: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onHome: () => void;
  onLoginPreview: () => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="store-account-sheet" closeTone="inverse" onCloseAutoFocus={event => { event.preventDefault(); triggerRef.current?.focus(); }}>
      <div className="store-account-hero">
        <DialogTitle>Tài khoản</DialogTitle>
        <span className="store-account-avatar" aria-hidden="true">{initials}</span>
        <h3>{profile.fullName}</h3>
        <span className="store-account-role">Quản lý cửa hàng</span>
      </div>
      <DialogDescription className="sr-only">Thông tin tài khoản và cửa hàng đang sử dụng</DialogDescription>
      <div className="store-account-body">
        <section className="store-account-store" aria-labelledby="account-store-title">
          <span className="store-account-store-icon"><Store size={24} strokeWidth={1.8} aria-hidden="true" /></span>
          <div><h3 id="account-store-title">Cửa hàng đang sử dụng</h3><p>{profile.storeName}</p><span>Mã cửa hàng · {profile.storeCode}</span></div>
        </section>
        <StoreDensitySetting />
        <p className="store-account-preview-note">Bản dùng thử · Thông tin mẫu</p>
        <div className="store-account-actions">
          <button className="store-account-home" onClick={onHome}><Home size={18} aria-hidden="true" />Trang chủ</button>
          <button className="store-account-login" onClick={onLoginPreview}>Xem trang đăng nhập<ArrowRight size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </DialogContent>
  </Dialog>;
}
