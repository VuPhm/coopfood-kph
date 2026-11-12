import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./sign-in.css";

type SignInProps = {
  title: string;
  logo: string;
  busy: boolean;
  error?: string | null;
  errorRole?: "status" | "alert";
  notice?: string | null;
  onSubmit(username: string, password: string): void;
  onPreview?: (() => void) | undefined;
};

export function SignIn({ title, logo, busy, error, errorRole = "alert", notice, onSubmit, onPreview }: SignInProps) {
  const id = useId();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const canSubmit = !busy && Boolean(username.trim()) && Boolean(password);
  const errorId = error ? id + "-error" : undefined;

  return (
    <main className="fresh-login" aria-labelledby={id + "-title"}>
      <div className="fresh-login-panel">
        <div className="fresh-login-brand">
          <img src={logo} alt="Co.op Food" width="598" height="246" />
        </div>
        <div className="fresh-login-sheet">
          <h1 id={id + "-title"}>{title}</h1>
          {notice && <p className="fresh-login-notice" role="status">{notice}</p>}
          <form aria-busy={busy} onSubmit={event => {
            event.preventDefault();
            if (canSubmit) onSubmit(username.trim(), password);
          }}>
            <label htmlFor={id + "-username"}>Tên đăng nhập</label>
            <input id={id + "-username"} name="username" autoComplete="username"
              autoCapitalize="none" spellCheck={false} required disabled={busy}
              value={username} onChange={event => setUsername(event.target.value)} aria-describedby={errorId} />
            <label htmlFor={id + "-password"}>Mật khẩu</label>
            <div className="fresh-login-password">
              <input id={id + "-password"} name="password" autoComplete="current-password"
                type={visible ? "text" : "password"} required disabled={busy}
                value={password} onChange={event => setPassword(event.target.value)} aria-describedby={errorId} />
              <button type="button" className="fresh-login-reveal" disabled={busy}
                aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={visible}
                onClick={() => setVisible(!visible)}>
                {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
            {error && <p className="fresh-login-error" role={errorRole} id={errorId}>{error}</p>}
            <button className="fresh-login-submit" type="submit" disabled={!canSubmit}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>
          {onPreview && <button className="fresh-login-preview" type="button" disabled={busy} onClick={() => {
            setPassword("");
            setVisible(false);
            onPreview();
          }}>Vào bản dùng thử</button>}
        </div>
      </div>
    </main>
  );
}
