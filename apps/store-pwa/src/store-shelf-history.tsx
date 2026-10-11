import { useCallback, useRef, useState } from "react";
import { History, RotateCcw } from "lucide-react";
import { formatDisplayDate, type LocalDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";

export type ShelfLookupSnapshot = {
  known: boolean;
  nsx: LocalDate;
  hsd: LocalDate;
  days: string;
  months: string;
  value: ShelfLifeResult;
  calculatedOn: LocalDate;
};
export type ShelfLookupRecord = ShelfLookupSnapshot & { id: number; recordedAt: number };

export function useShelfLookupHistory() {
  const [history, setHistory] = useState<ShelfLookupRecord[]>([]);
  const sequence = useRef(0);
  const remember = useCallback((snapshot: ShelfLookupSnapshot) => {
    const entry = { ...snapshot, id: ++sequence.current, recordedAt: Date.now() };
    setHistory(previous => {
      const last = previous[0];
      // Auto lookup followed by submit must not consume two history slots.
      if (last && last.known === entry.known && last.nsx === entry.nsx && last.hsd === entry.hsd
        && last.days === entry.days && last.months === entry.months && last.calculatedOn === entry.calculatedOn) return previous;
      return [entry, ...previous].slice(0, 20);
    });
  }, []);
  return { history, remember };
}

const clock = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
const statuses = { SAFE: "An toàn", WARNING: "Sắp đến hạn lùi", DANGER: "Cần lùi hàng", EXPIRED: "Đã hết hạn sử dụng" };

export function ShelfLookupHistory({ history, onRecall }: { history: readonly ShelfLookupRecord[]; onRecall: (entry: ShelfLookupRecord) => void }) {
  return <section className="store-shelf-history" aria-labelledby="shelf-history-title">
    <header><div><h2 id="shelf-history-title"><History size={18} aria-hidden="true" />Lịch sử tra cứu <span>{history.length}/20</span></h2><p>Trạng thái được ghi tại thời điểm tra.</p></div><small>20 lần gần nhất trong phiên</small></header>
    {history.length === 0 ? <div className="store-shelf-history-empty"><History size={24} aria-hidden="true" /><strong>Chưa có lịch sử tra cứu</strong><p>Các lần tra hợp lệ trên màn này sẽ xuất hiện ở đây.</p></div> : <>
      <div className="store-shelf-history-columns" aria-hidden="true"><span>Thời gian tra</span><div><span>Ngày sản xuất</span><span>Hạn sử dụng</span><span>Hạn lùi</span></div><span>Trạng thái lúc tra</span><span /></div>
      <ol className="store-shelf-history-list">{history.map(entry => <li key={entry.id}>
        <div className="store-shelf-history-time"><time dateTime={new Date(entry.recordedAt).toISOString()}>{clock.format(entry.recordedAt)}</time><small>{formatDisplayDate(entry.calculatedOn)}</small></div>
        <dl><div><dt>Ngày sản xuất</dt><dd>{formatDisplayDate(entry.nsx)}<small>{entry.known ? "Nhập ngày NSX" : `Suy từ ${entry.months || entry.days} ${entry.months ? "tháng" : "ngày"}`}</small></dd></div><div><dt>Hạn sử dụng</dt><dd>{formatDisplayDate(entry.hsd)}</dd></div><div><dt>Hạn lùi</dt><dd>{formatDisplayDate(entry.value.withdrawalDate)}</dd></div></dl>
        <span className={`store-chip chip-${entry.value.status.toLowerCase()}`} aria-label={`Trạng thái lúc tra: ${statuses[entry.value.status]}`}>{statuses[entry.value.status]}</span>
        <button type="button" className="store-shelf-history-recall" onClick={() => onRecall(entry)} aria-label={`Tra lại ${formatDisplayDate(entry.nsx)} đến ${formatDisplayDate(entry.hsd)}`}><RotateCcw size={15} aria-hidden="true" /><span>Tra lại</span></button>
      </li>)}</ol>
    </>}
  </section>;
}
