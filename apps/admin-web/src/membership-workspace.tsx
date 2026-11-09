import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, Input } from "@coopfood-kph/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Search, ShieldCheck, UserRound, UserRoundPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { LifecycleAdminGateway, MembershipRole, MembershipStore, MembershipUser, StoreMembership } from "./lifecycle-admin";

export const membershipRootKey = ["admin-membership"] as const;
export type MembershipGateway = Pick<LifecycleAdminGateway, "listStoreMemberships" | "lookupMembershipUser" | "upsertMembership" | "revokeMembership">;
const roleNames: Record<MembershipRole, string> = { EMPLOYEE: "Nhân viên", STORE_MANAGER: "Quản lý cửa hàng" };
function message(error: unknown) { return error instanceof Error ? error.message : "Không thể tải dữ liệu. Hãy thử lại."; }
function forbidden(error: unknown) { return typeof error === "object" && error !== null && "status" in error && error.status === 403; }

function LoadError({ error, onRetry }: { error: unknown; onRetry(): void }) {
  return <div className="membership-load-error"><p role="alert">{message(error)}</p><Button variant="secondary" onClick={onRetry}>Thử lại</Button></div>;
}

export function MembershipWorkspace({ gateway, actorId, stores, loading, loadError, onRefreshStores, onError }: {
  gateway: MembershipGateway; actorId: string; stores: MembershipStore[]; loading: boolean; loadError: unknown;
  onRefreshStores(): void; onError(error: unknown): void;
}) {
  const [storeId, setStoreId] = useState("");
  const store = stores.find(item => item.id === storeId);
  return <div className="admin-workspace admin-business-workspace membership-workspace">
    <section className="admin-panel membership-store-panel" aria-labelledby="memberships-heading">
      <div className="membership-heading"><div className="flex items-start gap-3"><span className="membership-heading-icon"><ShieldCheck aria-hidden="true" size={21} /></span><div><h1 id="memberships-heading">Quyền cửa hàng</h1><p>Gán vai trò và thu hồi quyền tại từng cửa hàng.</p></div></div><Button variant="secondary" size="icon" aria-label="Tải lại cửa hàng" onClick={onRefreshStores} disabled={loading}><RefreshCw aria-hidden="true" size={18} /></Button></div>
      {loadError ? <LoadError error={loadError} onRetry={onRefreshStores} /> : loading ? <p role="status">Đang tải cửa hàng…</p> : stores.length === 0 ? <p className="membership-empty">Không có cửa hàng đang hoạt động trong phạm vi quản lý của bạn.</p> : <div className="membership-store-picker"><Field htmlFor="membership-store" label="Cửa hàng"><select id="membership-store" value={store?.id ?? ""} onChange={event => setStoreId(event.target.value)}><option value="">Chọn cửa hàng</option>{stores.map(item => <option key={item.id} value={item.id}>{item.code} · {item.name} · {item.regionName}</option>)}</select></Field>{store && <p>{store.regionCode} · {store.regionName}</p>}</div>}
    </section>
    {!loadError && !loading && store ? <StoreMembers key={store.id} gateway={gateway} actorId={actorId} store={store} onError={onError} /> : !loadError && !loading && stores.length > 0 ? <p className="membership-empty">Chọn cửa hàng để xem và quản lý quyền.</p> : null}
  </div>;
}

type Action = { type: "grant" } | { type: "edit" | "revoke"; member: StoreMembership };
function StoreMembers({ gateway, actorId, store, onError }: { gateway: MembershipGateway; actorId: string; store: MembershipStore; onError(error: unknown): void }) {
  const queryClient = useQueryClient();
  const key = [...membershipRootKey, "members", actorId, store.id];
  const query = useQuery({ queryKey: key, queryFn: ({ signal }) => gateway.listStoreMemberships(store.id, signal), retry: false });
  const [action, setAction] = useState<Action | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => { if (query.error) onError(query.error); }, [query.error, onError]);
  const members = query.data ?? [];
  function handleError(error: unknown) {
    onError(error);
    if (forbidden(error)) {
      setAction(null);
      void queryClient.resetQueries({ queryKey: key });
      void queryClient.invalidateQueries({ queryKey: [...membershipRootKey, "stores"] });
    }
  }
  return <section className="admin-panel membership-members" aria-labelledby="store-members-heading">
    <div className="membership-heading"><div><h2 id="store-members-heading">Thành viên cửa hàng</h2>{!query.isPending && !query.isError && <p>{members.length} thành viên · {members.filter(member => member.active).length} quyền đang gán</p>}</div><div className="membership-actions"><Button variant="secondary" size="icon" aria-label="Tải lại quyền cửa hàng" onClick={() => void query.refetch()} disabled={query.isFetching}><RefreshCw size={18} aria-hidden="true" /></Button><Button disabled={query.isPending || query.isError} onClick={() => { setNotice(""); setAction({ type: "grant" }); }}><UserRoundPlus size={18} aria-hidden="true" />Gán quyền</Button></div></div>
    {notice && <p role="status" className="membership-notice"><CheckCircle2 size={18} aria-hidden="true" />{notice}</p>}
    {query.isError ? <LoadError error={query.error} onRetry={() => void query.refetch()} /> : query.isPending ? <p role="status">Đang tải quyền cửa hàng…</p> : <>
      {members.length === 0 && <p className="membership-empty">Chưa có thành viên được gán tại cửa hàng này.</p>}
      <ul className="membership-list" aria-label="Thành viên cửa hàng">{members.map(member => <li key={member.userId} className="membership-row">
        <div className="membership-person"><span className="membership-avatar"><UserRound size={18} aria-hidden="true" /></span><div><h3>{member.displayName}</h3><p>{member.username}</p>{!member.userActive && <span className="membership-account-inactive">Tài khoản ngừng hoạt động</span>}</div></div>
        <div className="membership-role"><span className="membership-mobile-label">Vai trò</span>{roleNames[member.role]}</div>
        <div><span className={`membership-state ${member.active ? "is-assigned" : ""}`}>{member.active ? "Đang gán" : "Đã thu hồi"}</span></div>
        <div className="membership-row-actions">{member.userActive && <Button variant="secondary" aria-label={`${member.active ? "Đổi vai trò của" : "Cấp lại quyền cho"} ${member.username}`} onClick={() => { setNotice(""); setAction({ type: "edit", member }); }}>{member.active ? "Đổi vai trò" : "Cấp lại"}</Button>}{member.active && <Button variant="ghost" className="membership-revoke" aria-label={`Thu hồi quyền của ${member.username}`} onClick={() => { setNotice(""); setAction({ type: "revoke", member }); }}>Thu hồi</Button>}</div>
      </li>)}</ul>
      <p className="membership-footnote">Quyền vùng hoặc toàn chuỗi được giữ theo phân công riêng và không hiển thị như thành viên cửa hàng.</p>
    </>}
    {action && !query.isError && <MembershipDialog gateway={gateway} store={store} action={action} onClose={() => setAction(null)} onError={handleError} onSuccess={async user => {
      const verb = action.type === "revoke" ? "Đã thu hồi quyền của" : "Đã lưu quyền cho";
      setNotice(`${verb} ${user.username} tại ${store.code}.`);
      setAction(null);
      await queryClient.invalidateQueries({ queryKey: key });
    }} />}
  </section>;
}

function MembershipDialog({ gateway, store, action, onClose, onError, onSuccess }: {
  gateway: MembershipGateway; store: MembershipStore; action: Action; onClose(): void;
  onError(error: unknown): void; onSuccess(user: StoreMembership): Promise<void>;
}) {
  const existing = action.type === "grant" ? null : action.member;
  const [username, setUsername] = useState("");
  const [found, setFound] = useState<MembershipUser | null>(existing ? { id: existing.userId, username: existing.username, displayName: existing.displayName } : null);
  const [role, setRole] = useState<MembershipRole>(existing?.role ?? "EMPLOYEE");
  const [reason, setReason] = useState("");
  const roleRef = useRef<HTMLSelectElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const lookup = useMutation({ mutationFn: () => {
    const normalized = username.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,63}$/.test(normalized)) throw new Error("Hãy nhập đúng tên đăng nhập từ 3 đến 64 ký tự chữ Latin, số, dấu chấm, gạch nối hoặc gạch dưới.");
    return gateway.lookupMembershipUser(store.id, normalized.toLowerCase());
  }, onSuccess: user => setFound(user), onError });
  useEffect(() => { if (found && !existing) roleRef.current?.focus(); }, [found, existing]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!found) throw new Error("Hãy tìm tài khoản trước khi gán quyền.");
      const normalized = reason.trim();
      if (!normalized || Array.from(reason).length > 500) throw new Error("Hãy nhập lý do từ 1 đến 500 ký tự.");
      return action.type === "revoke" ? gateway.revokeMembership(store.id, found.id, normalized) : gateway.upsertMembership(store.id, found.id, role, normalized);
    }, onSuccess, onError,
  });
  const busy = lookup.isPending || mutation.isPending;
  const title = action.type === "revoke" ? "Thu hồi quyền cửa hàng" : action.type === "edit" ? existing?.active ? "Đổi vai trò cửa hàng" : "Cấp lại quyền cửa hàng" : "Gán quyền cửa hàng";
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="membership-dialog" closeTone="neutral" onOpenAutoFocus={event => {
    event.preventDefault();
    (action.type === "grant" ? usernameRef.current : action.type === "revoke" ? reasonRef.current : roleRef.current)?.focus();
  }} onEscapeKeyDown={event => { if (busy) event.preventDefault(); }} onPointerDownOutside={event => { if (busy) event.preventDefault(); }}>
    <DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{store.code} · {store.name}</DialogDescription></DialogHeader>
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (!busy) { if (found) mutation.mutate(); else if (username.trim()) lookup.mutate(); } }}>
      {action.type === "grant" && <Field htmlFor="membership-username" label="Tên đăng nhập chính xác" hint="Tài khoản phải đang hoạt động; có thể chưa thuộc vùng của cửa hàng." required><div className="membership-lookup"><Input ref={usernameRef} id="membership-username" autoComplete="off" autoCapitalize="none" spellCheck={false} value={username} disabled={busy} onChange={event => { setUsername(event.target.value); setFound(null); setRole("EMPLOYEE"); setReason(""); lookup.reset(); mutation.reset(); }} /><Button type="button" variant="secondary" disabled={busy || !username.trim()} onClick={() => { setFound(null); mutation.reset(); lookup.mutate(); }}><Search aria-hidden="true" size={17} />{lookup.isPending ? "Đang tìm…" : "Tìm tài khoản"}</Button></div></Field>}
      {Boolean(lookup.error) && <p role="alert" className="membership-error">{message(lookup.error)}</p>}
      {found && <>
        <div className="membership-found"><strong>{found.displayName}</strong><span>{found.username}</span></div>
        {action.type !== "revoke" && <Field htmlFor="membership-role" label="Vai trò tại cửa hàng" required><select id="membership-role" ref={roleRef} disabled={busy} value={role} onChange={event => setRole(event.target.value as MembershipRole)}><option value="EMPLOYEE">Nhân viên</option><option value="STORE_MANAGER">Quản lý cửa hàng</option></select></Field>}
        {action.type === "revoke" && <p className="membership-consequence">Quyền trực tiếp tại cửa hàng mất hiệu lực ở thao tác tiếp theo. Quyền vùng hoặc toàn chuỗi hợp lệ vẫn được giữ.</p>}
        <Field htmlFor="membership-reason" label="Lý do" hint="1–500 ký tự; được lưu trong lịch sử thay đổi quyền." required><textarea ref={reasonRef} id="membership-reason" rows={3} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} /></Field>
      </>}
      {Boolean(mutation.error) && <p role="alert" className="membership-error">{message(mutation.error)}</p>}
      <div className="membership-dialog-actions"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Quay lại</Button>{found && <Button type="submit" variant={action.type === "revoke" ? "danger" : "primary"} disabled={busy || !reason.trim()}>{mutation.isPending ? "Đang lưu…" : action.type === "revoke" ? "Xác nhận thu hồi" : "Lưu quyền"}</Button>}</div>
    </form>
  </DialogContent></Dialog>;
}
