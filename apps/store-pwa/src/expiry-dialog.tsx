import { calculateShelfLife, formatDisplayDate, parseDisplayDate, type ShelfLifeResult } from "@coopfood-kph/kph-rules";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Field, Input } from "@coopfood-kph/ui";
import { Calculator, CalendarDays } from "lucide-react";
import { useState, type FormEvent } from "react";

const statusLabels = {
  SAFE: "Còn an toàn",
  WARNING: "Cần theo dõi",
  DANGER: "Đến hạn lùi",
  EXPIRED: "Đã hết HSD",
} as const;

export function ExpiryDialog() {
  const [result, setResult] = useState<ShelfLifeResult | null>(null);
  const [error, setError] = useState("");

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      setResult(calculateShelfLife(
        parseDisplayDate(String(data.get("nsx"))),
        parseDisplayDate(String(data.get("hsd"))),
        "2026-08-15",
      ));
      setError("");
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Không thể tính hạn");
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="expiry-fab shadow-lg" size="large" aria-label="Tra hạn sử dụng">
          <Calculator aria-hidden="true" size={20} />
          <span>Tra hạn sử dụng</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tra hạn sử dụng</DialogTitle>
          <DialogDescription>Ngày nghiệp vụ theo Asia/Ho_Chi_Minh; nhập theo dd/mm/yyyy.</DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={calculate}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngày sản xuất (NSX)" htmlFor="nsx" required>
              <div className="relative"><Input id="nsx" name="nsx" defaultValue="01/08/2026" inputMode="numeric" className="pr-10" /><CalendarDays className="pointer-events-none absolute right-3 top-3 text-ink-muted" size={18} /></div>
            </Field>
            <Field label="Hạn sử dụng (HSD)" htmlFor="hsd" required>
              <div className="relative"><Input id="hsd" name="hsd" defaultValue="30/08/2026" inputMode="numeric" className="pr-10" /><CalendarDays className="pointer-events-none absolute right-3 top-3 text-ink-muted" size={18} /></div>
            </Field>
          </div>
          <Button type="submit">Tính hạn lùi</Button>
        </form>
        {error ? <p className="rounded-xl bg-danger-soft p-3 text-sm font-bold text-danger" role="alert">{error}</p> : null}
        {result ? (
          <section className="rounded-2xl border border-brand/15 bg-brand-soft p-4" aria-live="polite">
            <p className="text-sm text-ink-muted">Kết quả theo ngày 15/08/2026</p>
            <p className="mt-1 text-xl font-black text-brand">{statusLabels[result.status]}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-ink-muted">Vòng đời</dt><dd className="font-bold">{result.shelfLifeDays} ngày</dd></div>
              <div><dt className="text-ink-muted">Cảnh báo</dt><dd className="font-bold">{result.warningDate ? formatDisplayDate(result.warningDate) : "Không có"}</dd></div>
              <div><dt className="text-ink-muted">Hạn lùi</dt><dd className="font-black text-danger">{formatDisplayDate(result.withdrawalDate)}</dd></div>
              <div><dt className="text-ink-muted">Sau HSD</dt><dd className="font-bold">Đã hết hạn</dd></div>
            </dl>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
