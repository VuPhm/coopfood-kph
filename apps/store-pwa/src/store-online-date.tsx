import { formatDisplayDate, parseDisplayDate, type LocalDate } from "@coopfood-kph/kph-rules";
import { Button, Field, Input } from "@coopfood-kph/ui";
import { ScanBarcode } from "lucide-react";
import { useId, useState, type FormEvent, type ComponentProps } from "react";

import { StoreBarcodeLookup } from "./store-barcode-lookup";
import { StorePageHero, StorePageLayout, StorePageSurface } from "./store-page-hero";

type LookupProps = ComponentProps<typeof StoreBarcodeLookup>;
type DateLot = { id: string; sku: string; name: string; manufactured: LocalDate; expiry: LocalDate };

export function StoreOnlineDate({ active, ...lookup }: LookupProps & { active: boolean }) {
  const [lots, setLots] = useState<DateLot[]>([]);
  return active ? <DateList lookup={lookup} lots={lots} onAdd={lot => setLots(current => [lot, ...current])} /> : null;
}

function DateList({ lookup, lots, onAdd }: { lookup: LookupProps; lots: DateLot[]; onAdd(lot: DateLot): void }) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lookup.suspended) return;
    const data = new FormData(event.currentTarget);
    const value = (key: string) => String(data.get(key) ?? "").trim();
    try {
      const sku = value("sku"), name = value("name");
      if (!sku || !name) throw new Error("Nhập SKU và tên hàng.");
      const manufactured = parseDisplayDate(value("manufactured"));
      const expiry = parseDisplayDate(value("expiry"));
      if (expiry <= manufactured) throw new Error("HSD phải sau NSX.");
      onAdd({ id: crypto.randomUUID(), sku, name, manufactured, expiry });
      setAdding(false);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Kiểm tra ngày dd/mm/yyyy.");
    }
  }
  const [lookupOpen, setLookupOpen] = useState(false);
  const lookupId = useId();

  return <StorePageLayout className="store-date">
    <StorePageHero />
    <StorePageSurface className="store-online-content store-date-workspace">
      <section className="store-date-browser" aria-label="Danh sách lô DATE">
        <div className="store-list-heading"><h2>Danh sách lô DATE</h2></div>
        <p className="store-muted">Lô nhập tại đây chỉ giữ trong phiên của cửa hàng. Tải lại trang sẽ xóa danh sách này.</p>
        <div className="store-online-actions">
          <Button type="button" aria-expanded={adding} onClick={() => { setAdding(value => !value); setError(""); }}>Thêm lô</Button>
          <Button type="button" variant="secondary" aria-expanded={lookupOpen} aria-controls={lookupId}
            onClick={() => setLookupOpen(open => !open)}>
            <ScanBarcode size={18} aria-hidden="true" /> Quét / tra mã hàng
          </Button>
        </div>
      </section>
      {adding && <form className="store-date-intake" onSubmit={save}>
        <Field label="SKU" htmlFor="lot-sku"><Input id="lot-sku" name="sku" required /></Field>
        <Field label="Tên hàng" htmlFor="lot-name"><Input id="lot-name" name="name" required /></Field>
        <Field label="NSX" htmlFor="lot-manufactured"><Input id="lot-manufactured" name="manufactured" placeholder="dd/mm/yyyy" required /></Field>
        <Field label="HSD" htmlFor="lot-expiry"><Input id="lot-expiry" name="expiry" placeholder="dd/mm/yyyy" required /></Field>
        {error && <p role="alert">{error}</p>}
        <Button type="submit">Lưu lô trong phiên</Button>
      </form>}
      {lots.length ? <ul className="online-date-lots" aria-label="Các lô trong phiên">{lots.map(lot =>
        <li key={lot.id}><strong>{lot.name}</strong><span>SKU {lot.sku}</span>
          <span>NSX {formatDisplayDate(lot.manufactured)} · HSD {formatDisplayDate(lot.expiry)}</span></li>
      )}</ul> : <p>Chưa có lô trong phiên này.</p>}
      <div id={lookupId} hidden={!lookupOpen}>{lookupOpen && <StoreBarcodeLookup {...lookup} />}</div>
    </StorePageSurface>
  </StorePageLayout>;
}
