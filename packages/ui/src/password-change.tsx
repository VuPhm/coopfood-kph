import { type FormEvent, useId, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog";
import "./password-change.css";

export type PasswordChangeDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSubmit(currentPassword: string, newPassword: string): Promise<void>;
  onChanged(): void;
};

/** Both entry points keep credentials only in this mounted form's state. */
export function PasswordChangeDialog({ open, onOpenChange, onSubmit, onChanged }: PasswordChangeDialogProps) {
  const id = useId();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [error, setError] = useState("");
  function reset() { setCurrent(""); setNext(""); setConfirmation(""); setVisible(false); setError(""); }
  function close() { if (sending.current) return; reset(); onOpenChange(false); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (sending.current || !current || !next || !confirmation) return;
    const length = Array.from(next).length;
    if (length < 15 || length > 64) { setError("Mật khẩu mới phải dài từ 15 đến 64 ký tự Unicode."); return; }
    if (next !== confirmation) { setError("Xác nhận mật khẩu mới chưa khớp."); return; }
    sending.current = true; setBusy(true); setError("");
    try { await onSubmit(current, next); reset(); onChanged(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu lúc này."); }
    finally { sending.current = false; setBusy(false); }
  }
  const describedBy = `${id}-policy${error ? ` ${id}-error` : ""}`;
  return <Dialog open={open} onOpenChange={value => { if (!value) close(); else onOpenChange(true); }}>
    <DialogContent className="fresh-password-dialog" closeDisabled={busy} aria-busy={busy}>
      <DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle><DialogDescription>Bạn cần đăng nhập lại sau khi đổi mật khẩu thành công.</DialogDescription></DialogHeader>
      <form className="fresh-password-form" onSubmit={submit} aria-busy={busy}>
        {([
          ["current", "Mật khẩu hiện tại", "current-password", current, setCurrent],
          ["new", "Mật khẩu mới", "new-password", next, setNext],
          ["confirm", "Nhập lại mật khẩu mới", "new-password", confirmation, setConfirmation],
        ] as const).map(([suffix, label, autoComplete, value, change]) => <label className="fresh-password-field" key={suffix} htmlFor={`${id}-${suffix}`}>
          <span>{label}</span><input id={`${id}-${suffix}`} type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} disabled={busy} onChange={event => change(event.target.value)} aria-describedby={describedBy} required />
        </label>)}
        <p id={`${id}-policy`} className="fresh-password-policy">15–64 ký tự; cho phép khoảng trắng, dán và trình quản lý mật khẩu. Tránh mật khẩu phổ biến hoặc chứa tên tài khoản, Co.op Food hay KPH.</p>
        <Button type="button" variant="ghost" className="fresh-password-reveal" aria-pressed={visible} onClick={() => setVisible(!visible)} disabled={busy}>{visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}{visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}</Button>
        {error && <p id={`${id}-error`} className="fresh-password-error" role="alert">{error}</p>}
        <div className="fresh-password-actions"><Button type="button" variant="ghost" disabled={busy} onClick={close}>Quay lại</Button><Button type="submit" disabled={busy || !current || !next || !confirmation}>{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" size={18} aria-hidden="true" />Đang đổi…</> : "Đổi mật khẩu"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
