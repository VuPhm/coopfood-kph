import { SignIn, Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Field, Input, ListItemMarker } from "@coopfood-kph/ui";
import { AdminListLabel, schedulePresentation } from "./list-labels";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock3, MapPinned, RefreshCw, ShieldCheck, Store, XCircle } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { AdminShell, type AdminWorkspace } from "./admin-shell";
import { AdminOverview } from "./admin-overview";
import { CatalogWorkspace } from "./catalog-workspace";
import { MembershipWorkspace, membershipRootKey } from "./membership-workspace";
import { IdentityWorkspace } from "./identity-workspace";
import { ChangePasswordDialog } from "./change-password-dialog";
import { createLifecycleAdminGateway, type LifecycleAdminGateway, type LifecycleSchedule, type LifecycleTarget } from "./lifecycle-admin";

type AppProps = { gateway?: LifecycleAdminGateway };
function workspaceFromHash(): AdminWorkspace {
  const hash = window.location.hash.slice(1);
  return hash === "identity" || hash === "catalog" || hash === "lifecycle" || hash === "memberships" ? hash : "overview";
}

type ScheduleAction = "reschedule" | "cancel" | "execute";

function isUnauthorized(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error && error.status === 401;
}

const queryKeys = {
  session: ["admin-session"] as const,
  targets: ["lifecycle-targets"] as const,
  schedules: ["lifecycle-schedules"] as const,
  users: ["admin-users"] as const,
};

export function App({ gateway: providedGateway }: AppProps) {
  const gateway = useMemo(() => providedGateway ?? createLifecycleAdminGateway(), [providedGateway]);
  const queryClient = useQueryClient();
  const [workspace, setWorkspace] = useState<AdminWorkspace>(() => workspaceFromHash());
  useEffect(() => {
    const update = () => { if (window.location.hash !== "#admin-main") setWorkspace(workspaceFromHash()); };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  function navigate(next: AdminWorkspace) { window.location.hash = next; setWorkspace(next); }
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [loginNotice, setLoginNotice] = useState<string | null>(null);
  const sessionQuery = useQuery({ queryKey: queryKeys.session, queryFn: async ({ signal }) => {
    try { return await gateway.getSession(signal); }
    catch (error) { if (isUnauthorized(error)) return null; throw error; }
  }, retry: false });
  const hasCatalog = Boolean(sessionQuery.data?.user.globalRoles.includes("CATALOG_ADMIN"));
  const hasChainAdmin = Boolean(sessionQuery.data?.user.globalRoles.includes("CHAIN_ADMIN"));
  // The session does not expose region assignments. Probe the existing scoped API;
  // never infer inherited scope from membership or global role names alone.
  const targetsQuery = useQuery({ queryKey: [...queryKeys.targets, sessionQuery.data?.user.id], queryFn: ({ signal }) => gateway.listTargets(signal), enabled: Boolean(sessionQuery.data), retry: false });
  const canLifecycle = hasChainAdmin || targetsQuery.isSuccess;
  const membershipStoresQuery = useQuery({ queryKey: [...membershipRootKey, "stores", sessionQuery.data?.user.id], queryFn: ({ signal }) => gateway.listMembershipStores(signal), enabled: Boolean(sessionQuery.data), retry: false });
  const canMemberships = hasChainAdmin || membershipStoresQuery.isSuccess;
  const activeWorkspace = workspace === "catalog" && !hasCatalog || workspace === "identity" && !hasChainAdmin || workspace === "lifecycle" && !canLifecycle || workspace === "memberships" && !canMemberships ? "overview" : workspace;
  const schedulesQuery = useQuery({ queryKey: [...queryKeys.schedules, sessionQuery.data?.user.id], queryFn: ({ signal }) => gateway.listSchedules(signal), enabled: Boolean(sessionQuery.data) && activeWorkspace === "lifecycle", retry: false });
  const usersQuery = useQuery({ queryKey: [...queryKeys.users, sessionQuery.data?.user.id], queryFn: ({ signal }) => gateway.listUsers(signal), enabled: Boolean(sessionQuery.data) && activeWorkspace === "identity", retry: false });
  const clearSession = useCallback(() => {
    queryClient.setQueryData(queryKeys.session, null);
    void queryClient.cancelQueries({ queryKey: membershipRootKey });
    queryClient.removeQueries({ queryKey: membershipRootKey });
    void queryClient.cancelQueries({ queryKey: queryKeys.targets });
    void queryClient.cancelQueries({ queryKey: queryKeys.schedules });
    void queryClient.cancelQueries({ queryKey: queryKeys.users });
    void queryClient.cancelQueries({ queryKey: ["catalog-imports"] });
    void queryClient.cancelQueries({ queryKey: ["catalog-import"] });
    queryClient.removeQueries({ queryKey: queryKeys.targets });
    queryClient.removeQueries({ queryKey: queryKeys.schedules });
    queryClient.removeQueries({ queryKey: queryKeys.users });
    queryClient.removeQueries({ queryKey: ["catalog-imports"] });
    queryClient.removeQueries({ queryKey: ["catalog-import"] });
  }, [queryClient]);
  const handleError = useCallback((error: unknown) => { if (isUnauthorized(error)) clearSession(); }, [clearSession]);
  const expired = isUnauthorized(targetsQuery.error) || isUnauthorized(schedulesQuery.error) || isUnauthorized(usersQuery.error) || isUnauthorized(membershipStoresQuery.error);
  useEffect(() => {
    if (expired) {
      queryClient.setQueryData(queryKeys.session, null);
      void queryClient.cancelQueries({ queryKey: membershipRootKey });
      queryClient.removeQueries({ queryKey: membershipRootKey });
      queryClient.removeQueries({ queryKey: queryKeys.targets });
      queryClient.removeQueries({ queryKey: queryKeys.schedules });
      queryClient.removeQueries({ queryKey: queryKeys.users });
    }
  }, [expired, queryClient]);
  const login = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => gateway.login(username, password),
    onSuccess(session) {
      setLoginNotice(null);
      queryClient.setQueryData(queryKeys.session, session);
      const catalog = session.user.globalRoles.includes("CATALOG_ADMIN");
      navigate("overview");
      void queryClient.invalidateQueries({ queryKey: membershipRootKey });
      if (catalog) void queryClient.invalidateQueries({ queryKey: ["catalog-imports"] });
      else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.targets });
        void queryClient.invalidateQueries({ queryKey: queryKeys.schedules });
      }
      if (session.user.globalRoles.includes("CHAIN_ADMIN")) void queryClient.invalidateQueries({ queryKey: queryKeys.users });
    },
  });
  const logout = useMutation({
    mutationFn: () => gateway.logout(),
    onSuccess: clearSession,
    onError: handleError,
  });

  if (sessionQuery.isPending) return <LoadingScreen />;
  if (!sessionQuery.data || expired) {
    if (!sessionQuery.error || isUnauthorized(sessionQuery.error) || expired) {
      return <SignIn title="Đăng nhập quản trị" logo={`${import.meta.env.BASE_URL}brand/coopfood-logo-dark.png`} busy={login.isPending} error={login.error instanceof Error ? login.error.message : null} notice={loginNotice} onSubmit={(username, password) => login.mutate({ username, password })} />;
    }
    return <LoadFailure message="Không thể kiểm tra phiên Admin Web." onRetry={() => void sessionQuery.refetch()} />;
  }

  const passwordDialog = <ChangePasswordDialog
    open={changePasswordOpen}
    onOpenChange={setChangePasswordOpen}
    onSubmit={(currentPassword, newPassword) => gateway.changePassword(currentPassword, newPassword)}
    onChanged={() => {
      setChangePasswordOpen(false);
      setLoginNotice("Đã đổi mật khẩu. Hãy đăng nhập lại bằng mật khẩu mới.");
      clearSession();
    }}
  />;

  return <AdminShell
    session={sessionQuery.data} workspace={activeWorkspace}
    canIdentity={hasChainAdmin} canCatalog={hasCatalog} canLifecycle={canLifecycle} canMemberships={canMemberships}
    onNavigate={navigate} onChangePassword={() => setChangePasswordOpen(true)}
    onLogout={() => logout.mutate()} logoutBusy={logout.isPending}
  >
    {logout.error instanceof Error && <p role="alert" className="admin-error">{logout.error.message}</p>}
    {targetsQuery.isError && !isUnauthorized(targetsQuery.error) && !(typeof targetsQuery.error === "object" && targetsQuery.error !== null && "status" in targetsQuery.error && targetsQuery.error.status === 403) && <p role="alert" className="admin-error">Không thể tải phạm vi quản trị. <button type="button" onClick={() => void targetsQuery.refetch()}>Thử lại</button></p>}
    {membershipStoresQuery.isError && !isUnauthorized(membershipStoresQuery.error) && !(typeof membershipStoresQuery.error === "object" && membershipStoresQuery.error !== null && "status" in membershipStoresQuery.error && membershipStoresQuery.error.status === 403) && activeWorkspace !== "memberships" && <p role="alert" className="admin-error">Không thể tải cửa hàng được quản lý. <button type="button" onClick={() => void membershipStoresQuery.refetch()}>Thử lại</button></p>}
    {activeWorkspace === "memberships" && <MembershipWorkspace
      key={sessionQuery.data.user.id} gateway={gateway} actorId={sessionQuery.data.user.id}
      stores={membershipStoresQuery.data ?? []} loading={membershipStoresQuery.isPending}
      loadError={membershipStoresQuery.error} onRefreshStores={() => void membershipStoresQuery.refetch()} onError={handleError}
    />}
    {activeWorkspace === "overview" && <AdminOverview />}
    {activeWorkspace === "catalog" && <CatalogWorkspace gateway={gateway} session={sessionQuery.data} onError={handleError} />}
    {activeWorkspace === "identity" && <IdentityWorkspace
      gateway={gateway} session={sessionQuery.data} users={usersQuery.data ?? []}
      loading={usersQuery.isPending} loadError={usersQuery.error instanceof Error ? usersQuery.error.message : null}
      onRefresh={() => void usersQuery.refetch()} onError={handleError}
    />}
    {activeWorkspace === "lifecycle" && <LifecycleWorkspace
      gateway={gateway} targets={targetsQuery.data ?? []} schedules={schedulesQuery.data ?? []}
      loading={targetsQuery.isPending || schedulesQuery.isPending}
      loadError={targetsQuery.error instanceof Error ? targetsQuery.error.message : schedulesQuery.error instanceof Error ? schedulesQuery.error.message : null}
      onRefresh={() => { void targetsQuery.refetch(); void schedulesQuery.refetch(); }} onError={handleError}
    />}
    {passwordDialog}
  </AdminShell>;
}

function LifecycleWorkspace({ gateway, targets, schedules, loading, loadError, onRefresh, onError }: {
  gateway: LifecycleAdminGateway;
  targets: LifecycleTarget[];
  schedules: LifecycleSchedule[];
  loading: boolean;
  loadError: string | null;
  onRefresh(): void;
  onError(error: unknown): void;
}) {
  const queryClient = useQueryClient();
  const [targetKey, setTargetKey] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(toDisplayDate(minimumEffectiveIso()));
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [action, setAction] = useState<{ type: ScheduleAction; schedule: LifecycleSchedule } | null>(null);
  const selectedTarget = targets.find((target) => targetKey === `${target.type}:${target.id}`);
  const refreshLifecycle = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.targets }),
      queryClient.invalidateQueries({ queryKey: queryKeys.schedules }),
    ]);
  };
  const create = useMutation({
    onError,
    mutationFn: () => {
      if (!selectedTarget) throw new Error("Hãy chọn vùng hoặc cửa hàng cần đặt lịch.");
      const iso = displayToIso(effectiveDate);
      if (!iso) throw new Error("Ngày hiệu lực phải theo định dạng dd/mm/yyyy.");
      if (!reason.trim()) throw new Error("Hãy nhập lý do đặt lịch.");
      return gateway.createSchedule({ targetType: selectedTarget.type, targetId: selectedTarget.id, effectiveDate: iso, reason: reason.trim() });
    },
    async onSuccess(schedule) {
      setNotice(`Đã đặt lịch ngừng hoạt động ${schedule.target.code} từ ${toDisplayDate(schedule.effectiveDate)}.`);
      setReason("");
      setTargetKey("");
      await refreshLifecycle();
    },
  });

  function submitCreate(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    create.mutate();
  }

  const pendingCount = schedules.filter((schedule) => schedule.status === "SCHEDULED").length;
  const canManage = targets.length > 0;

  return <div className="admin-workspace admin-business-workspace">
    <div className="admin-workspace-grid">
      <section className="rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="schedule-heading">
        <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand"><CalendarClock aria-hidden="true" /></span><div><h1 id="schedule-heading" className="mt-1 text-2xl font-black tracking-tight">Đặt lịch ngừng hoạt động</h1></div></div>
        <p className="mt-4 text-sm leading-6 text-ink-muted">Vùng hoặc cửa hàng vẫn hoạt động cho đến khi bạn thực thi lịch đã đến hạn. Lịch không tự động chạy.</p>
        <form className="mt-6 grid gap-4" onSubmit={submitCreate}>
          <Field htmlFor="target" label="Vùng hoặc cửa hàng" required><select id="target" className="h-11 w-full rounded-xl border-2 border-surface-strong bg-white px-3 text-base" disabled={!canManage || create.isPending} value={targetKey} onChange={(event) => setTargetKey(event.target.value)}><option value="">Chọn vùng hoặc cửa hàng</option>{targets.map((target) => <option key={`${target.type}:${target.id}`} value={`${target.type}:${target.id}`}>{target.type === "REGION" ? "Vùng" : "Cửa hàng"} · {target.code} · {target.name}</option>)}</select></Field>
          <Field htmlFor="effective-date" label="Ngày hiệu lực" hint={`Sớm nhất ${toDisplayDate(minimumEffectiveIso())}, theo giờ Việt Nam.`} required><Input id="effective-date" inputMode="numeric" placeholder="dd/mm/yyyy" value={effectiveDate} onChange={(event) => setEffectiveDate(event.target.value)} disabled={create.isPending} /></Field>
          <Field htmlFor="schedule-reason" label="Lý do" hint="1–500 ký tự; nội dung được lưu trong lịch sử thao tác." required><textarea id="schedule-reason" className="min-h-28 w-full resize-y rounded-xl border-2 border-surface-strong bg-white px-3 py-2 text-base" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} disabled={create.isPending} /></Field>
          {create.error instanceof Error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger" role="alert">{create.error.message}</p> : null}
          {!canManage && !loading ? <p className="rounded-xl bg-surface-muted px-3 py-3 text-sm text-ink-muted">Không có vùng hoặc cửa hàng đang hoạt động trong phạm vi của bạn.</p> : null}
          <Button disabled={create.isPending || !canManage} type="submit"><CalendarClock aria-hidden="true" size={18} />{create.isPending ? "Đang lưu…" : "Tạo lịch ngừng hoạt động"}</Button>
        </form>
      </section>

      <section className="min-w-0 rounded-3xl border border-surface-strong bg-white p-5 shadow-panel sm:p-6" aria-labelledby="schedule-list-heading">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="schedule-list-heading" className="mt-1 text-2xl font-black tracking-tight">Lịch ngừng hoạt động</h2><p className="mt-2 text-sm text-ink-muted">{pendingCount} lịch đang chờ · {schedules.length} lịch tổng cộng</p></div><Button aria-label="Tải lại lịch ngừng hoạt động" onClick={onRefresh} size="icon" variant="secondary"><RefreshCw aria-hidden="true" size={18} /></Button></div>
        {notice ? <p className="mt-4 flex items-start gap-2 rounded-xl border border-brand/20 bg-brand-soft px-3 py-3 text-sm font-semibold text-brand" role="status"><CheckCircle2 className="mt-0.5 shrink-0" aria-hidden="true" size={17} />{notice}</p> : null}
        {loadError ? <p className="mt-4 rounded-xl bg-danger-soft px-3 py-3 text-sm font-semibold text-danger" role="alert">{loadError}</p> : null}
        {loading ? <p className="mt-6 text-sm text-ink-muted" role="status">Đang tải lịch…</p> : null}
        {!loading && schedules.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface-muted p-8 text-center"><Clock3 className="mx-auto text-brand" aria-hidden="true" /><p className="mt-3 font-black">Chưa có lịch ngừng hoạt động</p><p className="mt-1 text-sm text-ink-muted">Lịch đầu tiên sẽ xuất hiện ở đây sau khi tạo.</p></div> : null}
        <div className="mt-6 grid gap-4">{schedules.map((schedule) => <ScheduleCard key={schedule.id} schedule={schedule} onAction={(type) => setAction({ type, schedule })} />)}</div>
      </section>
    </div>
    {action ? <ScheduleActionDialog action={action} gateway={gateway} onError={onError} onClose={() => setAction(null)} onSuccess={async (message) => { setNotice(message); setAction(null); await refreshLifecycle(); }} /> : null}
  </div>;
}

function ScheduleCard({ schedule, onAction }: { schedule: LifecycleSchedule; onAction(type: ScheduleAction): void }) {
  const scheduled = schedule.status === "SCHEDULED";
  const due = businessTodayIso() >= schedule.effectiveDate;
  const status = schedulePresentation(schedule.status, due);
  const TargetIcon = schedule.target.type === "REGION" ? MapPinned : Store;
  return <article className="ui-list-marker-card rounded-2xl border border-surface-strong bg-surface-muted/55 p-4 sm:p-5">
    <ListItemMarker variant="bar" tone={status.tone} />
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand"><TargetIcon aria-hidden="true" size={20} /></span><div className="min-w-0"><p className="font-black">{schedule.target.code} · {schedule.target.name}</p><p className="mt-1 text-xs text-ink-muted">{schedule.target.type === "REGION" ? "Vùng" : `Cửa hàng · ${schedule.target.regionName}`}</p></div></div><AdminListLabel category="Lịch ngừng hoạt động" presentation={status} /></div>
    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">Ngày hiệu lực</dt><dd className="mt-1 font-black">{toDisplayDate(schedule.effectiveDate)}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-ink-muted">Cập nhật bởi</dt><dd className="mt-1 font-semibold">{schedule.updatedBy.displayName}</dd></div></dl>
    <p className="mt-4 rounded-xl bg-white px-3 py-3 text-sm leading-6 text-ink-muted">{schedule.reason}</p>
    {scheduled ? <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => onAction("reschedule")} variant="secondary">Đổi lịch</Button><Button onClick={() => onAction("cancel")} variant="ghost">Hủy lịch</Button><Button disabled={!due} onClick={() => onAction("execute")} variant="danger"><ShieldCheck aria-hidden="true" size={17} />{due ? "Thực thi" : `Chờ đến ${toDisplayDate(schedule.effectiveDate)}`}</Button></div> : null}
  </article>;
}

function ScheduleActionDialog({ action, gateway, onClose, onSuccess, onError }: { action: { type: ScheduleAction; schedule: LifecycleSchedule }; gateway: LifecycleAdminGateway; onClose(): void; onSuccess(message: string): Promise<void>; onError(error: unknown): void }) {
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(toDisplayDate(action.schedule.effectiveDate));
  const mutation = useMutation({
    onError,
    mutationFn: async () => {
      if (!action) throw new Error("Không có lịch được chọn.");
      if (!reason.trim()) throw new Error("Hãy nhập lý do cho thao tác này.");
      if (action.type === "reschedule") {
        const iso = displayToIso(date);
        if (!iso) throw new Error("Ngày hiệu lực phải theo định dạng dd/mm/yyyy.");
        return gateway.reschedule(action.schedule.id, iso, reason.trim());
      }
      if (action.type === "cancel") return gateway.cancel(action.schedule.id, reason.trim());
      return gateway.execute(action.schedule.id, reason.trim());
    },
    async onSuccess(schedule) {
      const label = action?.type === "reschedule" ? "Đã đổi ngày hiệu lực" : action?.type === "cancel" ? "Đã hủy lịch" : "Đã ngừng hoạt động";
      await onSuccess(`${label} ${schedule.target.code}.`);
      setReason("");
      setDate("");
    },
  });
  const copy = actionCopy(action?.type);
  return <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !mutation.isPending) onClose(); }}><DialogContent><DialogHeader><DialogTitle>{copy.title}</DialogTitle><DialogDescription>{action ? `${action.schedule.target.code} · ${action.schedule.target.name}. ${copy.description}` : copy.description}</DialogDescription></DialogHeader><form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); mutation.mutate(); }}>{action?.type === "reschedule" ? <Field htmlFor="reschedule-date" label="Ngày hiệu lực mới" required><Input id="reschedule-date" inputMode="numeric" placeholder="dd/mm/yyyy" value={date} onChange={(event) => setDate(event.target.value)} /></Field> : null}<Field htmlFor="action-reason" label="Lý do" required><textarea id="action-reason" className="min-h-24 w-full resize-y rounded-xl border-2 border-surface-strong px-3 py-2 text-base" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></Field>{mutation.error instanceof Error ? <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger" role="alert">{mutation.error.message}</p> : null}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={onClose} disabled={mutation.isPending}>Quay lại</Button><Button type="submit" variant={action?.type === "execute" ? "danger" : "primary"} disabled={mutation.isPending}>{mutation.isPending ? "Đang xử lý…" : copy.submit}</Button></div></form></DialogContent></Dialog>;
}

function LoadingScreen() { return <main className="grid min-h-dvh place-items-center bg-canvas text-ink"><p className="flex items-center gap-3 font-bold" role="status"><RefreshCw className="animate-spin motion-reduce:animate-none text-brand" aria-hidden="true" />Đang mở Admin Web…</p></main>; }
function LoadFailure({ message, onRetry }: { message: string; onRetry(): void }) { return <main className="grid min-h-dvh place-items-center bg-canvas px-4 text-ink"><section className="max-w-md rounded-3xl border border-surface-strong bg-white p-6 text-center shadow-panel"><XCircle className="mx-auto text-danger" aria-hidden="true" /><h1 className="mt-4 text-xl font-black">Chưa thể mở Admin Web</h1><p className="mt-2 text-sm text-ink-muted">{message}</p><Button className="mt-5" onClick={onRetry}>Thử lại</Button></section></main>; }

function actionCopy(type: ScheduleAction | undefined) {
  if (type === "reschedule") return { title: "Đổi ngày hiệu lực", description: "Ngày mới phải cách ngày hiện tại ít nhất 30 ngày.", submit: "Lưu ngày mới" };
  if (type === "execute") return { title: "Xác nhận ngừng hoạt động", description: "Chỉ thực hiện khi lịch đã đến hạn. Vùng phải không còn cửa hàng hoạt động; cửa hàng phải còn quản lý đang hoạt động.", submit: "Ngừng hoạt động ngay" };
  return { title: "Hủy lịch ngừng hoạt động", description: "Lịch đã hủy vẫn được giữ lại trong lịch sử thao tác.", submit: "Xác nhận hủy lịch" };
}

function businessTodayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function minimumEffectiveIso() {
  const [year, month, day] = businessTodayIso().split("-").map(Number);
  const date = new Date(Date.UTC(year!, month! - 1, day! + 30));
  return date.toISOString().slice(0, 10);
}

function toDisplayDate(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : iso;
}

function displayToIso(display: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const iso = `${match[3]}-${match[2]}-${match[1]}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}
