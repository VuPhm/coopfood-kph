import { Button } from "@coopfood-kph/ui";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { assetUrl } from "./asset-url";
import { effectivePilotPin, loadPilotPinState, recoverPilotPinWithPreviousPin } from "./pin-state";
import { loadPilotStoreProfile } from "./store-profile";

type PinGateProps = { children: ReactNode };
type PinScreen = "login" | "recovery";

export function PinGate({ children }: PinGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [screen, setScreen] = useState<PinScreen>("login");
  const [pin, setPin] = useState("");
  const pinInputRef = useRef<HTMLInputElement>(null);
  const verificationInFlight = useRef(false);
  const [previousPin, setPreviousPin] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (error && screen === "login") pinInputRef.current?.focus();
  }, [error, screen]);

  async function verifyPin(candidatePin: string) {
    if (!/^\d{4}$/.test(candidatePin) || verificationInFlight.current) return;

    verificationInFlight.current = true;
    setChecking(true);
    setError("");
    let didUnlock = false;
    try {
      const [profile, pinState] = await Promise.all([loadPilotStoreProfile(), loadPilotPinState()]);
      if (candidatePin === effectivePilotPin(pinState, profile.storeCode)) {
        setPin("");
        setUnlocked(true);
        didUnlock = true;
        return;
      }
      setPin("");
      setError("Mã truy cập chưa đúng. Vui lòng thử lại.");
    } catch {
      setError("Không thể đọc thiết lập cửa hàng trên thiết bị.");
    } finally {
      verificationInFlight.current = false;
      setChecking(false);
      if (!didUnlock) pinInputRef.current?.focus();
    }
  }

  function handlePinChange(value: string) {
    if (verificationInFlight.current) return;
    const normalizedPin = value.replace(/\D/g, "").slice(0, 4);
    setPin(normalizedPin);
    setError("");
    setNotice("");
    if (/^\d{4}$/.test(normalizedPin)) void verifyPin(normalizedPin);
  }

  function submitPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void verifyPin(pin);
  }

  function openRecovery() {
    setScreen("recovery");
    setPin("");
    setPreviousPin("");
    setError("");
    setNotice("");
  }

  function returnToLogin() {
    setScreen("login");
    setPreviousPin("");
    setError("");
  }

  async function recoverPin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (previousPin.length !== 4 || checking) return;

    setChecking(true);
    setError("");
    try {
      if (await recoverPilotPinWithPreviousPin(previousPin)) {
        setPreviousPin("");
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
            <p className="pin-lock-description">Nhập 4 số để mở ứng dụng. Mặc định là 0000 nếu chưa thiết lập mã cửa hàng.</p>
            <form className="pin-lock-form" onSubmit={submitPin}>
              <label className="sr-only" htmlFor="store-pin">Mã truy cập</label>
              <input
                id="store-pin"
                ref={pinInputRef}
                className="pin-lock-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="off"
                autoFocus
                disabled={checking}
                value={pin}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "store-pin-error" : undefined}
                onChange={(event) => handlePinChange(event.target.value)}
              />
              {error ? <p id="store-pin-error" className="pin-lock-error" role="alert">{error}</p> : null}
              {notice ? <p className="pin-lock-notice" role="status">{notice}</p> : null}
              <Button className="pin-lock-submit" type="submit" disabled={pin.length !== 4}>
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
            <form className="pin-lock-form" onSubmit={(event) => void recoverPin(event)}>
              <label className="pin-lock-label" htmlFor="previous-pin">Mật khẩu trước đó</label>
              <input
                id="previous-pin"
                className="pin-lock-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="off"
                autoFocus
                value={previousPin}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "recovery-error" : undefined}
                onChange={(event) => {
                  setPreviousPin(event.target.value.replace(/\D/g, "").slice(0, 4));
                  setError("");
                }}
              />
              {error ? <p id="recovery-error" className="pin-lock-error" role="alert">{error}</p> : null}
              <Button className="pin-lock-submit" type="submit" disabled={previousPin.length !== 4 || checking}>
                {checking ? "Đang xác thực…" : "Đặt lại mật khẩu"}
              </Button>
              <Button className="pin-lock-link" variant="ghost" type="button" onClick={returnToLogin}>Quay lại</Button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}
