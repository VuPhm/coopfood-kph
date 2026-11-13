import { StoreAccountTrigger, storeAccountIdentity } from "./store-account-trigger";
import { StoreAccountSheet } from "./store-account-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { ChangePasswordDialog } from "./change-password-dialog";
import { StoreHomeContent } from "./store-home";
import { ShelfLifeScreen } from "./store-shelf-life";
import { StoreLogin } from "./store-login";
import { StoreAppFrame } from "./store-app-frame";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { readStoreScreen, storeScreens, type Screen } from "./store-app-routes";
import { OnlineApiError } from "./online-kph";
import { createStoreSessionGateway, type StoreSessionGateway } from "./store-session-api";
import { StoreBarcodeLookup } from "./store-barcode-lookup";
import { StoreOnlineKph } from "./store-online-kph";
import "./store-online-app.css";

export function StoreOnlineApp({ gateway: provided }: { gateway?: StoreSessionGateway }) {
  const [gateway] = useState(() => provided ?? createStoreSessionGateway());
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}><StoreOnlineSession gateway={gateway} /></QueryClientProvider>;
}

function StoreOnlineSession({ gateway }: { gateway: StoreSessionGateway }) {
  const client = useQueryClient();
  const [loginVisible, setLoginVisible] = useState(false);
  const accountTrigger = useRef<HTMLButtonElement>(null);
  const selectionTicket = useRef(0);
  const selectedActor = useRef<string | undefined>(undefined);
  const [selectedId, setSelectedId] = useState<string>();
  const [screen, setScreen] = useState<Screen>(readStoreScreen);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const scope = useQuery({
    queryKey: ["store-session"],
    queryFn: async ({ signal }) => {
      const session = await gateway.getSession(signal);
      const stores = await gateway.listStoreAccess(signal);
      return { session, stores };
    },
    retry: false,
    networkMode: "always",
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    if (scope.isError) { setPasswordOpen(false); setAccountOpen(false); }
    if (scope.isError || (scope.data && (scope.data.session.user.id !== selectedActor.current || !scope.data.stores.some(store => store.id === selectedId)))) setSelectedId(undefined);
  }, [scope.data, scope.isError, selectedId]);
  const refreshScope = useCallback(() => { void scope.refetch({ cancelRefetch: false }); }, [scope.refetch]);
  useEffect(() => {
    let frame: number | undefined;
    const refresh = () => {
      if (document.visibilityState !== "visible" || frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; refreshScope(); });
    };
    const sync = () => { ++selectionTicket.current; setScreen(readStoreScreen()); refreshScope(); };
    window.addEventListener("hashchange", sync);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { if (frame !== undefined) cancelAnimationFrame(frame); window.removeEventListener("hashchange", sync); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [refreshScope]);
  const selectedStore = scope.data?.stores.find(item => item.id === selectedId);
  const profile = useMemo(() => ({ storeName: selectedStore?.name ?? "", storeCode: selectedStore?.code ?? "", fullName: scope.data?.session.user.displayName ?? "", employeeCode: "", role: "" as const }), [selectedStore?.name, selectedStore?.code, scope.data?.session.user.displayName]);
  const sessionUnauthorized = scope.isError && scope.error instanceof OnlineApiError && scope.error.status === 401;
  // Retrying a no-data session query must not replace an existing login draft.
  useEffect(() => {
    if (sessionUnauthorized) setLoginVisible(true);
    else if (scope.isSuccess) setLoginVisible(false);
  }, [sessionUnauthorized, scope.isSuccess]);
  const anonymous = loginVisible || sessionUnauthorized;
  async function login(username: string, password: string) {
    ++selectionTicket.current;
    setBusy(true); setMessage(""); setSelectedId(undefined);
    try { await gateway.login(username, password); window.history.replaceState(null, "", "#home"); setScreen("home"); await scope.refetch(); }
    catch (error) { setMessage(error instanceof OnlineApiError && error.status === 401 ? "Tên đăng nhập hoặc mật khẩu không đúng." : "Không thể đăng nhập. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  async function logout() {
    ++selectionTicket.current;
    setBusy(true); setMessage(""); setSelectedId(undefined);
    try { await gateway.logout(); }
    catch { setMessage("Không thể xác nhận đăng xuất. Vui lòng thử lại."); }
    finally { await client.resetQueries({ queryKey: ["store-session"] }); setBusy(false); }
  }
  if (anonymous) return <StoreLogin busy={busy} error={message} onSubmit={(username, password) => { void login(username, password); }} />;
  if (scope.isPending || (scope.isFetching && (!selectedId || scope.data?.session.user.id !== selectedActor.current || !scope.data?.stores.some(store => store.id === selectedId)))) return <main className="store-online-state" role="status">Đang xác minh phiên và quyền cửa hàng…</main>;
  if (scope.isError || !scope.data) return <main className="store-online-state"><p role="alert">Không thể xác minh phiên và quyền cửa hàng.</p><Button onClick={() => { void scope.refetch(); }}>Thử lại</Button></main>;
  const { session, stores } = scope.data;
  const store = selectedActor.current === session.user.id ? stores.find(item => item.id === selectedId) : undefined;
  const passwordDialog = <ChangePasswordDialog open={passwordOpen && !scope.isFetching} onOpenChange={setPasswordOpen} onSubmit={gateway.changePassword} onChanged={() => { setPasswordOpen(false); setSelectedId(undefined); setMessage("Mật khẩu đã đổi. Hãy đăng nhập lại bằng mật khẩu mới."); void client.resetQueries({ queryKey: ["store-session"] }); }} />;
  const actions = <>{store && <section className="online-capabilities"><h3>Quyền hàng không phù hợp</h3><ul>{([['VIEW', 'Xem phiếu'], ['CREATE', 'Tạo phiếu'], ['REVIEW', 'Duyệt phiếu'], ['EXPORT', 'Xuất phiếu']] as const).filter(([key]) => store.capabilities.includes(key)).map(([key, label]) => <li key={key}>{label}</li>)}</ul></section>}<div className="store-online-actions">{store && <Button disabled={busy} onClick={() => { setAccountOpen(false); setSelectedId(undefined); void scope.refetch(); }}>Đổi cửa hàng</Button>}<Button disabled={busy} onClick={() => { setAccountOpen(false); setPasswordOpen(true); }}>Đổi mật khẩu</Button><Button disabled={busy} onClick={() => { setAccountOpen(false); void logout(); }}>Đăng xuất</Button></div></>;
  if (!store) return <main aria-busy={scope.isFetching} className="store-online-state store-chooser">
    <h1>Chọn cửa hàng</h1><p>{session.user.displayName}</p>
    {message ? <p role="alert">{message}</p> : null}
    {stores.length ? <ul className="store-online-stores">{stores.map(item => <li key={item.id}><Button disabled={busy || scope.isFetching} onClick={async () => {
      // Recheck before entering; selection never grants authority.
      const ticket = ++selectionTicket.current;
      const refreshed = await scope.refetch();
      if (ticket === selectionTicket.current && refreshed.data?.session.user.id === session.user.id && refreshed.data.stores.some(next => next.id === item.id) && !refreshed.isError) { selectedActor.current = session.user.id; setSelectedId(item.id); }
    }}>{item.code} · {item.name}</Button></li>)}</ul> : <p role="status">Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.</p>}
    <Button onClick={() => { void scope.refetch(); }}>Tải lại quyền cửa hàng</Button>{actions}{passwordDialog}
  </main>;
  const currentScreen = screen === "login" ? "home" : screen;
  return <><div style={scope.isFetching ? { visibility: "hidden" } : undefined} inert={scope.isFetching || undefined} aria-hidden={scope.isFetching || undefined}><StoreAppFrame key={`${session.user.id}:${store.id}`} screen={currentScreen} profile={profile}
    navigate={next => { window.location.hash = next; }} account={<>
      <StoreAccountTrigger ref={accountTrigger} aria-label="Tài khoản" profile={profile} roleLabel={session.user.username} onClick={() => setAccountOpen(true)} />
      <StoreAccountSheet open={accountOpen && !scope.isFetching} onOpenChange={setAccountOpen} profile={profile}
        initials={storeAccountIdentity(profile).initials} triggerRef={accountTrigger} roleLabel={session.user.username}
        onHome={() => { setAccountOpen(false); window.location.hash = "home"; }} actions={actions} />
      {passwordDialog}</>}>
    {currentScreen === "home" && <StoreHomeContent profile={profile} lookupOnly navigate={next => { window.location.hash = next; }} />}
    {currentScreen === "kph" && <StoreOnlineKph suspended={scope.isFetching} userId={session.user.id} storeId={store.id} loadHistory={gateway.loadHistory} createRecord={gateway.createRecord} lookupBarcode={gateway.lookupBarcode} profile={profile} canCreate={store.capabilities.includes("CREATE")} onSessionExpired={refreshScope} />}
    {currentScreen === "shelf" && <StorePageLayout><StorePageHero /><StorePageSurface className="store-shelf-surface"><div className="store-shelf-page"><ShelfLifeScreen /></div></StorePageSurface></StorePageLayout>}
    {currentScreen === "date" && <StorePageLayout><StorePageHero /><StorePageSurface className="store-online-content"><StoreBarcodeLookup suspended={scope.isFetching} userId={session.user.id} storeId={store.id} lookupBarcode={gateway.lookupBarcode} onSessionExpired={refreshScope} /></StorePageSurface></StorePageLayout>}
    {(currentScreen === "reports" || currentScreen === "notifications") && <StorePageLayout><StorePageHero /><StorePageSurface className="store-online-content"><h1>{storeScreens[currentScreen].title} chưa kết nối</h1><p role="status">{storeScreens[currentScreen].title} chưa được kết nối trong phiên online.</p></StorePageSurface></StorePageLayout>}
    {message && <p role="alert">{message}</p>}
  </StoreAppFrame></div>{scope.isFetching ? <main className="store-online-state store-online-verifying" role="status">Đang xác minh phiên và quyền cửa hàng…</main> : null}</>;
}
