import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { approvalLabels, type RecordView } from "./record-view";
import { figmaAsset } from "./figma-assets";
import { ListItemMarker } from "@coopfood-kph/ui";
import { getKphLabelPresentation, KphListLabel } from "./store-kph-label";
import { KPH_BATCH_SIZE, kphDateRuns } from "./store-kph-history";
import { useStorePrint } from "./use-store-print";
import "./store-kph-items.css";

function DayHeading({ date, shown, total, checked, partial, disabled, selectionMode, expanded, contentId, onToggle, onChange }: {
  date: string; shown: number; total: number; checked: boolean; partial: boolean;
  disabled: boolean; selectionMode: boolean; expanded: boolean; contentId: string;
  onToggle: () => void; onChange: (checked: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (input.current) input.current.indeterminate = partial; }, [partial, selectionMode]);
  const dateLabel = <span className="store-kph-day-date">{date}</span>;
  const count = <span className="store-kph-day-count">{shown < total ? `${shown}/${total} phiếu đã hiện` : `${shown} phiếu`}</span>;
  return <div className="store-kph-day-heading">
    {selectionMode ? <label className="store-kph-day-selector">
      <input ref={input} type="checkbox" aria-label={`Chọn ngày ${date}`} aria-description="Chỉ chọn các phiếu đã hiển thị thuộc ngày này" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />
    </label> : null}
    <button type="button" className="store-kph-day-toggle" disabled={disabled} aria-label={`${expanded ? "Thu gọn" : "Mở rộng"} ngày ${date}`} aria-expanded={expanded} aria-controls={contentId} onClick={onToggle}>
      <ChevronDown size={16} aria-hidden="true" />{dateLabel}{count}
    </button>
  </div>;
}

export function StoreKphMore({ shown, total, loading = false, onMore }: {
  shown: number; total: number; loading?: boolean; onMore?: () => void;
}) {
  if (!total) return null;
  return <div className="store-kph-more"><p role={loading ? undefined : "status"}>Đã hiển thị {shown}/{total} phiếu</p>
    {shown < total ? <button type="button" disabled={loading} onClick={onMore}>Hiển thị thêm <span>· {Math.min(KPH_BATCH_SIZE, total - shown)} phiếu</span></button> : null}
  </div>;
}

function KphTagStrip({ record, screenLayout }: { record: RecordView; screenLayout: boolean }) {
  const strip = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflow: false, back: false, more: false });
  const measure = () => {
    const element = strip.current;
    if (!element) return;
    const next = { overflow: element.scrollWidth > element.clientWidth + 1,
      back: element.scrollLeft > 1, more: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 };
    setEdges(previous => previous.overflow === next.overflow && previous.back === next.back && previous.more === next.more ? previous : next);
  };
  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined" || !strip.current) return;
    const observer = new ResizeObserver(measure);
    observer.observe(strip.current);
    return () => observer.disconnect();
  }, [record.condition, record.resolution, record.approvalStatus, screenLayout]);
  return <div className="store-ticket-tag-shell" data-back={edges.back || undefined} data-more={edges.more || undefined}>
    <div ref={strip} className="store-ticket-tags" role="group" aria-label={`Nhãn phiếu ${record.productName}`} aria-description={edges.overflow ? "Vuốt ngang hoặc dùng phím mũi tên để xem thêm nhãn" : undefined} tabIndex={edges.overflow ? 0 : undefined} onScroll={measure}>
      <KphListLabel kind="condition" value={record.condition} />
      <KphListLabel kind="resolution" value={record.resolution} />
      {!screenLayout ? <KphListLabel kind="approval" value={approvalLabels[record.approvalStatus]} className={`chip-${record.approvalStatus === "APPROVED" ? "safe" : record.approvalStatus === "PENDING" ? "warning" : "neutral"}`} /> : null}
    </div>
  </div>;
}

function KphTicketMeta({ record, identifier, groupByDate }: {
  record: RecordView; identifier: string; groupByDate: boolean;
}) {
  return <span className="store-ticket-quick"><span className="store-ticket-sku">{identifier}</span><span className="store-ticket-meta">{record.quantity}</span>{!groupByDate ? <span className="store-ticket-date"><CalendarDays size={13} aria-hidden="true" /><span className="sr-only">Ngày phát hiện: </span>{record.detectedDate}</span> : null}</span>;
}

export function StoreKphList({ desktop, visible, totalByDate, groupByDate = true, selectionMode = false, selection = [], setSelection = () => {}, collapsedDates = [], onToggleDate = () => {}, setActive = () => {}, loading = false }: {
  desktop: boolean; visible: RecordView[]; groupByDate?: boolean; totalByDate?: ReadonlyMap<string, number>; selectionMode?: boolean; selection?: string[];
  setSelection?: (ids: string[]) => void; collapsedDates?: string[]; onToggleDate?: (date: string) => void; setActive?: (record: RecordView) => void; loading?: boolean;
}) {
  const listId = useId();
  const printing = useStorePrint();
  const screenLayout = !printing;
  const groups = useMemo(() => groupByDate ? kphDateRuns(visible) : visible.length ? [{ date: "", records: visible }] : [], [visible, groupByDate]);
  const byDate = useMemo(() => {
    const result = new Map<string, RecordView[]>();
    for (const record of visible) {
      const records = result.get(record.detectedDate);
      if (records) records.push(record);
      else result.set(record.detectedDate, [record]);
    }
    return result;
  }, [visible]);
  const selectRecords = (records: RecordView[], checked: boolean) => {
    const ids = new Set(records.map(record => record.id));
    setSelection(checked ? [...new Set([...selection, ...ids])] : selection.filter(id => !ids.has(id)));
  };
  const heading = (date: string, contentId: string, expanded: boolean) => {
    const records = byDate.get(date)!;
    const selected = records.filter(record => selection.includes(record.id)).length;
    return <DayHeading date={date} shown={records.length} total={totalByDate?.get(date) ?? records.length}
      checked={selected === records.length} partial={selected > 0 && selected < records.length}
      disabled={loading} selectionMode={selectionMode} expanded={expanded} contentId={contentId} onToggle={() => onToggleDate(date)} onChange={checked => selectRecords(records, checked)} />;
  };
  const marker = (record: RecordView) => <ListItemMarker variant="bar" tone={getKphLabelPresentation("condition", record.condition).tone} />;
  const selector = (record: RecordView, className: string) => <label className={className}><input type="checkbox" aria-label={`Chọn ${record.productName}`} checked={selection.includes(record.id)} disabled={loading} onChange={event => selectRecords([record], event.target.checked)} /></label>;
  const identifier = (record: RecordView) => record.sku || (record.barcode ? `UPC ${record.barcode}` : "Nhập tay");

  const widths = groupByDate
    ? selectionMode ? [8, 23, 12, 8, 18, 15, 12, 4] : [27, 13, 8, 19, 16, 13, 4]
    : selectionMode ? [8, 19, 12, 10, 7, 15, 12, 13, 4] : [25, 12, 10, 7, 16, 13, 13, 4];
  return <div className={loading ? "store-kph-list store-kph-list-loading" : "store-kph-list"} aria-hidden={loading || undefined}>{desktop ? <div className="store-kph-table-wrap"><table className="store-kph-table"><colgroup>{widths.map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup><thead><tr>
    {selectionMode ? <th><label className="store-kph-table-selector"><input type="checkbox" aria-label="Chọn tất cả" checked={visible.length > 0 && visible.every(record => selection.includes(record.id))} onChange={event => selectRecords(visible, event.target.checked)} /></label></th> : null}
    <th>Hàng hóa</th><th>SKU / UPC</th>{!groupByDate ? <th>Ngày phát hiện</th> : null}<th>SL</th><th>Tình trạng</th><th>Xử lý</th><th>Trạng thái</th><th><span className="sr-only">Mở chi tiết</span></th>
  </tr></thead>{groups.map(group => {
    const expanded = !groupByDate || !collapsedDates.includes(group.date);
    const contentId = `${listId}-${group.records[0]!.id}`;
    return <Fragment key={group.records[0]!.id}>
      {groupByDate ? <tbody className="store-kph-day-header"><tr><th colSpan={widths.length} scope="rowgroup">{heading(group.date, contentId, expanded)}</th></tr></tbody> : null}
      <tbody id={contentId} hidden={!expanded}>{expanded ? group.records.map(record => <tr key={record.id} data-record-id={record.id} className="store-kph-record-row" onClick={loading ? undefined : event => {
        if (event.target instanceof Element && !event.target.closest("button, input, label, [data-selection-cell]")) {
          event.currentTarget.querySelector<HTMLButtonElement>(".store-kph-row-open")?.focus({ preventScroll: true });
          setActive(record);
        }
      }}>
        {selectionMode ? <td className="store-kph-leading-cell" data-selection-cell>{marker(record)}{selector(record, "store-kph-table-selector")}</td> : null}
        <td className={selectionMode ? undefined : "store-kph-leading-cell"}>{!selectionMode ? marker(record) : null}<button className="store-kph-row-open" aria-label={`Mở phiếu ${record.productName}`} disabled={loading} onClick={() => setActive(record)}><span>{record.productName}</span></button></td>
        <td>{identifier(record)}</td>{!groupByDate ? <td className="store-kph-record-date">{record.detectedDate}</td> : null}<td className="store-kph-quantity">{record.quantity}</td>
        <td><KphListLabel kind="condition" value={record.condition} /></td><td><KphListLabel kind="resolution" value={record.resolution} /></td><td><KphListLabel kind="approval" value={approvalLabels[record.approvalStatus]} className={`chip-${record.approvalStatus === "APPROVED" ? "safe" : record.approvalStatus === "PENDING" ? "warning" : "neutral"}${record.approvalStatus !== "PENDING" ? " is-final" : ""}`} /></td>
        <td className="store-kph-chevron-cell"><img className="store-kph-row-chevron" src={figmaAsset("main-2", "imgFeatherChevronRight")} alt="" /></td>
      </tr>) : null}</tbody>
    </Fragment>;
  })}</table></div> : <div className="store-tickets" data-grouped={groupByDate}>{groups.map(group => {
    const expanded = !groupByDate || !collapsedDates.includes(group.date);
    const contentId = `${listId}-${group.records[0]!.id}`;
    return <section className="store-kph-day" key={group.records[0]!.id} aria-label={groupByDate ? `Ngày phát hiện ${group.date}` : undefined}>
    {groupByDate ? heading(group.date, contentId, expanded) : null}<div className="store-kph-day-items" id={contentId} hidden={!expanded}>{expanded ? group.records.map(record => <div key={record.id} className="store-ticket" data-record-id={record.id}>
      {marker(record)}{selectionMode ? selector(record, "store-ticket-selector") : null}
      <div className={`store-ticket-body${screenLayout ? " store-ticket-screen" : ""}`}><button className="store-ticket-open" aria-label={`Mở phiếu ${record.productName}`} aria-describedby={screenLayout ? `${listId}-${record.id}-quantity ${listId}-${record.id}-facts ${listId}-${record.id}-approval` : undefined} disabled={loading} onClick={() => setActive(record)}>
        <strong title={record.productName}><span>{record.productName}</span></strong>
        {screenLayout ? <span className="store-ticket-trailing"><span className="store-ticket-meta" id={`${listId}-${record.id}-quantity`}><span className="sr-only">Số lượng: </span>{record.quantity}</span><img className="store-ticket-chevron" src={figmaAsset("main-2", "imgFeatherChevronRight")} alt="" /></span> : <>
          <KphTicketMeta record={record} identifier={identifier(record)} groupByDate={groupByDate} />
          <img className="store-ticket-chevron" src={figmaAsset("main-2", "imgFeatherChevronRight")} alt="" />
        </>}
      </button>{screenLayout ? <div className="store-ticket-foot">
        <span className="store-ticket-identity" id={`${listId}-${record.id}-facts`}><span className="store-ticket-sku"><span className="sr-only">Mã hàng: </span>{identifier(record)}</span>{!groupByDate ? <span className="store-ticket-date"><CalendarDays size={13} aria-hidden="true" /><span className="sr-only">Ngày phát hiện: </span>{record.detectedDate}</span> : null}</span>
        <KphTagStrip record={record} screenLayout />
        <KphListLabel id={`${listId}-${record.id}-approval`} kind="approval" value={approvalLabels[record.approvalStatus]} className={`store-ticket-approval${record.approvalStatus !== "PENDING" ? " is-icon-only" : ""}`} />
      </div> : <KphTagStrip record={record} screenLayout={false} />}</div>
    </div>) : null}</div>
  </section>;
  })}</div>}</div>;
}
