import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@coopfood-kph/ui";
import { ScanLine } from "lucide-react";
import { formatDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { StoreSheet } from "./store-sheet";
import { StoreSearchField } from "./store-search-field";
import { CalendarInput } from "./calendar-input";
import { BarcodeScannerDialog } from "./barcode-scanner-dialog";
import { mockBarcodeLookup, mockCatalogProducts, mockProductMetadata, type MockDateLot } from "./store-app-mock";
import { assessDateLot } from "./store-date-assessment";
import { DateConditionLabel } from "./store-date-label";
import { dateLotBatchLabel } from "./store-date-lot";
import { dateIntakeSchema, DateLotDuplicateError, makeTrackedDateLot, type DateIntakeValues, type DateProductSnapshot } from "./store-date-intake-model";
import "./store-date-intake.css";

type Lookup = "idle" | "loading" | "FOUND" | "NOT_FOUND" | "CATALOG_UNAVAILABLE";
export function DateIntake({ today, onSave, onCancel, onOpenExisting }: {
  today: LocalDate; onSave: (lot: MockDateLot) => void | Promise<void>; onCancel: () => void; onOpenExisting: (lot: MockDateLot) => void;
}) {
  const prefix = useId(), intro = useRef<HTMLParagraphElement>(null), queryRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(""), [lookup, setLookup] = useState<Lookup>("idle"), [lookupError, setLookupError] = useState("");
  const [snapshot, setSnapshot] = useState<DateProductSnapshot | null>(null), [manual, setManual] = useState(false);
  const [scanner, setScanner] = useState(false), [discard, setDiscard] = useState(false), [duplicate, setDuplicate] = useState<MockDateLot | null>(null), [saveError, setSaveError] = useState("");
  const request = useRef(0), saving = useRef(false);
  const [draftId] = useState(() => crypto.randomUUID());
  const { register, watch, setValue, handleSubmit, formState: { errors, isDirty, isSubmitting } } = useForm<DateIntakeValues>({
    resolver: zodResolver(dateIntakeSchema), defaultValues: { sku: "", name: "", kind: "unclassified", batchCode: "", manufactured: "", expiry: "" },
  });
  const values = watch();
  const valid = dateIntakeSchema.safeParse(values);
  const preview = valid.success ? assessDateLot({ manufactured: valid.data.manufactured, date: makeTrackedDateLot(valid.data, snapshot ?? { lookupStatus: "NOT_FOUND", barcode: "", kind: null }, "preview").date }, today) : null;
  useEffect(() => () => { request.current++; }, []);
  function clearProduct(value: string) {
    request.current++; setQuery(value); setLookup("idle"); setLookupError(""); setSnapshot(null); setManual(false); setDuplicate(null); setSaveError("");
    for (const field of ["sku", "name", "batchCode", "manufactured", "expiry"] as const) setValue(field, "");
    setValue("kind", "unclassified");
  }
  async function lookupProduct(term = query) {
    const code = term.trim();
    if (!code) { setLookupError("Nhập SKU hoặc barcode cần tra."); queryRef.current?.focus(); return; }
    const current = ++request.current; setQuery(code); setLookup("loading"); setLookupError(""); setDuplicate(null); setManual(false); setSnapshot(null);
    try {
      const exactSku = mockCatalogProducts.find(p => p.skuCode === code);
      const result = await mockBarcodeLookup(exactSku?.barcode ?? code);
      if (request.current !== current) return;
      if (result.status !== "FOUND") { setLookup("NOT_FOUND"); return; }
      const product = result.product, meta = mockProductMetadata[product.id];
      setSnapshot({ lookupStatus: "FOUND", barcode: result.barcode, productId: product.id, kind: meta?.kphKind ?? null, supplier: product.primarySupplier.name, ...(meta?.unit ? { unit: meta.unit } : {}) });
      setValue("sku", product.skuCode); setValue("name", product.name); setValue("kind", meta?.kphKind ?? "unclassified"); setLookup("FOUND");
    } catch (error) { if (request.current === current) { setLookup("CATALOG_UNAVAILABLE"); setLookupError(error instanceof Error ? error.message : "Chưa thể tra danh mục. Thử lại hoặc nhập tay."); } }
  }
  function startManual() {
    clearProduct(""); setSnapshot({ lookupStatus: "MANUAL", barcode: "", kind: null }); setManual(true);
  }
  function enterManual() {
    if (lookup !== "NOT_FOUND" && lookup !== "CATALOG_UNAVAILABLE") return;
    setSnapshot({ lookupStatus: lookup, barcode: "", lookupInput: query.trim(), kind: null }); setManual(true);
  }
  function close() { if (saving.current) return; if (isDirty || query || snapshot) setDiscard(true); else onCancel(); }
  async function submit(value: DateIntakeValues) {
    if (!snapshot || saving.current) return;
    saving.current = true; setDuplicate(null); setSaveError("");
    try { await onSave(makeTrackedDateLot(value, snapshot, draftId)); }
    catch (error) { if (error instanceof DateLotDuplicateError) setDuplicate(error.lot); else setSaveError("Chưa thêm được lô. Thông tin đã nhập được giữ lại; hãy thử lại."); }
    finally { saving.current = false; }
  }
  const error = (field: keyof DateIntakeValues) => errors[field] ? <p className="date-intake-error" id={`${prefix}-${field}-error`} role="alert">{errors[field]?.message}</p> : null;
  return <>
    <StoreSheet open={!scanner && !discard} onOpenChange={open => { if (!open) close(); }} title="Thêm theo dõi DATE" description="Tra sản phẩm, nhập thông tin lô và thêm vào theo dõi DATE." className="store-date-intake-sheet" initialFocusRef={intro}>
      <form id={`${prefix}-form`} className="date-intake-form" noValidate onSubmit={handleSubmit(submit, fields => { const field = (["sku", "name", "manufactured", "expiry"] as const).find(key => fields[key]); if (field) document.getElementById(`${prefix}-${field}`)?.focus(); })}>
        <p ref={intro} tabIndex={-1} className="date-intake-intro">Thêm một lô vào theo dõi. Dữ liệu dùng thử được giữ trong phiên này.</p>
        <section className="date-intake-section" aria-labelledby={`${prefix}-product-title`}><h3 id={`${prefix}-product-title`}>Sản phẩm</h3>
          <div className="date-intake-method" role="group" aria-label="Cách nhập sản phẩm"><button type="button" aria-pressed={!manual} disabled={isSubmitting} onClick={() => { if (manual) clearProduct(query); }}>Tra mã hàng</button><button type="button" aria-pressed={manual} disabled={isSubmitting} onClick={() => { if (!manual) startManual(); }}>Tự nhập</button></div>
          {!snapshot ? <><div className="date-intake-lookup" onKeyDown={event => { if (event.key === "Enter" && event.target === queryRef.current) { event.preventDefault(); void lookupProduct(); } }}><StoreSearchField inputRef={queryRef} label="SKU hoặc barcode sản phẩm" placeholder="Nhập SKU hoặc barcode" value={query} disabled={isSubmitting} onValueChange={clearProduct} clearLabel="Xóa mã sản phẩm" />
            <Button type="button" className="store-button" onClick={() => void lookupProduct()} disabled={lookup === "loading" || isSubmitting}>{lookup === "loading" ? "Đang tra…" : "Tra mã"}</Button><button className="date-intake-scan" type="button" disabled={isSubmitting} aria-label="Quét mã sản phẩm để thêm theo dõi" onClick={() => setScanner(true)}><ScanLine size={20} aria-hidden="true" /></button></div>
            {lookup === "NOT_FOUND" || lookup === "CATALOG_UNAVAILABLE" ? <div className="date-intake-recovery" role="status"><p>{lookup === "NOT_FOUND" ? "Không tìm thấy sản phẩm. Quét lại, nhập mã khác hoặc nhập tay." : lookupError}</p><Button type="button" variant="secondary" className="store-button" onClick={enterManual}>Nhập tay thông tin sản phẩm</Button>{lookup === "CATALOG_UNAVAILABLE" ? <Button type="button" variant="ghost" className="store-button" onClick={() => void lookupProduct()}>Thử lại tra mã</Button> : null}</div> : lookupError ? <p className="date-intake-error" role="alert">{lookupError}</p> : null}</> : <>
            {!manual ? <div className="date-intake-product"><strong>{values.name}</strong><span>SKU {values.sku} · Barcode {snapshot.barcode}</span><small>{values.kind === "TPTS" ? "TP tươi sống" : values.kind === "TPCN" ? "TP khô & khác" : "Chưa phân loại"}</small></div> : <><p className="date-intake-helper">{snapshot.lookupStatus === "MANUAL" ? "Tự nhập thông tin sản phẩm." : <>Nhập tay · mã đã tra {snapshot.lookupInput}.</>} Thông tin này không tạo sản phẩm danh mục.</p>
              {snapshot.lookupStatus === "MANUAL" ? <div className="store-field"><label htmlFor={`${prefix}-barcode`}>Barcode <span className="date-intake-helper">(nếu có)</span></label><Input id={`${prefix}-barcode`} value={snapshot.barcode} disabled={isSubmitting} autoComplete="off" onChange={event => setSnapshot({ ...snapshot, barcode: event.target.value })} /></div> : <label className="date-intake-barcode-choice"><input type="checkbox" checked={!!snapshot.barcode} disabled={isSubmitting} onChange={event => setSnapshot({ ...snapshot, barcode: event.target.checked ? snapshot.lookupInput ?? "" : "" })} />Dùng mã vừa tra làm barcode</label>}
              <div className="store-field"><label htmlFor={`${prefix}-sku`}>SKU</label><Input id={`${prefix}-sku`} {...register("sku")} disabled={isSubmitting} aria-invalid={!!errors.sku} aria-describedby={errors.sku ? `${prefix}-sku-error` : undefined} autoComplete="off" />{error("sku")}</div>
              <div className="store-field"><label htmlFor={`${prefix}-name`}>Tên sản phẩm</label><Input id={`${prefix}-name`} {...register("name")} disabled={isSubmitting} aria-invalid={!!errors.name} aria-describedby={errors.name ? `${prefix}-name-error` : undefined} />{error("name")}</div>
              <div className="store-field"><label htmlFor={`${prefix}-kind`}>Loại hàng</label><select id={`${prefix}-kind`} {...register("kind")} disabled={isSubmitting}><option value="unclassified">Chưa phân loại</option><option value="TPCN">TP khô & khác</option><option value="TPTS">TP tươi sống</option></select></div></>}
            <Button type="button" variant="ghost" className="store-button" disabled={isSubmitting} onClick={() => { clearProduct(""); requestAnimationFrame(() => queryRef.current?.focus()); }}>Đổi sản phẩm</Button>
          </>}
        </section>
        {snapshot ? <><section className="date-intake-section" aria-labelledby={`${prefix}-lot-title`}><h3 id={`${prefix}-lot-title`}>Thông tin lô</h3>
          <div className="store-field"><label htmlFor={`${prefix}-batchCode`}>Mã lô <span className="date-intake-helper">(nếu có)</span></label><Input id={`${prefix}-batchCode`} {...register("batchCode")} disabled={isSubmitting} autoComplete="off" /></div>
          <div className="date-intake-dates">{(["manufactured", "expiry"] as const).map(field => <div className="store-field" key={field}><label htmlFor={`${prefix}-${field}`}>{field === "manufactured" ? "Ngày sản xuất (NSX)" : "Hạn sử dụng (HSD)"}</label><CalendarInput id={`${prefix}-${field}`} label={field === "manufactured" ? "Ngày sản xuất (NSX)" : "Hạn sử dụng (HSD)"} initialMonth={today} readOnly={isSubmitting} value={values[field]} onValueChange={value => setValue(field, value, { shouldDirty: true, shouldValidate: !!errors[field] })} invalid={!!errors[field]} {...(errors[field] ? { ariaDescribedBy: `${prefix}-${field}-error` } : {})} />{error(field)}</div>)}</div>
        </section>
        <section className="date-intake-section date-intake-preview" aria-labelledby={`${prefix}-preview-title`}><h3 id={`${prefix}-preview-title`}>Mốc DATE</h3>{preview?.result ? <><DateConditionLabel phase={preview.phase} /><dl><div><dt>Cảnh báo</dt><dd>{preview.result.warningDate ? formatDisplayDate(preview.result.warningDate) : "Không áp dụng"}</dd></div><div><dt>Hạn lùi</dt><dd>{formatDisplayDate(preview.result.withdrawalDate)}</dd></div></dl>{preview.phase === "EXPIRED" || preview.phase === "BEFORE_NSX" ? <p className="date-intake-helper">Kiểm tra lại ngày trên hàng trước khi thêm. Lô sẽ giữ đúng tình trạng này.</p> : null}</> : <p className="date-intake-helper">Nhập đủ NSX và HSD hợp lệ để xem mốc.</p>}</section></> : null}
        {duplicate ? <div className="date-intake-recovery" role="alert"><p>Lô {dateLotBatchLabel(duplicate)} của SKU {duplicate.sku} đã có. Kiểm tra lại mã lô và ngày; không thêm trùng.</p>{duplicate.status !== "resolved" ? <Button type="button" variant="secondary" className="store-button" onClick={() => onOpenExisting(duplicate)}>Xem lô đã có</Button> : <p>Lô này đã được xử lý qua KPH.</p>}</div> : null}
        {saveError ? <p className="date-intake-error" role="alert">{saveError}</p> : null}
      </form>
      <div className="date-intake-footer"><Button type="button" variant="secondary" className="store-button" disabled={isSubmitting} onClick={close}>Hủy</Button><Button form={`${prefix}-form`} type="submit" className="store-button" disabled={!snapshot || isSubmitting} aria-busy={isSubmitting}>{isSubmitting ? "Đang thêm…" : "Thêm vào theo dõi"}</Button></div>
    </StoreSheet>
    <StoreSheet open={discard} onOpenChange={setDiscard} title="Bỏ thông tin đang nhập?" description="Thông tin của lô này chưa được thêm vào theo dõi." className="store-date-intake-discard"><p>Thông tin lô chưa được lưu.</p><div className="store-sheet-actions"><Button className="store-button" variant="secondary" onClick={() => setDiscard(false)}>Tiếp tục nhập</Button><Button className="store-button" variant="danger" onClick={onCancel}>Bỏ thay đổi</Button></div></StoreSheet>
    <BarcodeScannerDialog open={scanner} onOpenChange={setScanner} onScan={code => { clearProduct(code); setScanner(false); void lookupProduct(code); }} />
  </>;
}
