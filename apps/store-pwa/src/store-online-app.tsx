import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription } from "@coopfood-kph/ui";
import { StoreOnlineKph } from "./store-online-kph";
import { StoreBarcodeLookup } from "./store-barcode-lookup";
import { ChangePasswordDialog } from "./change-password-dialog";
import { StoreLogin } from "./store-login";
import { StoreAppFrame } from "./store-app-frame";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { readStoreScreen, type Screen } from "./store-app-routes";
import { OnlineApiError } from "./online-kph";
import { createStoreSessionGateway, type StoreSessionGateway } from "./store-session-api";
import "./store-online-app.css";

export function StoreOnlineApp({ gateway: provided }: { gateway?: StoreSessionGateway }) {
  const [gateway] = useState(() => provided ?? createStoreSessionGateway());
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}><StoreOnlineSession gateway={gateway} /></QueryClientProvider>;
}

function StoreOnlineSession({ gateway }: { gateway: StoreSessionGateway }) {
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
    if (scope.isError) setPasswordOpen(false);
    if (scope.isError || (scope.data && !scope.data.stores.some(store => store.id === selectedId))) setSelectedId(undefined);
  }, [scope.data, scope.isError, selectedId]);
  useEffect(() => {
    const sync = () => { setScreen(readStoreScreen()); void scope.refetch({ cancelRefetch: false }); };
    let frame = 0;
    window.addEventListener("hashchange", sync);
    window.addEventListener("focus", refreshScope);
    function refreshScope() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { void scope.refetch({ cancelRefetch: false }); });
    }
    const refresh = () => { if (document.visibilityState === "visible") refreshScope(); };
    document.addEventListener("visibilitychange", refresh);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("hashchange", sync); window.removeEventListener("focus", refreshScope); document.removeEventListener("visibilitychange", refresh); };
  }, [scope.refetch]);
  const anonymous = scope.isError && scope.error instanceof OnlineApiError && scope.error.status === 401;
  async function login(username: string, password: string) {
    setBusy(true); setMessage(""); setSelectedId(undefined);
    try { await gateway.login(username, password); window.history.replaceState(null, "", "#home"); setScreen("home"); await scope.refetch(); }
    catch (error) { setMessage(error instanceof OnlineApiError && error.status === 401 ? "Tên đăng nhập hoặc mật khẩu không đúng." : "Không thể đăng nhập. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }
  async function logout() {
    setBusy(true); setMessage(""); setSelectedId(undefined);
    try { await gateway.logout(); }
    catch { setMessage("Không thể xác nhận đăng xuất. Vui lòng thử lại."); }
    finally { await scope.refetch(); setBusy(false); }
  }
  if (anonymous) return <StoreLogin busy={busy} error={message} onSubmit={(username, password) => { void login(username, password); }} />;
  if (scope.isPending) return <main className="store-online-state" role="status">Đang xác minh phiên và quyền cửa hàng…</main>;
  if (scope.isError || !scope.data) return <main className="store-online-state"><p role="alert">Không thể xác minh phiên và quyền cửa hàng.</p><Button onClick={() => { void scope.refetch(); }}>Thử lại</Button></main>;
  const { session, stores } = scope.data;
  const store = stores.find(item => item.id === selectedId);
  const passwordDialog = <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} onSubmit={gateway.changePassword} onChanged={() => { setPasswordOpen(false); setSelectedId(undefined); setMessage("Mật khẩu đã đổi. Hãy đăng nhập lại bằng mật khẩu mới."); void scope.refetch(); }} />;
  const actions = <div className="store-online-actions"><Button disabled={busy} onClick={() => { setAccountOpen(false); setSelectedId(undefined); void scope.refetch(); }}>Đổi cửa hàng</Button><Button disabled={busy} onClick={() => { setAccountOpen(false); setPasswordOpen(true); }}>Đổi mật khẩu</Button><Button disabled={busy} onClick={() => { setAccountOpen(false); void logout(); }}>Đăng xuất</Button>{passwordDialog}</div>;
  if (!store) return <main className="store-online-state">
    <h1>Chọn cửa hàng</h1><p>{session.user.displayName}</p>
    {message ? <p role="alert">{message}</p> : null}
    {stores.length ? <ul className="store-online-stores">{stores.map(item => <li key={item.id}><Button disabled={busy} onClick={async () => {
      // Recheck before entering; selection never grants authority.
      const refreshed = await scope.refetch();
      if (refreshed.data?.stores.some(next => next.id === item.id) && !refreshed.isError) setSelectedId(item.id);
    }}>{item.code} · {item.name}</Button></li>)}</ul> : <p role="status">Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.</p>}
    <Button onClick={() => { void scope.refetch(); }}>Tải lại quyền cửa hàng</Button>{actions}
  </main>;
  const profile = { storeName: store.name, storeCode: store.code, fullName: session.user.displayName, employeeCode: "", role: "" as const };
  return <StoreAppFrame key={`${session.user.id}:${store.id}`} busy={scope.isFetching} screen={screen === "login" ? "home" : screen} profile={profile}
    navigate={next => { window.location.hash = next; }} account={<><button type="button" className="store-online-account" aria-label="Tài khoản" onClick={() => setAccountOpen(true)}><UserRound size={22} aria-hidden="true" /></button><Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><DialogTitle>Tài khoản</DialogTitle><DialogDescription>{session.user.displayName} · {store.code} · {store.name}</DialogDescription>{actions}</DialogContent></Dialog>{passwordDialog}</>}>
    <StorePageLayout><StorePageHero /><StorePageSurface className="store-online-content">
      {message ? <p role="alert">{message}</p> : null}
      {screen === "home" ? <><h2>{store.name}</h2><p>{session.user.displayName}</p><div className="store-online-actions"><Button onClick={() => { window.location.hash = "kph"; }}>KPH</Button><Button variant="secondary" onClick={() => { window.location.hash = "date"; }}>Tra mã hàng</Button></div></> : null}
      {screen === "date" ? <StoreBarcodeLookup storeId={store.id} lookupBarcode={gateway.lookupBarcode} onSessionExpired={() => { setSelectedId(undefined); void scope.refetch(); }} /> : null}
      {screen === "kph" ? <StoreOnlineKph userId={session.user.id} storeId={store.id} loadHistory={gateway.loadHistory} onSessionExpired={() => { setSelectedId(undefined); void scope.refetch(); }} /> : null}
      {!["home", "date", "kph"].includes(screen) ? <p>Chưa khả dụng</p> : null}
    </StorePageSurface></StorePageLayout>
  </StoreAppFrame>;
}
