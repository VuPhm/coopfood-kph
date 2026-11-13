import { useRef, useState } from "react";
import { Button, Field, Input } from "@coopfood-kph/ui";
import { parseDisplayDate } from "@coopfood-kph/kph-rules";
import { DateGroupChoice, type DateGroup } from "./store-date-groups";
import { mockBarcodeLookup, mockCatalogProducts, type MockDateLot } from "./store-app-mock";
import { StoreSheet } from "./store-sheet";
import "./store-date-intake.css";

/** Session-only DATE intake; catalog lookup never assigns a DATE group. */
export function DateIntake({ groups, existingLots, onSave, onCancel }: { groups: readonly DateGroup[]; existingLots: readonly MockDateLot[]; onSave: (lot: MockDateLot) => void; onCancel: () => void }) {
  const [code,setCode] = useState(""), [sku,setSku] = useState(""), [name,setName] = useState(""), [batch,setBatch] = useState("");
  const [manufactured,setManufactured] = useState(""), [expiry,setExpiry] = useState(""), [groupId,setGroupId] = useState("");
  const request = useRef(0);
  const [message,setMessage] = useState(""), [busy,setBusy] = useState(false);
  async function lookup() {
    if (!code.trim() || busy) return; setBusy(true); setMessage(""); const token = ++request.current;
    try { const exact = mockCatalogProducts.find(p => p.skuCode === code.trim()); const result = await mockBarcodeLookup(exact?.barcode ?? code.trim());
      if (token !== request.current) return;
      if (result.status === "FOUND") { setSku(result.product.skuCode); setName(result.product.name); setMessage("Đã tìm thấy mã hàng."); }
      else { setSku(""); setName(""); setMessage("Không tìm thấy mã hàng. Quét lại hoặc nhập tay."); }
    } catch { if (token === request.current) setMessage("Chưa tra được mã. Có thể nhập tay."); } finally { if (token === request.current) setBusy(false); }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const date = parseDisplayDate(expiry); const nsx = manufactured ? parseDisplayDate(manufactured) : null;
      if (!sku.trim() || !name.trim() || !batch.trim()) throw new Error("Nhập SKU, tên hàng và số lô.");
      if (existingLots.some(lot => lot.id.toLocaleLowerCase("vi") === batch.trim().toLocaleLowerCase("vi"))) throw new Error("Số lô đã có trong danh sách.");
      if (nsx && date <= nsx) throw new Error("HSD phải sau NSX.");
      onSave({ id: batch.trim(), sku: sku.trim(), name: name.trim(), date, ...(manufactured ? { manufactured } : {}), status: "open", group: groups.find(g => g.id === groupId) ?? null });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kiểm tra ngày dd/mm/yyyy."); }
  }
  return <StoreSheet open onOpenChange={open => { if (!open) onCancel(); }} title="Thêm theo dõi DATE" description="Thông tin theo dõi trong phiên mẫu">
    <form className="store-date-intake" onSubmit={submit}>
      <Field label="Mã hàng" htmlFor="date-intake-code"><Input id="date-intake-code" value={code} onChange={e => { request.current++; setBusy(false); setCode(e.target.value); }} /></Field><Button type="button" disabled={busy} onClick={() => void lookup()}>Tìm mã hàng</Button>
      <Field label="SKU" htmlFor="date-intake-sku" required><Input id="date-intake-sku" value={sku} onChange={e => setSku(e.target.value)} /></Field>
      <Field label="Tên hàng" htmlFor="date-intake-name" required><Input id="date-intake-name" value={name} onChange={e => setName(e.target.value)} /></Field>
      <DateGroupChoice groups={groups} value={groupId} onChange={setGroupId} />
      <Field label="Số lô" htmlFor="date-intake-batch" required><Input id="date-intake-batch" value={batch} onChange={e => setBatch(e.target.value)} /></Field>
      <Field label="NSX" htmlFor="date-intake-nsx"><Input id="date-intake-nsx" placeholder="dd/mm/yyyy" value={manufactured} onChange={e => setManufactured(e.target.value)} /></Field>
      <Field label="HSD" htmlFor="date-intake-hsd" required><Input id="date-intake-hsd" placeholder="dd/mm/yyyy" value={expiry} onChange={e => setExpiry(e.target.value)} /></Field>
      {message ? <p role="status">{message}</p> : null}<div className="store-sheet-actions"><Button type="button" variant="ghost" onClick={onCancel}>Hủy</Button><Button type="submit">Thêm theo dõi</Button></div>
    </form>
  </StoreSheet>;
}
