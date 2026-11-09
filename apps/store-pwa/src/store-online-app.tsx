import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, DialogContent, DialogTitle, DialogDescription } from "@coopfood-kph/ui";
import { ChangePasswordDialog } from "./change-password-dialog";
import { StoreLogin } from "./store-login";
import { StoreAppFrame } from "./store-app-frame";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { readStoreScreen, storeScreens, type Screen } from "./store-app-routes";
import { OnlineApiError } from "./online-kph";
import { createStoreSessionGateway, type StoreSessionGateway } from "./store-session-api";
import "./store-online-app.css";

export function StoreOnlineApp({ gateway: provided }: { gateway?: StoreSessionGateway }) {
  const [gateway] = useState(() => provided ?? createStoreSessionGateway());
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}><StoreOnlineSession gateway={gateway} /></QueryClientProvider>;
}

function StoreOnlineSession({ gateway }: { gateway: StoreSessionGateway }) {
  const client = useQueryClient();
  const selectionTicket = useRef(0);
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
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
  useEffect(() => {
    if (scope.isError) { setPasswordOpen(false); setAccountOpen(false); }
    if (scope.isError || (scope.data && !scope.data.stores.some(store => store.id === selectedId))) setSelectedId(undefined);
  }, [scope.data, scope.isError, selectedId]);
  useEffect(() => {
    const sync = () => { ++selectionTicket.current; setScreen(readStoreScreen()); void scope.refetch(); };
    window.addEventListener("hashchange", sync);
    window.addEventListener("focus", refreshScope);
    function refreshScope() { void scope.refetch(); }
    const refresh = () => { if (document.visibilityState === "visible") void scope.refetch(); };
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("focus", refreshScope); document.removeEventListener("visibilitychange", refresh); };
  }, [scope.refetch]);
  const anonymous = scope.isError && scope.error instanceof OnlineApiError && scope.error.status === 401;
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
  if (scope.isPending || scope.isFetching) return <main className="store-online-state" role="status">Đang xác minh phiên và quyền cửa hàng…</main>;
  if (scope.isError || !scope.data) return <main className="store-online-state"><p role="alert">Không thể xác minh phiên và quyền cửa hàng.</p><Button onClick={() => { void scope.refetch(); }}>Thử lại</Button></main>;
  const { session, stores } = scope.data;
  const store = stores.find(item => item.id === selectedId);
  const passwordDialog = <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} onSubmit={gateway.changePassword} onChanged={() => { setPasswordOpen(false); setSelectedId(undefined); setMessage("Mật khẩu đã đổi. Hãy đăng nhập lại bằng mật khẩu mới."); void client.resetQueries({ queryKey: ["store-session"] }); }} />;
  const actions = <div className="store-online-actions"><Button disabled={busy} onClick={() => { setAccountOpen(false); setSelectedId(undefined); void scope.refetch(); }}>Đổi cửa hàng</Button><Button disabled={busy} onClick={() => { setAccountOpen(false); setPasswordOpen(true); }}>Đổi mật khẩu</Button><Button disabled={busy} onClick={() => { setAccountOpen(false); void logout(); }}>Đăng xuất</Button></div>;
  if (!store) return <main className="store-online-state">
    <h1>Chọn cửa hàng</h1><p>{session.user.displayName}</p>
    {message ? <p role="alert">{message}</p> : null}
    {stores.length ? <ul className="store-online-stores">{stores.map(item => <li key={item.id}><Button disabled={busy} onClick={async () => {
      // Recheck before entering; selection never grants authority.
      const ticket = ++selectionTicket.current;
      const refreshed = await scope.refetch();
      if (ticket === selectionTicket.current && refreshed.data?.stores.some(next => next.id === item.id) && !refreshed.isError) setSelectedId(item.id);
    }}>{item.code} · {item.name}</Button></li>)}</ul> : <p role="status">Tài khoản chưa có quyền truy cập cửa hàng đang hoạt động.</p>}
    <Button onClick={() => { void scope.refetch(); }}>Tải lại quyền cửa hàng</Button>{actions}{passwordDialog}
  </main>;
  const currentScreen = screen === "login" ? "home" : screen;
  const profile = { storeName: store.name, storeCode: store.code, fullName: session.user.displayName, employeeCode: "", role: "" as const };
  return <StoreAppFrame key={store.id} screen={currentScreen} profile={profile}
    navigate={next => { window.location.hash = next; }} account={<><button type="button" className="store-online-account" aria-label="Tài khoản" onClick={() => setAccountOpen(true)}><UserRound size={22} aria-hidden="true" /></button><Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><DialogTitle>Tài khoản</DialogTitle><DialogDescription>{session.user.displayName} · {store.code} · {store.name}</DialogDescription>{actions}</DialogContent></Dialog>{passwordDialog}</>}>
    <StorePageLayout><StorePageHero /><StorePageSurface className="store-online-content">
      <h1>{currentScreen === "home" ? store.name : `${storeScreens[currentScreen].title} chưa kết nối`}</h1><p>{currentScreen === "home" ? "Mã cửa hàng" : store.name} · {store.code}</p><p>{session.user.displayName}</p>
      {message ? <p role="alert">{message}</p> : null}
      {currentScreen === "home" && <><h2>Quyền hàng không phù hợp</h2><ul>{([['VIEW', 'Xem phiếu'], ['CREATE', 'Tạo phiếu'], ['REVIEW', 'Duyệt phiếu'], ['EXPORT', 'Xuất phiếu']] as const).filter(([key]) => store.capabilities.includes(key)).map(([key, label]) => <li key={key}>{label}</li>)}</ul></>}
      <p role="status">{screen === "home" || screen === "login" ? "Đã xác nhận tài khoản và cửa hàng. Màn KPH đang được nối dữ liệu trong bước tiếp theo." : `${storeScreens[screen].title} chưa được kết nối trong phiên online. Không có dữ liệu minh họa trong màn này.`}</p>
    </StorePageSurface></StorePageLayout>
  </StoreAppFrame>;
}
