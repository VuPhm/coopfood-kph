import { StoreAppHeader } from "./store-app-header";
import { StorePageLayout, StorePageHero, StorePageSurface } from "./store-page-hero";
import { useId, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import "./store-frame-canvas.css";
import "./store-login.css";
import "./store-form-soft.css";
import "./store-component-soft.css";
import "./store-button-system.css";
import "./store-chrome-soft.css";

export function StoreLogin({ busy, error, onSubmit, onPreview }: {
  busy: boolean;
  error: string;
  onSubmit: (username: string, password: string) => void;
  onPreview?: () => void;
}) {
  const id = useId();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;
  return <main className="store-login" aria-labelledby={`${id}-title`}>
    <StorePageLayout className="store-login-layout">
      <StorePageHero className="store-login-brand" appHeader={<StoreAppHeader leading="brand" title="Đăng nhập" titleId={`${id}-title`} subtitle="" />} />
      <StorePageSurface className="store-login-card"><div className="store-login-form-column">

        {onPreview ? <span className="store-login-preview-badge">Bản dùng thử</span> : null}
        <form className="store-login-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); if (!busy && username.trim() && password) onSubmit(username.trim(), password); }}>
          <div className="store-login-field"><label htmlFor={`${id}-username`}>Tên đăng nhập</label><div className="store-login-input"><UserRound size={19} aria-hidden="true" /><input id={`${id}-username`} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Nhập tên đăng nhập" value={username} disabled={busy} required onChange={event => setUsername(event.target.value)} aria-describedby={error ? errorId : undefined} /></div></div>
          <div className="store-login-field"><label htmlFor={`${id}-password`}>Mật khẩu</label><div className="store-login-input"><LockKeyhole size={19} aria-hidden="true" /><input id={`${id}-password`} type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} disabled={busy} required onChange={event => setPassword(event.target.value)} aria-describedby={error ? errorId : undefined} /><button type="button" className="store-login-reveal" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible} disabled={busy} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button></div></div>
          {error ? <p className="store-login-error" id={errorId} role="status">{error}</p> : null}
          <button className="store-login-submit" type="submit" disabled={busy || !username.trim() || !password}>{busy ? <><LoaderCircle size={19} className="store-login-spinner" aria-hidden="true" />Đang đăng nhập…</> : <>Đăng nhập<ArrowRight size={20} aria-hidden="true" /></>}</button>
        </form>
        {onPreview ? <button className="store-login-preview" type="button" onClick={() => { setPassword(""); setVisible(false); onPreview(); }}>Vào bản dùng thử<ArrowRight size={18} aria-hidden="true" /></button> : null}
      </div></StorePageSurface>
    </StorePageLayout>
  </main>;
}
