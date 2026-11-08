import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field } from "@coopfood-kph/ui";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, ShieldCheck, UserRound, UserRoundX } from "lucide-react";
import { useState } from "react";

import { AdminListLabel, userPresentation, rolePresentation } from "./list-labels";
import type { AdminSession, AdminUser, LifecycleAdminGateway } from "./lifecycle-admin";

export function IdentityWorkspace({ gateway, session, users, loading, loadError, onRefresh, onError }: {
  gateway: LifecycleAdminGateway;
  session: AdminSession;
  users: AdminUser[];
  loading: boolean;
  loadError: string | null;
  onRefresh(): void;
  onError(error: unknown): void;
}) {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const activeCount = users.filter((user) => user.active).length;

  return <div className="admin-workspace legacy-workspace">
    <div className="admin-identity-content">
      <section className="rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="users-heading">
        <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><ShieldCheck aria-hidden="true" /></span><div><p className="text-xs font-black uppercase tracking-[.14em] text-brand">Quản trị toàn chuỗi</p><h1 id="users-heading" className="mt-1 text-2xl font-black tracking-tight">Tài khoản người dùng</h1><p className="mt-2 text-sm leading-6 text-ink-muted">{activeCount} đang hoạt động · {users.length} tài khoản. Sau khi vô hiệu hóa, người dùng sẽ mất quyền ở lần thao tác tiếp theo.</p></div></div><Button aria-label="Tải lại danh sách tài khoản" onClick={onRefresh} size="icon" variant="secondary"><RefreshCw aria-hidden="true" size={18} /></Button></div>

        {notice ? <p className="mt-5 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-3 text-sm font-semibold text-brand" role="status"><CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" size={17} />{notice}</p> : null}
        {loadError ? <p className="mt-5 rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert">{loadError}</p> : null}
        {loading ? <p className="mt-6 text-sm text-ink-muted" role="status">Đang tải danh sách tài khoản…</p> : null}
        {!loading && users.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center"><UserRound className="mx-auto text-brand" aria-hidden="true" /><p className="mt-3 font-black">Chưa có tài khoản</p></div> : null}

        <div className="admin-identity-list"><div className="identity-list-heading" aria-hidden="true"><span>Tài khoản</span><span>Quyền toàn chuỗi</span><span>Trạng thái</span><span>Thao tác</span></div>
          {users.map((user) => {
            const current = user.id === session.user.id;
            return <article key={user.id} className="identity-user-row">
              <div className="identity-user-name"><span className="identity-avatar"><UserRound aria-hidden="true" size={18} /></span><div><h2>{user.displayName}</h2><p>{user.username}</p></div></div>
              <div className="identity-user-roles">{user.globalRoles.length ? user.globalRoles.map((role) => <AdminListLabel key={role} category="Quyền global" presentation={rolePresentation(role)} />) : <span className="text-ink-muted">Không có quyền global</span>}</div>
              <div className="identity-user-status"><AdminListLabel category="Tài khoản" presentation={userPresentation(user.active)} /></div>
              <div className="identity-user-action">{current ? <span className="text-ink-muted">Tài khoản đang đăng nhập</span> : <Button className="identity-deactivate" disabled={!user.active} onClick={() => { setNotice(null); setSelected(user); }} variant="secondary"><UserRoundX aria-hidden="true" size={15} />{user.active ? "Vô hiệu hóa" : "Đã vô hiệu hóa"}</Button>}</div>
            </article>;
          })}
        </div>
      </section>
    </div>

    {selected ? <DeactivateUserDialog
      gateway={gateway}
      user={selected}
      onClose={() => setSelected(null)}
      onError={onError}
      onSuccess={() => {
        setNotice(`Đã vô hiệu hóa ${selected.username}. Người dùng sẽ mất quyền ở lần thao tác tiếp theo.`);
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
      <DialogHeader><DialogTitle>Vô hiệu hóa tài khoản</DialogTitle><DialogDescription>{user.displayName} · {user.username}. Các phiên đang đăng nhập sẽ mất quyền ở lần thao tác tiếp theo. Thông tin tài khoản và các quyền đã cấp vẫn được giữ lại.</DialogDescription></DialogHeader>
      <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>
        <Field htmlFor="deactivate-user-reason" label="Lý do" hint="1–500 ký tự; được lưu vào audit, không nhập mật khẩu hoặc thông tin nhạy cảm." required><textarea autoFocus id="deactivate-user-reason" className="min-h-28 w-full resize-y rounded-xl border-2 border-surface-strong bg-white px-3 py-2 text-base" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={mutation.isPending} /></Field>
        {mutation.error instanceof Error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger" role="alert">{mutation.error.message}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Quay lại</Button><Button type="submit" variant="danger" disabled={mutation.isPending}>{mutation.isPending ? "Đang vô hiệu hóa…" : "Xác nhận vô hiệu hóa"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
