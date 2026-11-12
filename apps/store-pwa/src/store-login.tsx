import { SignIn } from "@coopfood-kph/ui";
import { assetUrl } from "./asset-url";

export function StoreLogin({ busy, error, onSubmit, onPreview }: {
  busy: boolean;
  error: string;
  onSubmit(username: string, password: string): void;
  onPreview?: () => void;
}) {
  return <SignIn title="Đăng nhập cửa hàng" logo={assetUrl("brand/coopfood-logo-dark.png")}
    busy={busy} error={error} errorRole="status" onSubmit={onSubmit} onPreview={onPreview} />;
}
