import { useState } from "react";
import { Button, Field, Input, ListLabel, Select } from "@coopfood-kph/ui";
import { Check, Folder, Pencil, Plus, Settings2 } from "lucide-react";
import { StoreSheet } from "./store-sheet";
import "./store-date-groups.css";

export const DATE_GROUP_COLORS = ["amber", "blue", "green", "violet", "rose", "gray", "red", "orange", "yellow", "lime", "teal", "cyan", "indigo", "pink", "brown", "slate"] as const;
export type DateGroupColor = typeof DATE_GROUP_COLORS[number];
export type DateGroup = { id: string; name: string; color: DateGroupColor; withdrawalEnabled: boolean; version: number };
export type DateGroupDraft = Pick<DateGroup, "name" | "color" | "withdrawalEnabled">;
const colors: Record<DateGroupColor, string> = { amber: "Cam", blue: "Xanh dương", green: "Xanh lá", violet: "Tím", rose: "Hồng", gray: "Xám", red: "Đỏ", orange: "Cam đậm", yellow: "Vàng", lime: "Xanh chanh", teal: "Xanh ngọc", cyan: "Xanh cyan", indigo: "Chàm", pink: "Hồng sáng", brown: "Nâu", slate: "Xám xanh" };
export const DEFAULT_DATE_GROUPS: readonly DateGroup[] = [
  {id:"d7000000-0000-4000-8000-000000000001",name:"Lương thực",color:"amber",withdrawalEnabled:true,version:1},
  {id:"d7000000-0000-4000-8000-000000000002",name:"TP Đông lạnh",color:"blue",withdrawalEnabled:true,version:1},
  {id:"d7000000-0000-4000-8000-000000000003",name:"Hoá mỹ phẩm - Đồ gia dụng",color:"violet",withdrawalEnabled:true,version:1},
];
export function DateCreateButton(props: import("react").ComponentProps<typeof Button>) {
  return <Button {...props} className="store-date-create-cta" aria-label="Thêm theo dõi DATE"><Plus size={20} aria-hidden="true" />Thêm theo dõi</Button>;
}
export function DateGroupChip({ group }: { group?: DateGroup | null | undefined }) {
  return <ListLabel className="store-date-group-chip" data-group-color={group?.color ?? "gray"} category="Nhóm" title={group?.name ?? "Chưa phân loại"} icon={<Folder aria-hidden="true" />}>{group?.name ?? "Chưa phân loại"}</ListLabel>;
}
export function DateGroupFilter({ groups, value, onChange, onManage, disabled = false }: { groups: readonly DateGroup[]; value: string; onChange: (value: string) => void; onManage?: () => void; disabled?: boolean }) {
  return <div className="store-sticky-tabs store-date-group-filter">
    <Select aria-label="Nhóm DATE" value={value} onValueChange={onChange} disabled={disabled} options={[{value:"all",label:"Tất cả nhóm"},...groups.map(group=>({value:group.id,label:group.name})),{value:"unclassified",label:"Chưa phân loại"}]} contentClassName="store-date-group-menu" />
    {onManage ? <button type="button" className="store-filter" aria-label="Quản lý nhóm DATE" onClick={onManage}><Settings2 size={20} aria-hidden="true" /></button> : null}
  </div>;
}
export function DateGroupChoice({ groups, value, onChange, disabled = false }: { groups: readonly DateGroup[]; value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return <Field label="Nhóm hàng"><Select aria-label="Nhóm hàng" value={value} onValueChange={onChange} disabled={disabled} options={[{value:"",label:"Chưa phân loại"},...groups.map(group=>({value:group.id,label:group.name}))]} contentClassName="store-date-group-menu" /></Field>;
}
export function DateGroupManager({ groups, onClose, onSave }: { groups: readonly DateGroup[]; onClose: () => void; onSave: (draft: DateGroupDraft, existing?: DateGroup) => Promise<void> }) {
  const [editing,setEditing]=useState<DateGroup | "new" | null>(null), [name,setName]=useState(""),[color,setColor]=useState<DateGroupColor>("amber"),[withdrawalEnabled,setWithdrawal]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState("");
  function edit(group?: DateGroup) {setEditing(group ?? "new");setName(group?.name ?? "");setColor(group?.color ?? "amber");setWithdrawal(group?.withdrawalEnabled ?? true);setError("");}
  async function save() {
    if(busy) return;
    if(!name.trim()) {setError("Nhập tên nhóm.");return;}
    setBusy(true);setError("");
    try {await onSave({name:name.trim(),color,withdrawalEnabled}, editing && editing!=="new" ? editing : undefined);setEditing(null);}
    catch(error) {setError(error instanceof Error && "code" in error && error.code === "DATE_GROUP_CHANGED" ? "Nhóm đã được sửa. Mở lại nhóm để cập nhật." : error instanceof Error && "code" in error && error.code === "DATE_GROUP_NAME_EXISTS" ? "Tên nhóm đã có." : "Chưa lưu được nhóm. Kiểm tra và thử lại.");}
    finally {setBusy(false);}
  }
  return <StoreSheet open onOpenChange={open=>{if(!open && !busy) onClose();}} title="Nhóm DATE" description="Nhóm dùng chung toàn chuỗi." className="store-date-group-sheet">
    {editing ? <form className="store-date-group-editor" onSubmit={event=>{event.preventDefault();void save();}}>
      <Field label="Tên nhóm" htmlFor="date-group-name" required><Input id="date-group-name" value={name} maxLength={80} onChange={event=>setName(event.target.value)} disabled={busy} autoComplete="off" /></Field>
      <fieldset disabled={busy}><legend>Màu nhóm</legend><div className="store-date-group-colors">{DATE_GROUP_COLORS.map(option=><label key={option} data-group-color={option}><input type="radio" name="date-group-color" aria-label={colors[option]} checked={color===option} onChange={()=>setColor(option)} /><span aria-hidden="true" className="store-date-group-swatch"><Check size={16} /></span></label>)}</div></fieldset>
      <label className="store-date-group-toggle"><input type="checkbox" checked={withdrawalEnabled} onChange={event=>setWithdrawal(event.target.checked)} disabled={busy} /><span>Có lùi hàng</span></label>
      {error ? <p role="alert" className="store-error">{error}</p> : null}
      <div className="store-sheet-actions"><Button type="button" variant="ghost" disabled={busy} onClick={()=>setEditing(null)}>Hủy</Button><Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu nhóm"}</Button></div>
    </form> : <><div className="store-date-group-rows">{groups.map(group=><button key={group.id} type="button" onClick={()=>edit(group)} aria-label={`Sửa nhóm ${group.name}`}><DateGroupChip group={group} /><span>{group.withdrawalEnabled ? "Có lùi hàng" : "Không lùi hàng"}</span><Pencil size={18} aria-hidden="true" /></button>)}</div><Button type="button" onClick={()=>edit()}><Plus size={18} aria-hidden="true" />Thêm nhóm</Button></>}
  </StoreSheet>;
}
