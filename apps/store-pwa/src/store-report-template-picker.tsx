import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StoreChoiceSheet } from "./store-choice-sheet";
import { filterLabel } from "./store-date-report-model";
import type { ReportTemplate } from "./store-report-library";

/** Domain adapter: the reusable sheet knows IDs and labels, not report recipes. */
export function ReportTemplatePicker({ current, templates, onApply }: {
  current: ReportTemplate; templates: ReportTemplate[]; onApply: (template: ReportTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  const choices = templates.some(item => item.id === current.id) ? templates : [current, ...templates];
  return <>
    <button type="button" className="report-change-template" aria-label="Đổi mẫu báo cáo" title="Đổi mẫu báo cáo" onClick={() => setOpen(true)}><span>Đổi mẫu</span><ChevronDown size={16} aria-hidden="true" /></button>
    <StoreChoiceSheet open={open} onOpenChange={setOpen} value={current.id} options={choices.map(item => ({ value: item.id, label: item.title, description: item.selectedIds ? `${item.selectedIds.length} lô chỉ định` : filterLabel(item.filter) }))} onApply={value => { const next = choices.find(item => item.id === value); if (next) onApply(next); }} title="Chọn mẫu báo cáo" description="Chọn mẫu rồi áp dụng. Đóng hộp chọn để giữ nguyên báo cáo đang làm." searchLabel="Tìm mẫu báo cáo" searchPlaceholder="Tìm theo tên mẫu" applyLabel="Dùng mẫu" itemLabel="mẫu" emptyLabel="Không tìm thấy mẫu phù hợp." className="report-template-picker" />
  </>;
}
