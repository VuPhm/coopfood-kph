import { ChevronRight, Store } from "lucide-react";

type StoreContextProps = {
  storeLabel: string;
  actorLabel: string;
  storageLabel: string;
  storageHint: string;
  disabled?: boolean;
  onConfigure?: (() => void) | undefined;
};

export function StoreContext({ storeLabel, actorLabel, storageLabel, storageHint, disabled, onConfigure }: StoreContextProps) {
  const content = <>
    <Store className="store-context-icon" size={20} aria-hidden="true" />
    <span className="store-context-copy">
      <strong>{storeLabel}</strong>
      <span>{actorLabel}</span>
      <small title={storageHint}>{storageLabel}</small>
    </span>
    {onConfigure ? <ChevronRight className="store-context-disclosure" aria-hidden="true" /> : null}
  </>;

  return onConfigure
    ? <button type="button" className="store-context" aria-label={`Thiết lập cửa hàng: ${storeLabel}`} disabled={disabled} onClick={onConfigure}>{content}</button>
    : <div className="store-context" role="group" aria-label={`Cửa hàng hiện tại: ${storeLabel}`}>{content}</div>;
}
