import { daysBetween, formatDisplayDate, parseDisplayDate } from "@coopfood-kph/kph-rules";
import { ArrowLeft, Box, Check, ChevronRight, PackagePlus, ScanBarcode } from "lucide-react";
import { useEffect, useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { BarcodeScannerDialog } from "../barcode-scanner-dialog";
import { CalendarInput } from "../calendar-input";
import {
  demoProducts, demoToday, inventoryQuantity, lotDate, lotLabel, receiveLot,
  type DemoLot, type DemoProduct, type DemoState,
} from "./client-store-demo-data";

type Step = 1 | 2 | 3 | 4;
type DateField = "nsx" | "hsd" | "receivedOn";
const steps = ["Quét mã", "Sản phẩm", "Lô hàng", "Kết quả"];
const statusNames = { SAFE: "An toàn", WARNING: "Cảnh báo", DANGER: "Đến ngày lùi", EXPIRED: "Hết hạn" };

export function ReceivingSurface({ state, setState, onHome }: {
  state: DemoState;
  setState: Dispatch<SetStateAction<DemoState>>;
  onHome: () => void;
}) {
  const [step, setStep] = useState<Step>(1);
  const [code, setCode] = useState("");
  const [product, setProduct] = useState<DemoProduct | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [nsx, setNsx] = useState("");
  const [hsd, setHsd] = useState("");
  const [receivedOn, setReceivedOn] = useState(() => formatDisplayDate(demoToday()));
  const [quantity, setQuantity] = useState("");
  const [lotCode, setLotCode] = useState("");
  const [savedLot, setSavedLot] = useState<DemoLot | null>(null);
  const [lookupError, setLookupError] = useState("");
  const [formError, setFormError] = useState("");
  const [dateErrors, setDateErrors] = useState<Partial<Record<DateField, string>>>({});
  const codeRef = useRef<HTMLInputElement>(null);
  const today = demoToday();
  useEffect(() => { window.scrollTo(0, 0); }, [step]);

  function lookup(value: string) {
    const normalized = value.trim();
    setCode(normalized);
    const found = demoProducts.find((item) => item.barcode === normalized || item.sku.toLowerCase() === normalized.toLowerCase());
    if (!found) {
      setLookupError(normalized ? "Không tìm thấy sản phẩm trong danh mục demo. Quét lại hoặc nhập mã khác." : "Nhập barcode hoặc SKU để tra sản phẩm.");
      setProduct(null);
      return;
    }
    setProduct(found);
    setLookupError("");
    setStep(2);
  }

  function submitLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    lookup(code);
  }

  function parseDateField(field: DateField, label: string, value: string, errors: Partial<Record<DateField, string>>) {
    try {
      return parseDisplayDate(value);
    } catch {
      errors[field] = `${label} phải theo dd/mm/yyyy và là ngày hợp lệ.`;
      return null;
    }
  }

  function submitLot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product) return;
    const errors: Partial<Record<DateField, string>> = {};
    const parsedNsx = parseDateField("nsx", "NSX", nsx, errors);
    const parsedHsd = parseDateField("hsd", "HSD", hsd, errors);
    const parsedReceivedOn = parseDateField("receivedOn", "Ngày nhập", receivedOn, errors);
    setDateErrors(errors);
    if (!parsedNsx || !parsedHsd || !parsedReceivedOn) {
      setFormError("Kiểm tra các ngày được đánh dấu bên dưới.");
      return;
    }
    try {
      const saved = receiveLot(state, {
        productId: product.id, nsx: parsedNsx, hsd: parsedHsd, receivedOn: parsedReceivedOn,
        quantity: Number(quantity), lotCode,
      }, today);
      setState(saved.state);
      setSavedLot(saved.lot);
      setFormError("");
      setStep(4);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể lưu lô hàng.");
    }
  }

  function nextProduct() {
    setStep(1); setCode(""); setProduct(null); setSavedLot(null); setLookupError(""); setFormError("");
    setDateErrors({}); setNsx(""); setHsd(""); setReceivedOn(formatDisplayDate(demoToday()));
    setQuantity(""); setLotCode("");
    requestAnimationFrame(() => codeRef.current?.focus());
  }

  function adjustQuantity(delta: number) {
    const current = Number(quantity);
    setQuantity(String(Math.max(1, (Number.isSafeInteger(current) ? current : 0) + delta)));
    setFormError("");
  }

  function clearDateError(field: DateField) {
    setDateErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  const savedDate = savedLot ? lotDate(savedLot, today) : null;
  const daysRemaining = savedLot ? Math.max(0, daysBetween(today, savedLot.hsd)) : 0;
  return <div className="cd-receive">
    <div className="cd-heading"><p>NHẬP KHO · DỮ LIỆU DEMO</p><h1>Nhập hàng</h1><span>Quét sản phẩm, ghi nhận lô và xem DATE trước khi tiếp tục.</span></div>
    <ol className="cd-receive-progress" aria-label="Tiến trình nhập hàng">
      {steps.map((label, index) => <li key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}
        aria-current={step === index + 1 ? "step" : undefined}><b>{step > index + 1 ? <Check size={15} aria-hidden="true" /> : index + 1}</b><span>{label}</span></li>)}
    </ol>

    {step === 1 && <section className="cd-panel cd-receive-panel" aria-labelledby="receive-scan-title">
      <div className="cd-receive-title"><span className="cd-receive-icon"><ScanBarcode size={24} aria-hidden="true" /></span><div><h2 id="receive-scan-title">Quét mã sản phẩm</h2><p>Dùng camera hoặc nhập barcode / SKU trên bao bì.</p></div></div>
      <button type="button" className="cd-scan" onClick={() => setScannerOpen(true)}><ScanBarcode size={26} aria-hidden="true" /> Quét barcode</button>
      <form onSubmit={submitLookup}>
        <label className="cd-field" htmlFor="receive-code">Barcode / SKU</label>
        <div className="cd-receive-code-row"><input id="receive-code" ref={codeRef} value={code} onChange={(event) => { setCode(event.target.value); setLookupError(""); }}
          autoCapitalize="characters" autoComplete="off" placeholder="Ví dụ 8938501434012 hoặc SP000123" />
          <button className="cd-primary" type="submit">Xem sản phẩm <ChevronRight size={18} aria-hidden="true" /></button></div>
      </form>
      {lookupError && <p className="cd-feedback" role="alert">{lookupError}</p>}
    </section>}

    {step === 2 && product && <section className="cd-panel cd-receive-panel" aria-labelledby="receive-product-title">
      <div className="cd-receive-title"><span className="cd-receive-icon"><Box size={24} aria-hidden="true" /></span><div><h2 id="receive-product-title">Thông tin sản phẩm</h2><p>Đối chiếu sản phẩm trước khi nhập lô.</p></div></div>
      <div className="cd-receive-product"><span className="cd-receive-product-visual"><Box size={42} aria-hidden="true" /></span><div><strong>{product.name}</strong><small>{product.sku}</small></div></div>
      <dl className="cd-receive-facts"><div><dt>Barcode / EAN-13</dt><dd>{product.barcode}</dd></div><div><dt>SKU / mã nội bộ</dt><dd>{product.sku}</dd></div>
        <div><dt>Nhà cung cấp</dt><dd>{product.supplier}</dd></div><div><dt>Nhóm hàng</dt><dd>{product.group}</dd></div>
        <div><dt>Đơn vị</dt><dd>{product.unit}</dd></div><div><dt>Tồn hiện tại</dt><dd>{inventoryQuantity(state, product.id)} {product.unit}</dd></div></dl>
      <div className="cd-receive-actions"><button type="button" className="cd-secondary" onClick={() => setStep(1)}><ArrowLeft size={18} aria-hidden="true" /> Đổi mã</button>
        <button type="button" className="cd-primary" onClick={() => setStep(3)}>Tiếp tục <ChevronRight size={18} aria-hidden="true" /></button></div>
    </section>}

    {step === 3 && product && <section className="cd-panel cd-receive-panel" aria-labelledby="receive-lot-title">
      <div className="cd-receive-title"><span className="cd-receive-icon"><PackagePlus size={24} aria-hidden="true" /></span><div><h2 id="receive-lot-title">Nhập thông tin lô hàng</h2><p>{product.name} · {product.unit}</p></div></div>
      <form onSubmit={submitLot} noValidate>
        {formError && <p className="cd-feedback" role="alert">{formError}</p>}
        <div className="cd-receive-fields">
          <div className="cd-receive-field"><label htmlFor="receive-nsx">Ngày sản xuất (NSX) *</label><CalendarInput id="receive-nsx" label="ngày sản xuất" initialMonth={today}
            value={nsx} onValueChange={(value) => { setNsx(value); clearDateError("nsx"); }} invalid={!!dateErrors.nsx}
            {...(dateErrors.nsx ? { ariaDescribedBy: "receive-nsx-error" } : {})} />
            {dateErrors.nsx && <small id="receive-nsx-error" role="alert">{dateErrors.nsx}</small>}</div>
          <div className="cd-receive-field"><label htmlFor="receive-hsd">Hạn sử dụng (HSD) *</label><CalendarInput id="receive-hsd" label="hạn sử dụng" initialMonth={today}
            value={hsd} onValueChange={(value) => { setHsd(value); clearDateError("hsd"); }} invalid={!!dateErrors.hsd}
            {...(dateErrors.hsd ? { ariaDescribedBy: "receive-hsd-error" } : {})} />
            {dateErrors.hsd && <small id="receive-hsd-error" role="alert">{dateErrors.hsd}</small>}</div>
          <div className="cd-receive-field"><label htmlFor="receive-date">Ngày nhập *</label><CalendarInput id="receive-date" label="ngày nhập" initialMonth={today}
            value={receivedOn} onValueChange={(value) => { setReceivedOn(value); clearDateError("receivedOn"); }} invalid={!!dateErrors.receivedOn}
            {...(dateErrors.receivedOn ? { ariaDescribedBy: "receive-date-error" } : {})} />
            {dateErrors.receivedOn && <small id="receive-date-error" role="alert">{dateErrors.receivedOn}</small>}</div>
          <div className="cd-receive-field"><label htmlFor="receive-quantity">Số lượng ({product.unit}) *</label>
            <div className="cd-receive-quantity"><button type="button" aria-label="Giảm số lượng" onClick={() => adjustQuantity(-1)}>−</button>
              <input id="receive-quantity" type="number" min="1" step="1" inputMode="numeric" value={quantity} onChange={(event) => { setQuantity(event.target.value); setFormError(""); }} placeholder="Nhập" />
              <button type="button" aria-label="Tăng số lượng" onClick={() => adjustQuantity(1)}>+</button></div></div>
          <div className="cd-receive-field cd-receive-lot"><label htmlFor="receive-lot-code">Số lô / LOT <span>(nếu có)</span></label>
            <input id="receive-lot-code" value={lotCode} maxLength={40} onChange={(event) => setLotCode(event.target.value)} placeholder="Ví dụ LOT123" /></div>
        </div>
        <div className="cd-receive-actions"><button type="button" className="cd-secondary" onClick={() => setStep(2)}><ArrowLeft size={18} aria-hidden="true" /> Sản phẩm</button>
          <button type="submit" className="cd-primary">Lưu lô hàng <ChevronRight size={18} aria-hidden="true" /></button></div>
      </form>
    </section>}

    {step === 4 && product && savedLot && savedDate && <section className="cd-panel cd-receive-panel" aria-labelledby="receive-result-title">
      <div className="cd-receive-success"><span><Check size={28} aria-hidden="true" /></span><div><h2 id="receive-result-title">Đã lưu lô hàng</h2><p>{product.name} · {lotLabel(savedLot)} · +{savedLot.quantity} {product.unit}</p></div></div>
      <dl className="cd-receive-facts cd-receive-result-facts"><div><dt>Ngày nhập</dt><dd>{formatDisplayDate(savedLot.receivedOn!)}</dd></div>
        <div><dt>Tổng vòng đời</dt><dd>{savedDate.shelfLifeDays} ngày</dd></div><div><dt>Số ngày còn lại</dt><dd>{daysRemaining} ngày</dd></div>
        <div><dt>DATE còn lại</dt><dd>{100 - savedDate.percent}%</dd></div><div><dt>DATE đã qua</dt><dd>{savedDate.percent}%</dd></div>
        <div><dt>Trạng thái</dt><dd><span className={`cd-status ${savedDate.status.toLowerCase()}`}>{statusNames[savedDate.status]}</span></dd></div>
        <div><dt>Ngày lùi hàng</dt><dd>{formatDisplayDate(savedDate.withdrawalDate)}</dd></div>
        <div><dt>Tồn mới</dt><dd>{inventoryQuantity(state, product.id)} {product.unit}</dd></div></dl>
      <div className="cd-receive-actions"><button type="button" className="cd-primary" onClick={nextProduct}>Nhập sản phẩm khác <ChevronRight size={18} aria-hidden="true" /></button>
        <button type="button" className="cd-secondary" onClick={onHome}>Về trang chủ</button></div>
    </section>}
    <BarcodeScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onScan={(scanned) => { setScannerOpen(false); lookup(scanned); }} />
  </div>;
}
