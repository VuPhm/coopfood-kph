import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Input } from "@coopfood-kph/ui";
import { formatDisplayDate, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import type { DateApi, DateLot } from "./date-api";
import type { StoreSessionGateway } from "./store-session-api";
import { OnlineApiError } from "./online-kph";
import { StoreSheet } from "./store-sheet";
import { CalendarInput } from "./calendar-input";
import { formatBusinessDate } from "./business-date";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";

type Props = { api: DateApi; csrf: string; storeId: string; userId: string; suspended: boolean;
  lookupBarcode: StoreSessionGateway["lookupBarcode"]; onSessionExpired: () => void;
  original: DateLot | null; onSaved: (duplicate: boolean) => void; onClose: () => void;
  onReload: () => Promise<boolean> };

export function DateEditor({ api, csrf, storeId, userId, suspended, lookupBarcode, onSessionExpired, original, onSaved, onClose, onReload }: Props) {
  const [barcode, setBarcode] = useState(original?.barcode ?? "");
  const [sku, setSku] = useState(original?.skuCode ?? "");
  const [name, setName] = useState(original?.productName ?? "");
  const [lotCode, setLotCode] = useState(original?.lotCode ?? "");
  const [quantity, setQuantity] = useState(original?.trackedQuantity ?? "");
  const [unit, setUnit] = useState<"" | "EA" | "kg">(original?.unit ?? "");
  const [manufactured, setManufactured] = useState(original?.manufacturedOn ? formatDisplayDate(original.manufacturedOn as LocalDate) : "");
  const [expires, setExpires] = useState(original ? formatDisplayDate(original.expiresOn as LocalDate) : "");
  const [reason, setReason] = useState("");
  const [query, setQuery] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"MANUAL" | "FOUND" | "NOT_FOUND">(original?.lookupStatus ?? "MANUAL");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const key = useRef<{ payload: string; value: string }>({ payload: "", value: "" });
  const lookupToken = useRef(0);
  const suggestions = useQuery({ queryKey: ["date-suggestions", userId, storeId, query], queryFn: ({ signal }) => api.suggest(storeId, query, signal), enabled: !original && query.trim().length >= 2 && !suspended, retry: false, gcTime: 0 });
  const unauthorized = suggestions.error instanceof OnlineApiError && (suggestions.error.status === 401 || suggestions.error.status === 403);
  useEffect(() => { if (unauthorized) onSessionExpired(); }, [unauthorized, onSessionExpired]);
  useEffect(() => { if (!suspended) return; }, [suspended]);
  async function findBarcode() {
    const value = barcode.trim(); if (!value || busy) return;
    const token = ++lookupToken.current; setBusy(true); setMessage("");
    try {
      const result = await lookupBarcode(storeId, value, new AbortController().signal);
      if (token !== lookupToken.current) return;
      if (result.status === "FOUND") { setLookupStatus("FOUND"); setBarcode(result.barcode); setSku(result.product.skuCode); setName(result.product.name); setMessage("Đã tìm thấy sản phẩm trong danh mục."); }
      else { setLookupStatus("NOT_FOUND"); setBarcode(result.barcode); setMessage("Không tìm thấy barcode. Có thể nhập SKU và tên hàng thủ công."); }
    } catch (error) {
      if (token !== lookupToken.current) return;
      const status = error instanceof OnlineApiError ? error.status : undefined;
      if (status === 401 || status === 403) onSessionExpired();
      setMessage("Chưa tra được barcode. Kiểm tra kết nối hoặc tiếp tục nhập tay.");
    } finally { if (token === lookupToken.current) setBusy(false); }
  }
  function useSuggestion(item: { skuCode: string; productName: string }) {
    setSku(item.skuCode); setName(item.productName); setBarcode(""); setLookupStatus("MANUAL"); setSuggestion("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setMessage("");
    try {
      const skuValue = sku.trim(), nameValue = name.trim(), amount = quantity.trim();
      if (!skuValue || !nameValue) throw new Error("Nhập SKU và tên hàng.");
      if (!unit) throw new Error("Chọn đơn vị theo dõi.");
      if (!/^\d+(?:\.\d+)?$/.test(amount) || Number(amount) <= 0 || (unit === "EA" && !/^\d+$/.test(amount))) throw new Error(unit === "EA" ? "Số lượng EA phải là số nguyên dương." : "Số lượng kg phải lớn hơn 0.");
      const expiresOn = parseDisplayDate(expires);
      const manufacturedOn = manufactured ? parseDisplayDate(manufactured) : null;
      if (manufacturedOn && expiresOn <= manufacturedOn) throw new Error("HSD phải sau NSX.");
      if (original && !reason.trim()) throw new Error("Nhập lý do sửa lô.");
      setBusy(true);
      const body = { lookupStatus, barcode: lookupStatus === "MANUAL" ? null : barcode.trim() || null, skuCode: skuValue, productName: nameValue, lotCode: lotCode.trim() || null,
        manufacturedOn, expiresOn, trackedQuantity: amount, unit };
      if (original) {
        const result = await api.update(storeId, original.id, { ...body, expectedVersion: original.version, reason: reason.trim() }, csrf);
        onSaved(result.duplicateWarning);
      } else {
        const payload = JSON.stringify(body);
        if (key.current.payload !== payload) key.current = { payload, value: crypto.randomUUID() };
        const result = await api.create(storeId, body, key.current.value, csrf);
        onSaved(result.duplicateWarning);
      }
    } catch (error) {
      if (error instanceof OnlineApiError) {
        if (error.status === 401 || error.status === 403) { onSessionExpired(); setMessage("Phiên hoặc quyền cửa hàng đã thay đổi."); }
        else if (error.status === 409 && original) { setMessage("Lô đã được cập nhật nơi khác. Đã tải phiên bản mới; kiểm tra thay đổi rồi lưu lại với lý do."); await onReload(); }
        else setMessage(error.status === 409 ? "Yêu cầu tạo đang được xác nhận. Thử lưu lại để gửi lại cùng mã yêu cầu." : error.message);
      } else setMessage(error instanceof Error ? error.message : "Không thể lưu lô DATE.");
    } finally { setBusy(false); }
  }
  if (suspended) return null;
  const duplicate = suggestions.data ?? [];
  return <><StoreSheet className="store-date-sheet" open onOpenChange={open => { if (!open) onClose(); }} title={original ? "Sửa lô DATE" : "Thêm theo dõi DATE"} description={original ? "Cập nhật thông tin có kiểm soát phiên bản." : "Tạo lô theo dõi trong cửa hàng đang chọn."}>
    <form className="store-date-intake" onSubmit={submit}>
      <Field label="Barcode (nếu có)" htmlFor="date-online-barcode"><Input id="date-online-barcode" value={barcode} onChange={event => { lookupToken.current++; setBarcode(event.target.value); setLookupStatus("MANUAL"); }} /><Button type="button" variant="secondary" onClick={() => setScanner(true)}>Quét barcode</Button><Button type="button" variant="secondary" disabled={busy || !barcode.trim()} onClick={() => void findBarcode()}>Tra barcode</Button></Field>
      <Field label="SKU" htmlFor="date-online-sku" required><Input id="date-online-sku" value={sku} onChange={event => { setSku(event.target.value); if (lookupStatus === "FOUND") { setLookupStatus("MANUAL"); setBarcode(""); } setQuery(event.target.value.trim()); }} /></Field>
      {!original && duplicate.length > 0 ? <div role="listbox" aria-label="Gợi ý SKU và tên hàng">{duplicate.map(item => <button key={`${item.skuCode}:${item.productName}`} type="button" role="option" aria-selected={suggestion === item.skuCode} onClick={() => useSuggestion(item)}>{item.skuCode} · {item.productName}</button>)}</div> : null}
      <Field label="Tên hàng" htmlFor="date-online-name" required><Input id="date-online-name" value={name} onChange={event => { setName(event.target.value); if (lookupStatus === "FOUND") { setLookupStatus("MANUAL"); setBarcode(""); } setQuery(event.target.value.trim()); }} /></Field>
      <Field label="Số lô (nếu có)" htmlFor="date-online-lot"><Input id="date-online-lot" value={lotCode} onChange={event => setLotCode(event.target.value)} /></Field>
      <Field label="Số lượng đang theo dõi" htmlFor="date-online-quantity" required><Input id="date-online-quantity" inputMode="decimal" value={quantity} onChange={event => setQuantity(event.target.value)} /></Field>
      <Field label="Đơn vị" htmlFor="date-online-unit"><select id="date-online-unit" value={unit} onChange={event => setUnit(event.target.value as "" | "EA" | "kg")}><option value="">Chọn đơn vị</option><option value="EA">EA</option><option value="kg">kg</option></select></Field>
      <Field label="NSX (nếu có)" htmlFor="date-online-nsx"><CalendarInput id="date-online-nsx" label="NSX" initialMonth={formatBusinessDate(new Date()).iso} value={manufactured} onValueChange={setManufactured} /></Field>
      <Field label="HSD" htmlFor="date-online-hsd" required><CalendarInput id="date-online-hsd" label="HSD" initialMonth={formatBusinessDate(new Date()).iso} value={expires} onValueChange={setExpires} /></Field>
      {original ? <Field label="Lý do sửa" htmlFor="date-online-reason" required><Input id="date-online-reason" value={reason} onChange={event => setReason(event.target.value)} /></Field> : null}
      {suggestions.isError && !unauthorized ? <p role="status">Chưa tải được gợi ý đã lưu. Bạn vẫn có thể nhập SKU và tên hàng.</p> : null}
      {message ? <p role="alert">{message}</p> : null}
      <div className="store-sheet-actions"><Button type="button" variant="ghost" disabled={busy} onClick={onClose}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : original ? "Lưu thay đổi" : "Lưu lô"}</Button></div>
    </form>
  </StoreSheet><BarcodeScannerDialog appearance="store" open={scanner && !suspended} onOpenChange={setScanner} onScan={value => { setScanner(false); setBarcode(value); setLookupStatus("MANUAL"); void lookupBarcode(storeId, value, new AbortController().signal).then(result => {
    if (result.status === "FOUND") { setLookupStatus("FOUND"); setBarcode(result.barcode); setSku(result.product.skuCode); setName(result.product.name); setMessage("Đã tìm thấy sản phẩm trong danh mục."); }
    else { setLookupStatus("NOT_FOUND"); setBarcode(result.barcode); setMessage("Không tìm thấy barcode. Có thể nhập SKU và tên hàng thủ công."); }
  }).catch(() => setMessage("Chưa tra được barcode. Kiểm tra kết nối hoặc tiếp tục nhập tay.")); }} /></>;
}
