import { useMemo } from "react";
import type { ReactNode } from "react";
import { Button } from "@coopfood-kph/ui";
import { Bell, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { ListItemMarker } from "@coopfood-kph/ui";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { MockDateLot } from "./store-app-mock";
import type { Screen } from "./store-app-routes";
import { groupDateNotifications, groupOnlineDateNotifications } from "./store-notifications-model";
import type { DateLot } from "./date-api";
import { remainingShelfPercent } from "./store-date-assessment";
import { DateConditionLabel, getDatePhaseTone } from "./store-date-label";
import "./store-notifications.css";

export function StoreNotifications({ navigate, lots, today, onOpenDateLot, online, loading, error, refreshError, loadMoreError, total, hasMore, loadingMore, onLoadMore }: {
  navigate: (screen: Screen) => void; lots: MockDateLot[]; today: LocalDate; onOpenDateLot: (id: string) => void;
  online?: { dateLots: DateLot[]; businessDate: LocalDate };
  loading?: boolean; error?: ReactNode; refreshError?: ReactNode; loadMoreError?: ReactNode; total?: number; hasMore?: boolean; loadingMore?: boolean; onLoadMore?: () => void;
}) {
  const groups = useMemo(() => online ? groupOnlineDateNotifications(online.dateLots, online.businessDate) : groupDateNotifications(lots, today), [lots, today, online]);
  const count = groups.reduce((total, group) => total + group.items.length, 0);
  const lotTotal = total ?? count;
  return <StorePageLayout className="store-notifications"><StorePageHero /><StorePageSurface
    className={`store-report-page-cap store-notifications-body${count ? " has-notifications" : ""}`} aria-label="Danh sách thông báo">
    {refreshError ? <div role="alert">{refreshError}</div> : null}
    {loading ? <p role="status">Đang tải thông báo…</p> : error ? error : count ? <div className="store-notification-groups">
      <section className="store-notification-module" aria-labelledby="notification-date-title">
        <header className="store-notification-module-heading">
          <span className="store-notification-module-icon"><CalendarDays size={22} aria-hidden="true" /></span>
          <div><h2 id="notification-date-title">DATE</h2><p>Cảnh báo hạn dùng và lịch báo lại</p></div>
          <span className="store-notification-total">{online ? lotTotal : count}<span className="sr-only"> lô cần chú ý</span></span>
        </header>
        <div className="store-notification-sections">{groups.map(group => <details key={group.id} open className="store-notification-section" data-notification-group={group.id}>
          <summary><div><h3>{group.title}<span>{group.items.length}</span></h3><p>{group.description}</p></div><ChevronDown size={18} aria-hidden="true" /></summary>
          <div className="store-notification-items">{group.items.map(({ lot, assessment }) => {
            const percent = remainingShelfPercent(assessment);
            return <button key={lot.id} className="store-notification-item ui-list-marker-card" data-notification-lot={lot.id} onClick={() => onOpenDateLot(lot.id)}>
              <ListItemMarker variant="bar" tone={getDatePhaseTone(assessment.phase)} />
              <span className="store-notification-item-copy"><strong>{lot.name}</strong><small>SKU {lot.sku} · Lô {lot.lotCode === undefined ? lot.id : lot.lotCode ?? "—"}</small>
                <span className="store-notification-item-state"><DateConditionLabel phase={assessment.phase} />{group.id === "reminder" ? <small>Đến lịch báo lại {formatDisplayDate(lot.remindOn!)}</small> : null}</span>
              </span>
              <span className="store-notification-item-end">{percent !== null ? <span className="store-notification-percent" data-tone={getDatePhaseTone(assessment.phase)}><small>Còn </small><strong>{percent}%</strong><span className="sr-only"> HSD</span></span> : null}<ChevronRight size={18} aria-hidden="true" /></span>
            </button>;
          })}</div>
        </details>)}</div>
      </section>
      {loadMoreError ? <div role="alert">{loadMoreError}</div> : null}
      {online && hasMore ? <p className="store-notification-pagination" role="status">Đang hiển thị {online.dateLots.length} / {lotTotal} lô <Button disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "Đang tải…" : "Tải thêm"}</Button></p> : null}
    </div> : <><span className="store-notifications-icon"><Bell size={30} strokeWidth={1.7} aria-hidden="true" /></span><h2>Chưa có thông báo</h2><p>Cảnh báo và lịch báo lại cần chú ý sẽ xuất hiện tại đây.</p><button type="button" onClick={() => navigate("home")}>Mở trang chủ</button></>}
  </StorePageSurface></StorePageLayout>;
}
