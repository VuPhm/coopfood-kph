import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@coopfood-kph/ui";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { type FormEvent, useState } from "react";

type ChangePasswordDialogProps = {
  open: boolean;
  onOpenChange(open: boolean): void;
  onSubmit(currentPassword: string, newPassword: string): Promise<void>;
  onChanged(): void;
};

export function ChangePasswordDialog({ open, onOpenChange, onSubmit, onChanged }: ChangePasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setVisible(false);
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const length = Array.from(newPassword).length;
    if (length < 15 || length > 64) {
      setError("Mật khẩu mới phải dài từ 15 đến 64 ký tự Unicode.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Xác nhận mật khẩu mới chưa khớp.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(currentPassword, newPassword);
      reset();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đổi mật khẩu lúc này.");
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onOpenChange={(nextOpen) => {
    if (busy) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }}>
    <DialogContent aria-describedby="change-password-description">
      <DialogHeader>
        <span className="grid size-11 place-items-center rounded-2xl bg-brand-soft text-brand"><KeyRound aria-hidden="true" /></span>
        <DialogTitle>Đổi mật khẩu</DialogTitle>
        <DialogDescription id="change-password-description">Sau khi đổi thành công, mọi phiên cũ sẽ hết hiệu lực và bạn cần đăng nhập lại.</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" onSubmit={submit}>
        <PasswordField id="store-current-password" label="Mật khẩu hiện tại" autoComplete="current-password" value={currentPassword} visible={visible} disabled={busy} onChange={setCurrentPassword} />
        <PasswordField id="store-new-password" label="Mật khẩu mới" autoComplete="new-password" value={newPassword} visible={visible} disabled={busy} onChange={setNewPassword} />
        <PasswordField id="store-confirm-password" label="Nhập lại mật khẩu mới" autoComplete="new-password" value={confirmation} visible={visible} disabled={busy} onChange={setConfirmation} />
        <p className="text-sm leading-6 text-ink-muted">15–64 ký tự; có thể dùng khoảng trắng và paste từ trình quản lý mật khẩu. Không dùng username, “Co.op Food”, “KPH” hoặc mật khẩu phổ biến.</p>
        <Button type="button" variant="ghost" className="justify-self-start" aria-pressed={visible} onClick={() => setVisible((value) => !value)} disabled={busy}>
          {visible ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}{visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        </Button>
        {error ? <p className="rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert">{error}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>Quay lại</Button>
          <Button type="submit" disabled={busy || !currentPassword || !newPassword || !confirmation}>{busy ? <><LoaderCircle className="animate-spin motion-reduce:animate-none" aria-hidden="true" size={18} />Đang đổi…</> : "Đổi mật khẩu"}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}

function PasswordField({ id, label, autoComplete, value, visible, disabled, onChange }: {
  id: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  value: string;
  visible: boolean;
  disabled: boolean;
  onChange(value: string): void;
}) {
  return <label className="grid gap-2 text-sm font-bold" htmlFor={id}>
    <span>{label}</span>
    <input id={id} className="min-h-11 rounded-xl border-2 border-surface-strong bg-white px-3 text-base font-normal" type={visible ? "text" : "password"} autoComplete={autoComplete} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} required />
  </label>;
}

