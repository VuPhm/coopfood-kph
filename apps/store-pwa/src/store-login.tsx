import { useId, useState } from "react";
import { ArrowRight, Eye, EyeOff, Leaf, LoaderCircle, LockKeyhole, UserRound } from "lucide-react";
import { assetUrl } from "./asset-url";
import "./store-login.css";

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
    <div className="store-login-layout">
      <section className="store-login-brand" aria-label="Co.op Food">
        <img className="store-login-logo" src={assetUrl("brand/coopfood-logo.png")} alt="Co.op Food" width={1024} height={550} />
        <div className="store-login-brand-copy"><span>CO.OP FOOD STORE APP</span><h2>Vận hành cửa hàng<br />hiệu quả mỗi ngày.</h2><p>An toàn · Tiện lợi · Tươi ngon</p></div>
        <div className="store-login-art" aria-hidden="true"><Leaf className="store-login-leaf" size={40} strokeWidth={1} /><img src={assetUrl("brand/coopfood-home-basket.webp")} alt="" width={1536} height={1024} /></div>
      </section>
      <section className="store-login-card">
        {onPreview ? <span className="store-login-preview-badge">Bản dùng thử</span> : null}
        <div className="store-login-heading"><span>CHÀO MỪNG BẠN TRỞ LẠI</span><h1 id={`${id}-title`}>Đăng nhập</h1><p>{onPreview ? "Khám phá giao diện với dữ liệu mẫu của cửa hàng." : "Sử dụng tài khoản được cấp để bắt đầu công việc tại cửa hàng."}</p></div>
        <form className="store-login-form" aria-busy={busy} onSubmit={event => { event.preventDefault(); if (!busy && username.trim() && password) onSubmit(username.trim(), password); }}>
          <div className="store-login-field"><label htmlFor={`${id}-username`}>Tên đăng nhập</label><div className="store-login-input"><UserRound size={19} aria-hidden="true" /><input id={`${id}-username`} type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="Nhập tên đăng nhập" value={username} disabled={busy} required onChange={event => setUsername(event.target.value)} aria-describedby={error ? errorId : undefined} /></div></div>
          <div className="store-login-field"><label htmlFor={`${id}-password`}>Mật khẩu</label><div className="store-login-input"><LockKeyhole size={19} aria-hidden="true" /><input id={`${id}-password`} type={visible ? "text" : "password"} autoComplete="current-password" placeholder="Nhập mật khẩu" value={password} disabled={busy} required onChange={event => setPassword(event.target.value)} aria-describedby={error ? errorId : undefined} /><button type="button" className="store-login-reveal" aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible} disabled={busy} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}</button></div></div>
          {error ? <p className="store-login-error" id={errorId} role="status">{error}</p> : null}
          <button className="store-login-submit" type="submit" disabled={busy || !username.trim() || !password}>{busy ? <><LoaderCircle size={19} className="store-login-spinner" aria-hidden="true" />Đang đăng nhập…</> : <>Đăng nhập<ArrowRight size={20} aria-hidden="true" /></>}</button>
        </form>
        {onPreview ? <button className="store-login-preview" type="button" onClick={() => { setPassword(""); setVisible(false); onPreview(); }}>Vào bản dùng thử<ArrowRight size={18} aria-hidden="true" /></button> : <p className="store-login-support">Cần hỗ trợ tài khoản? Liên hệ người quản lý cấp tài khoản.</p>}
        <p className="store-login-footer">Co.op Food · Vì cửa hàng vận hành tốt hơn</p>
      </section>
    </div>
  </main>;
}
