import { useMemo } from "react";
import { Bell, CalendarDays, ChevronDown, ChevronRight } from "lucide-react";
import { ListItemMarker } from "@coopfood-kph/ui";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";
import { formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { MockDateLot } from "./store-app-mock";
import type { Screen } from "./store-app-routes";
import { groupDateNotifications } from "./store-notifications-model";
import { remainingShelfPercent } from "./store-date-assessment";
import { DateConditionLabel, getDatePhaseTone } from "./store-date-label";
import "./store-notifications.css";

export function StoreNotifications({ navigate, lots, today, onOpenDateLot }: {
  navigate: (screen: Screen) => void; lots: MockDateLot[]; today: LocalDate; onOpenDateLot: (id: string) => void;
}) {
  const groups = useMemo(() => groupDateNotifications(lots, today), [lots, today]);
  const count = groups.reduce((total, group) => total + group.items.length, 0);
  return <StorePageLayout className="store-notifications"><StorePageHero /><StorePageSurface
    className={`store-report-page-cap store-notifications-body${count ? " has-notifications" : ""}`} aria-label="Danh sách thông báo">
    {count ? <div className="store-notification-groups">
      <section className="store-notification-module" aria-labelledby="notification-date-title">
        <header className="store-notification-module-heading">
          <span className="store-notification-module-icon"><CalendarDays size={22} aria-hidden="true" /></span>
          <div><h2 id="notification-date-title">DATE</h2><p>Cảnh báo hạn dùng và lịch báo lại</p></div>
          <span className="store-notification-total">{count} lô<span className="sr-only"> cần chú ý</span></span>
        </header>
        <div className="store-notification-sections">{groups.map(group => <details key={group.id} open className="store-notification-section" data-notification-group={group.id}>
          <summary><div><h3>{group.title}<span>{group.items.length}</span></h3><p>{group.description}</p></div><ChevronDown size={18} aria-hidden="true" /></summary>
          <div className="store-notification-items">{group.items.map(({ lot, assessment }) => {
            const percent = remainingShelfPercent(assessment);
            return <button key={lot.id} className="store-notification-item ui-list-marker-card" data-notification-lot={lot.id} onClick={() => onOpenDateLot(lot.id)}>
              <ListItemMarker variant="bar" tone={getDatePhaseTone(assessment.phase)} />
              <span className="store-notification-item-copy"><strong>{lot.name}</strong>
                <span className="store-notification-item-meta">
                  <small><span className="sr-only">SKU </span>{lot.sku}<span className="sr-only"> · Lô {lot.id}</span></small>
                  <DateConditionLabel phase={assessment.phase} />
                  <small className="store-notification-expiry">HSD {formatDisplayDate(lot.date)}</small>
                </span>
                {group.id === "reminder" ? <small className="store-notification-reminder">Đến lịch báo lại {formatDisplayDate(lot.remindOn!)}</small> : null}
              </span>
              <span className="store-notification-item-end">{percent !== null ? <span className="store-notification-percent" data-tone={getDatePhaseTone(assessment.phase)}><span className="sr-only">Còn </span><strong>{percent}%</strong><span className="sr-only"> HSD</span></span> : null}<ChevronRight size={18} aria-hidden="true" /></span>
            </button>;
          })}</div>
        </details>)}</div>
      </section>
    </div> : <><span className="store-notifications-icon"><Bell size={30} strokeWidth={1.7} aria-hidden="true" /></span><h2>Chưa có thông báo</h2><p>Cảnh báo và lịch báo lại cần chú ý sẽ xuất hiện tại đây.</p><button type="button" onClick={() => navigate("home")}>Mở trang chủ</button></>}
  </StorePageSurface></StorePageLayout>;
}
