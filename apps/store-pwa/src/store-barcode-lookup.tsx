import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@coopfood-kph/ui";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { OnlineApiError } from "./online-kph";
import type { StoreSessionGateway } from "./store-session-api";
import "./store-barcode-lookup.css";

export function StoreBarcodeLookup({ storeId, lookupBarcode, onSessionExpired }: {
  storeId: string;
  lookupBarcode: StoreSessionGateway["lookupBarcode"];
  onSessionExpired: () => void;
}) {
  const id = useId();
  const [barcode, setBarcode] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const lookup = useQuery({
    queryKey: ["store-barcode", storeId, submitted],
    queryFn: ({ signal }) => lookupBarcode(storeId, submitted!, signal),
    enabled: submitted !== null,
    retry: false,
    gcTime: 0,
    networkMode: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const expired = lookup.error instanceof OnlineApiError && lookup.error.status === 401;
  useEffect(() => { if (expired) onSessionExpired(); }, [expired, onSessionExpired]);
  function changeBarcode(value: string) {
    setBarcode(value); setSubmitted(null); setManual(false);
  }
  function search(value: string) {
    const normalized = value.trim();
    if (!normalized || normalized.length > 128) return;
    setBarcode(normalized); setManual(false);
    if (submitted === normalized) void lookup.refetch();
    else setSubmitted(normalized);
  }
  const busy = submitted !== null && (lookup.isPending || lookup.isFetching);
  const result = !busy && !lookup.isError ? lookup.data : undefined;
  const status = lookup.error instanceof OnlineApiError ? lookup.error.status : undefined;
  const errorMessage = status === 403 ? "Tài khoản không có quyền tra cứu tại cửa hàng này."
    : status === 503 ? "Danh mục sản phẩm chưa sẵn sàng. Vui lòng thử lại sau."
    : status === 401 ? "Phiên đăng nhập đã hết hạn."
    : "Không thể tra cứu lúc này. Kiểm tra kết nối rồi thử lại.";
  function keepFocusedControlVisible(target: EventTarget) {
    if (!(target instanceof HTMLElement) || !target.matches("input, button")) return;
    requestAnimationFrame(() => {
      if (!target.isConnected) return;
      const toolbar = document.querySelector(".store-mobile-toolbar")?.getBoundingClientRect();
      const control = target.getBoundingClientRect();
      if (toolbar?.height && control.bottom > toolbar.top - 12 && control.top < toolbar.bottom) {
        window.scrollBy({ top: control.bottom - toolbar.top + 16, behavior: "instant" });
      }
    });
  }
  return <section className="store-barcode-lookup" aria-labelledby={`${id}-title`} onFocusCapture={event => keepFocusedControlVisible(event.target)}>
    <h2 id={`${id}-title`}>Tra mã hàng</h2>
    <form onSubmit={event => { event.preventDefault(); search(barcode); }}>
      <label htmlFor={`${id}-barcode`}>Barcode</label>
      <input id={`${id}-barcode`} type="text" maxLength={128} autoComplete="off" spellCheck={false}
        value={barcode} onChange={event => changeBarcode(event.target.value)} />
      <div className="store-online-actions">
        <Button type="submit" disabled={!barcode.trim() || busy}>Tra cứu</Button>
        <Button type="button" variant="secondary" onClick={() => setScannerOpen(true)}>Quét barcode</Button>
      </div>
    </form>
    {busy ? <p role="status">Đang tra cứu barcode…</p> : null}
    {submitted !== null && lookup.isError ? <div role="alert"><p>{errorMessage}</p>
      {status !== 401 && status !== 403 ? <Button variant="secondary" onClick={() => { void lookup.refetch(); }}>Thử tra cứu lại</Button> : null}</div> : null}
    {result?.status === "FOUND" ? <div aria-label="Kết quả tra cứu"><p role="status">Đã tìm thấy sản phẩm.</p><dl>
      <dt>Barcode</dt><dd>{result.barcode}</dd><dt>Mã SKU</dt><dd>{result.product.skuCode}</dd>
      <dt>Tên sản phẩm</dt><dd>{result.product.name}</dd>
      <dt>Mã NCC chính</dt><dd>{result.product.primarySupplier.code}</dd>
      <dt>Nhà cung cấp chính</dt><dd>{result.product.primarySupplier.name}</dd>
    </dl></div> : null}
    {result?.status === "NOT_FOUND" ? <div><p role="status">Không tìm thấy barcode {result.barcode}.</p>
      <div className="store-online-actions"><Button variant="secondary" onClick={() => setScannerOpen(true)}>Quét lại</Button>
        <Button variant="secondary" onClick={() => setManual(true)}>Nhập tay</Button></div>
      {manual ? <fieldset className="store-barcode-manual" data-lookup-status="NOT_FOUND" data-barcode={result.barcode}><legend>Thông tin nhập tay</legend>
        <p>Chưa lưu</p>
        {[["sku", "Mã SKU"], ["name", "Tên sản phẩm"], ["supplier-code", "Mã NCC"], ["supplier-name", "Tên NCC"]].map(([key, label]) =>
          <label key={key} htmlFor={`${id}-${key}`}>{label}<input id={`${id}-${key}`} type="text" maxLength={200} autoComplete="off" /></label>)}
      </fieldset> : null}</div> : null}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={search} />
  </section>;
}
