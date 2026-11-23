import { useEffect, useRef } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { StoreNotifications } from "./store-notifications";
import type { DateApi } from "./date-api";
import { OnlineApiError } from "./online-kph";
import type { Screen } from "./store-app-routes";
import { useBusinessDate } from "./use-business-date";
import type { LocalDate } from "@coopfood-kph/kph-rules";

export function StoreOnlineNotifications({ api, userId, storeId, suspended, navigate, onOpenDateLot, onSessionExpired }: {
  api: DateApi; userId: string; storeId: string; suspended: boolean;
  navigate: (screen: Screen) => void; onOpenDateLot: (id: string) => void; onSessionExpired: () => void;
}) {
  const client = useQueryClient();
  const today = useBusinessDate();
  const previousToday = useRef(today);
  const key = ["date-lots", userId, storeId, "notifications"] as const;
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => api.list(storeId, {
      attentionOnly: true, sort: "notification", page: pageParam, pageSize: 25,
    }, signal),
    getNextPageParam: last => last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: !suspended,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const date = query.data?.pages[0]?.businessDate as LocalDate | undefined;
  const expiredRefresh = useRef(false);
  const denied = query.error instanceof OnlineApiError && (query.error.status === 401 || query.error.status === 403);
  useEffect(() => {
    if (denied && !expiredRefresh.current) { expiredRefresh.current = true; onSessionExpired(); }
    else if (!denied) expiredRefresh.current = false;
  }, [denied, onSessionExpired]);
  useEffect(() => {
    if (previousToday.current === today) return;
    previousToday.current = today;
    void client.invalidateQueries({ queryKey: key });
  }, [today, client, userId, storeId]);
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") void client.invalidateQueries({ queryKey: key });
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [client, userId, storeId]);
  const pages = query.data?.pages ?? [];
  const allRows = pages.flatMap(page => page.items);
  const byId = new Map(allRows.map(lot => [lot.id, lot]));
  const lots = [...byId.values()];
  const first = pages[0];
  const isRefreshing = query.isFetching && !query.isFetchingNextPage;
  const maskForAuthorization = denied;
  const error = query.isError && (!query.data || maskForAuthorization) ? <div role="alert">Chưa tải được thông báo DATE. <Button onClick={() => void query.refetch()}>Thử lại</Button></div> : undefined;
  const refreshError = query.isRefetchError && query.data && !maskForAuthorization ? <span>Chưa làm mới được danh sách; đang giữ các lô đã tải. <Button onClick={() => void query.refetch()}>Thử lại</Button></span> : undefined;
  const loadMoreError = query.isFetchNextPageError ? <span>Chưa tải được trang tiếp theo. <Button onClick={() => void query.fetchNextPage()}>Thử lại</Button></span> : undefined;
  return <StoreNotifications navigate={navigate} lots={[]} today={date ?? today} onOpenDateLot={onOpenDateLot}
    {...(!maskForAuthorization ? { online: { dateLots: lots, businessDate: date ?? today } } : {})}
    loading={!query.isError && (!first || isRefreshing)} error={error} refreshError={refreshError} loadMoreError={loadMoreError}
    {...(first ? { total: first.totalItems } : {})} hasMore={!!query.hasNextPage} loadingMore={query.isFetchingNextPage}
    onLoadMore={() => { void query.fetchNextPage(); }} />;
}
