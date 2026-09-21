import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, Tag } from "@coopfood-kph/ui";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Leaf, LogOut, RefreshCw, ShieldCheck, UserRound, UserRoundX } from "lucide-react";
import { useState } from "react";

import type { AdminSession, AdminUser, LifecycleAdminGateway } from "./lifecycle-admin";

export function IdentityWorkspace({ gateway, session, users, loading, loadError, onRefresh, onLogout, logoutBusy, onError, onOpenLifecycle, onOpenCatalog }: {
  gateway: LifecycleAdminGateway;
  session: AdminSession;
  users: AdminUser[];
  loading: boolean;
  loadError: string | null;
  onRefresh(): void;
  onLogout(): void;
  logoutBusy: boolean;
  onError(error: unknown): void;
  onOpenLifecycle(): void;
  onOpenCatalog?: () => void;
}) {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeCount = users.filter((user) => user.active).length;

  return <div className="min-h-dvh bg-canvas text-ink">
    <a href="#admin-main" className="sr-only fixed left-4 top-4 z-50 rounded-xl bg-white px-4 py-3 font-bold text-brand shadow-panel focus:not-sr-only">Bỏ qua đến nội dung chính</a>
    <header className="sticky top-0 z-20 bg-brand text-white shadow-panel">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-brand"><Leaf aria-hidden="true" /></span><div className="min-w-0"><strong className="block truncate text-base font-black sm:text-lg">Co.op Food KPH</strong><span className="block truncate text-xs text-white/80">Quản trị tài khoản</span></div></div>
        <div className="flex flex-wrap items-center justify-end gap-2"><Button className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={onOpenLifecycle} variant="secondary">Lifecycle</Button>{onOpenCatalog ? <Button className="border-white/25 bg-white/10 text-white hover:bg-white/20" onClick={onOpenCatalog} variant="secondary">Catalog</Button> : null}<span className="hidden text-right text-xs leading-5 text-white/80 sm:block"><strong className="block text-sm text-white">{session.user.displayName}</strong>{session.user.username}</span><Button aria-label="Đăng xuất" className="border-white/25 bg-white/10 text-white hover:bg-white/20" disabled={logoutBusy} onClick={onLogout} size="icon" variant="secondary"><LogOut aria-hidden="true" size={18} /></Button></div>
      </div>
    </header>

    <main id="admin-main" className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
      <section className="rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="users-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><ShieldCheck aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-brand">P04 · Toàn chuỗi</p><h1 id="users-heading" className="mt-1 text-2xl font-black tracking-tight">Tài khoản người dùng</h1><p className="mt-2 text-sm leading-6 text-ink-muted">{activeCount} đang hoạt động · {users.length} tài khoản. Vô hiệu hóa có hiệu lực với session hiện có từ request kế tiếp.</p></div></div><Button aria-label="Tải lại danh sách tài khoản" onClick={onRefresh} size="icon" variant="secondary"><RefreshCw aria-hidden="true" size={18} /></Button></div>

        {notice ? <p className="mt-5 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-3 text-sm font-semibold text-brand" role="status"><CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" size={17} />{notice}</p> : null}
        {loadError ? <p className="mt-5 rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert">{loadError}</p> : null}
        {loading ? <p className="mt-6 text-sm text-ink-muted" role="status">Đang tải danh sách tài khoản…</p> : null}
        {!loading && users.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center"><UserRound className="mx-auto text-brand" aria-hidden="true" /><p className="mt-3 font-black">Chưa có tài khoản</p></div> : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => {
            const current = user.id === session.user.id;
            return <article key={user.id} className="flex min-h-56 flex-col rounded-2xl border border-surface-strong bg-surface-muted/55 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><UserRound aria-hidden="true" size={20} /></span><Tag tone={user.active ? "green" : "gray"}>{user.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}</Tag></div>
              <h2 className="mt-4 break-words text-lg font-black">{user.displayName}</h2><p className="break-all text-sm text-ink-muted">{user.username}</p>
              <div className="mt-3 flex min-h-7 flex-wrap gap-2">{user.globalRoles.length ? user.globalRoles.map((role) => <Tag key={role} tone="blue">{role === "CHAIN_ADMIN" ? "Quản trị chuỗi" : "Quản trị catalog"}</Tag>) : <span className="text-xs text-ink-muted">Không có quyền global</span>}</div>
              <div className="mt-auto pt-5">{current ? <p className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink-muted">Tài khoản đang đăng nhập</p> : <Button className="w-full" disabled={!user.active} onClick={() => { setNotice(null); setSelected(user); }} variant="danger"><UserRoundX aria-hidden="true" size={17} />{user.active ? "Vô hiệu hóa" : "Đã vô hiệu hóa"}</Button>}</div>
            </article>;
          })}
        </div>
      </section>
    </main>

    {selected ? <DeactivateUserDialog
      gateway={gateway}
      user={selected}
      onClose={() => setSelected(null)}
      onError={onError}
      onSuccess={() => {
        setNotice(`Đã vô hiệu hóa ${selected.username}. Quyền truy cập kết thúc từ request kế tiếp.`);
        setSelected(null);
        onRefresh();
      }}
    /> : null}
  </div>;
}

function DeactivateUserDialog({ gateway, user, onClose, onSuccess, onError }: {
  gateway: LifecycleAdminGateway;
  user: AdminUser;
  onClose(): void;
  onSuccess(): void;
  onError(error: unknown): void;
}) {
  const [reason, setReason] = useState("");
  const mutation = useMutation({
    mutationFn: () => {
      const normalized = reason.trim();
      if (!normalized) throw new Error("Hãy nhập lý do vô hiệu hóa tài khoản.");
      return gateway.deactivateUser(user.id, normalized);
    },
    onError,
    onSuccess,
  });
  return <Dialog open onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>Vô hiệu hóa tài khoản</DialogTitle><DialogDescription>{user.displayName} · {user.username}. Thao tác có hiệu lực ngay: session hiện có sẽ bị từ chối ở request kế tiếp. Role và assignment được giữ để phục vụ reactivation explicit về sau.</DialogDescription></DialogHeader>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <Field htmlFor="deactivate-user-reason" label="Lý do" hint="1–500 ký tự; được lưu vào audit, không nhập mật khẩu hoặc thông tin nhạy cảm." required><textarea autoFocus id="deactivate-user-reason" className="min-h-28 w-full resize-y rounded-xl border-2 border-surface-strong bg-white px-3 py-2 text-base" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={mutation.isPending} /></Field>
        {mutation.error instanceof Error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger" role="alert">{mutation.error.message}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Quay lại</Button><Button type="submit" variant="danger" disabled={mutation.isPending}>{mutation.isPending ? "Đang vô hiệu hóa…" : "Xác nhận vô hiệu hóa"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
