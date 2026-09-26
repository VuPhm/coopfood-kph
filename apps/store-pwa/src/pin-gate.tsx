import { Button } from "@coopfood-kph/ui";
import { useState, type FormEvent } from "react";

import { assetUrl } from "./asset-url";
import { loadPilotStoreProfile } from "./store-profile";

type PinGateProps = { children: React.ReactNode };

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function verifyPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 4 || checking) return;

    setChecking(true);
    setError("");
    try {
      const profile = await loadPilotStoreProfile();
      const expectedPin = profile.storeCode || "0000";
      if (pin === expectedPin) {
        setUnlocked(true);
        return;
      }
      setPin("");
      setError("Mã cửa hàng chưa đúng. Vui lòng thử lại.");
    } catch {
      setError("Không thể đọc thiết lập cửa hàng trên thiết bị.");
    } finally {
      setChecking(false);
    }
  }

  if (unlocked) return children;

  return (
    <main className="pin-lock-screen">
      <section className="pin-lock-card" aria-labelledby="pin-lock-title">
        <img className="pin-lock-logo" src={assetUrl("/brand/coopfood-logo.png")} alt="Co.op Food" />
        <h1 id="pin-lock-title">Nhập mã cửa hàng</h1>
        <p className="pin-lock-description">Nhập mã cửa hàng gồm 4 chữ số để tiếp tục.</p>
        <form className="pin-lock-form" onSubmit={(event) => void verifyPin(event)}>
          <label className="sr-only" htmlFor="store-pin">Mã cửa hàng</label>
          <input
            id="store-pin"
            className="pin-lock-input"
            type="password"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            autoComplete="off"
            autoFocus
            value={pin}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "store-pin-error" : "store-pin-hint"}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
          />
          <p id={error ? "store-pin-error" : "store-pin-hint"} className={error ? "pin-lock-error" : "pin-lock-hint"} role={error ? "alert" : undefined}>
            {error || "Mã mặc định khi chưa thiết lập là 0000."}
          </p>
          <Button className="pin-lock-submit" type="submit" disabled={pin.length !== 4 || checking}>
            {checking ? "Đang kiểm tra…" : "Mở ứng dụng"}
          </Button>
        </form>
      </section>
    </main>
  );
}
