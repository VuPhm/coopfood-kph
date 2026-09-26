import { Button } from "@coopfood-kph/ui";
import { useState, type FormEvent, type ReactNode } from "react";

import { assetUrl } from "./asset-url";
import { loadPilotPinOverride, savePilotPinOverride } from "./pin-state";
import { loadPilotStoreProfile } from "./store-profile";

type PinGateProps = { children: ReactNode };
type PinScreen = "login" | "recovery";

function effectivePin(pinOverride: "0000" | null, currentStoreCode: string) {
  return pinOverride ?? (currentStoreCode || "0000");
}

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [screen, setScreen] = useState<PinScreen>("login");
  const [pin, setPin] = useState("");
  const [recentPin, setRecentPin] = useState("");
  const [recoveryStoreCode, setRecoveryStoreCode] = useState("");
  const [hasStoreCode, setHasStoreCode] = useState(false);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(false);

  async function verifyPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pin.length !== 4 || checking) return;

    setChecking(true);
    setError("");
    try {
      const [profile, pinOverride] = await Promise.all([loadPilotStoreProfile(), loadPilotPinOverride()]);
      if (pin === effectivePin(pinOverride, profile.storeCode)) {
        setPin("");
        setUnlocked(true);
        return;
      }
      setPin("");
      setError("Mã truy cập chưa đúng. Vui lòng thử lại.");
    } catch {
      setError("Không thể đọc thiết lập cửa hàng trên thiết bị.");
    } finally {
      setChecking(false);
    }
  }

  async function openRecovery() {
    setScreen("recovery");
    setPin("");
    setRecentPin("");
    setRecoveryStoreCode("");
    setHasStoreCode(false);
    setRecoveryReady(false);
    setError("");
    setNotice("");
    try {
      const profile = await loadPilotStoreProfile();
      setHasStoreCode(Boolean(profile.storeCode));
    } catch {
      setError("Không thể đọc thiết lập cửa hàng trên thiết bị.");
    } finally {
      setRecoveryReady(true);
    }
  }

  function returnToLogin() {
    setScreen("login");
    setRecentPin("");
    setRecoveryStoreCode("");
    setError("");
  }

  async function recoverPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recentPin.length !== 4 || recoveryStoreCode.length !== 4 || checking) return;

    setChecking(true);
    setError("");
    try {
      const [profile, pinOverride] = await Promise.all([loadPilotStoreProfile(), loadPilotPinOverride()]);
      const currentStoreCode = profile.storeCode;
      if (
        /^\d{4}$/.test(currentStoreCode)
        && recentPin === effectivePin(pinOverride, currentStoreCode)
        && recoveryStoreCode === currentStoreCode
      ) {
        await savePilotPinOverride("0000");
        setRecentPin("");
        setRecoveryStoreCode("");
        setPin("");
        setScreen("login");
        setNotice("Mã truy cập đã được đặt lại về 0000.");
        return;
      }
      setError("Thông tin xác thực không đúng.");
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
        <img
          className="pin-lock-logo"
          src={assetUrl("/brand/logo-coopfood-light.webp")}
          alt="Co.op Food — an toàn, tiện lợi, tươi ngon"
          width={640}
          height={314}
        />
        {screen === "login" ? (
          <>
            <h1 id="pin-lock-title">Nhập mã truy cập</h1>
            <form className="pin-lock-form" onSubmit={(event) => void verifyPin(event)}>
              <label className="sr-only" htmlFor="store-pin">Mã truy cập</label>
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
                aria-describedby={error ? "store-pin-error" : undefined}
                onChange={(event) => {
                  setPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                  setNotice("");
                }}
              />
              {error ? <p id="store-pin-error" className="pin-lock-error" role="alert">{error}</p> : null}
              {notice ? <p className="pin-lock-notice" role="status">{notice}</p> : null}
              <Button className="pin-lock-submit" type="submit" disabled={pin.length !== 4 || checking}>
                {checking ? "Đang kiểm tra…" : "Mở ứng dụng"}
              </Button>
            </form>
            <Button className="pin-lock-link" variant="ghost" type="button" onClick={() => void openRecovery()}>
              Quên mật khẩu?
            </Button>
          </>
        ) : (
          <>
            <h1 id="pin-lock-title">Khôi phục mật khẩu</h1>
            {!recoveryReady ? <p className="pin-lock-description" role="status">Đang kiểm tra thiết lập cửa hàng…</p> : null}
            {recoveryReady && error && !hasStoreCode ? (
              <>
                <p className="pin-lock-error" role="alert">{error}</p>
                <Button className="pin-lock-submit" type="button" onClick={returnToLogin}>Quay lại</Button>
              </>
            ) : null}
            {recoveryReady && !error && !hasStoreCode ? (
              <>
                <p className="pin-lock-description" role="status">Chưa có mã cửa hàng. Mã truy cập mặc định hiện tại là 0000.</p>
                <Button className="pin-lock-submit" type="button" onClick={returnToLogin}>Quay lại</Button>
              </>
            ) : null}
            {recoveryReady && hasStoreCode ? (
              <form className="pin-lock-form" onSubmit={(event) => void recoverPin(event)}>
                <label className="pin-lock-label" htmlFor="recent-pin">Mật khẩu gần nhất</label>
                <input
                  id="recent-pin"
                  className="pin-lock-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="off"
                  autoFocus
                  value={recentPin}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-error" : undefined}
                  onChange={(event) => {
                    setRecentPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                    setError("");
                  }}
                />
                <label className="pin-lock-label" htmlFor="recovery-store-code">Mã cửa hàng</label>
                <input
                  id="recovery-store-code"
                  className="pin-lock-input pin-lock-store-code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="off"
                  value={recoveryStoreCode}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "recovery-error" : undefined}
                  onChange={(event) => {
                    setRecoveryStoreCode(event.target.value.replace(/\D/g, "").slice(0, 4));
                    setError("");
                  }}
                />
                {error ? <p id="recovery-error" className="pin-lock-error" role="alert">{error}</p> : null}
                <Button className="pin-lock-submit" type="submit" disabled={recentPin.length !== 4 || recoveryStoreCode.length !== 4 || checking}>
                  {checking ? "Đang xác thực…" : "Đặt lại mật khẩu"}
                </Button>
                <Button className="pin-lock-link" variant="ghost" type="button" onClick={returnToLogin}>Quay lại</Button>
              </form>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
