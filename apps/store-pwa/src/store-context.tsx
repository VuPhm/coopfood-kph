import { ChevronRight, Store } from "lucide-react";

type StoreContextProps = {
  storeLabel: string;
  actorLabel: string;
  storageLabel: string;
  storageHint: string;
  disabled?: boolean;
  onConfigure?: (() => void) | undefined;
  storeOptions?: readonly { id: string; code: string; name: string }[] | undefined;
  selectedStoreId?: string | null | undefined;
  onStoreChange?: ((storeId: string) => void) | undefined;
  onLogout?: (() => void) | undefined;
  loggingOut?: boolean;
};

export function StoreContext({ storeLabel, actorLabel, storageLabel, storageHint, disabled, onConfigure, storeOptions, selectedStoreId, onStoreChange, onLogout, loggingOut = false }: StoreContextProps) {
  const content = <>
    <Store className="store-context-icon" size={20} aria-hidden="true" />
    <span className="store-context-copy">
      <strong>{storeLabel}</strong>
      <span>{actorLabel}</span>
      <small title={storageHint}>{storageLabel}</small>
    </span>
    {onConfigure ? <ChevronRight className="store-context-disclosure" aria-hidden="true" /> : null}
  </>;

  if (onConfigure) {
    return <button type="button" className="store-context" aria-label={`Thiết lập cửa hàng: ${storeLabel}`} disabled={disabled} onClick={onConfigure}>{content}</button>;
  }

  const hasStoreSwitcher = Boolean(storeOptions?.length && onStoreChange);
  return <div className="store-context" role="group" aria-label={`Cửa hàng hiện tại: ${storeLabel}`}>
    {content}
    {hasStoreSwitcher ? <label className="online-store-switcher">
      <span className="sr-only">Chọn cửa hàng</span>
      <select aria-label="Chọn cửa hàng" value={selectedStoreId ?? ""} disabled={disabled || loggingOut} onChange={(event) => onStoreChange?.(event.target.value)}>
        {storeOptions?.map((store) => <option key={store.id} value={store.id}>{store.code} · {store.name}</option>)}
      </select>
    </label> : null}
    {onLogout ? <button type="button" className="online-logout-button" disabled={disabled || loggingOut} onClick={onLogout}>{loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}</button> : null}
  </div>;
}
