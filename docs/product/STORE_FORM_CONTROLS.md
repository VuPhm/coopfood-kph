# Store PWA — các cụm điều khiển tham khảo

**FORM01 revision4 — candidate24/10:** hệ token nút bao gồm primary xanh,
secondary/ghost/danger, selected/disabled/focus và native command. Vật liệu mép
khối trượt/sidebar/menu dùng token layer riêng, không đổi geometry/navigation.
[Giá trị và binding theo vai trò](STORE_APP_SURFACE_STYLE.md#token-nút-và-mép-chrome--form01-revision-4).

Candidate RPT01 revision 14, ngày 18/10/2026. Dùng thật trong báo cáo trước khi
đề xuất nhân rộng. Đây là component local Store PWA; chưa phải primitive Admin
hoặc thay đổi toàn hệ thống. Giữ workflow/authorization ở feature/backend.

## Co.op Fresh Soft — FORM01, 24/10/2026

Owner yêu cầu làm mềm các form hiện tại. Tên ngắn **Co.op Fresh Soft** dùng chung
mã `coop-fresh-soft-v1`, [recipe form](STORE_APP_SURFACE_STYLE.md#6-recipe-form--form01-candidate-24102026).
Revision 2: input/date/select/textarea có fill nhẹ + radius 16, mép nghỉ 6%
theo item Home; focus/error/selection rõ và có label/nội dung nhận diện;
nhóm trắng/viền nhẹ, footer và chọn có độ nổi thấp. CSS local được import bởi
StoreAppFrame/StoreLogin, portal scope theo Store Fresh đang mở.

Revision 3 thêm recipe nút phụ/choice/group/popup; mép nghỉ nhẹ, selected/focus
giữ rõ. [Triết lý theo vai trò](STORE_APP_SURFACE_STYLE.md).

Giữ API của các control bên dưới, label/value, required/readonly/disabled/error,
calendar/Other/photo recovery và keyboard. Không đổi packages/ui hoặc Admin.
Số lượng thêm placeholder “Nhập số lượng” khi trống, chỉ ở Store Fresh.
Readonly và lỗi vẫn là thuộc tính thật; không dùng màu thay semantics. Hero
search giữ recipe riêng, canvas trắng. [Kết quả và giới hạn](../delivery/form01-fresh-soft/technical.md).

## Các nguồn dùng được

| Cụm | Source | Consumer đang dùng |
| --- | --- | --- |
| Tìm kiếm có xóa | [StoreSearchField](../../apps/store-pwa/src/store-search-field.tsx) | Composer báo cáo, chọn mẫu và tìm lịch sử. |
| Nhóm hàng thiết lập | [StoreSettingsGroup/Row](../../apps/store-pwa/src/store-settings-group.tsx) | Kỳ báo cáo và phạm vi DATE. |
| Hộp chọn có xác nhận | [StoreChoiceSheet](../../apps/store-pwa/src/store-choice-sheet.tsx) | Đổi mẫu qua [adapter](../../apps/store-pwa/src/store-report-template-picker.tsx). |
| Hình thức/portal | [CSS](../../apps/store-pwa/src/store-form-controls.css) | Cả ba cụm. |
| Thao tác chính | [StoreActionDock](../../apps/store-pwa/src/store-action-dock.tsx) | Lưu mẫu/tạo báo cáo; component đã có từ r8. |

Không thêm dependency, không sao chép focus trap hoặc persistence vào control.
Modal/focus restoration/scroll lock dùng StoreSheet/Radix có sẵn; radio native.
`packages/ui`, root lockfile và các trang đã accepted chưa đổi trong r14.

## 1. Tìm kiếm

```tsx
<StoreSearchField
  label="Tìm báo cáo"
  placeholder="Tên báo cáo, kỳ"
  value={query}
  onValueChange={next => { setQuery(next); setPage(1); }}
  clearLabel="Xóa tìm kiếm lịch sử"
/>
```

Props bắt buộc: value/onValueChange/label/placeholder. Tùy chọn inputRef/title/
clearLabel/className. label là accessible name, không dùng placeholder thay
label. Input 48 px, nút xóa 44 px, text tối thiểu 16 px. Tên lớp slot input
bảo vệ padding icon/nút xóa khi đặt trong consumer có CSS input chung.

Control không tự lọc dữ liệu hoặc reset selection; caller quyết định query
ảnh hưởng danh sách thế nào. Xóa trả focus về input và không submit form.
Escape được truyền cho page/dialog, không dùng để âm thầm đổi dữ liệu. Có
inputMode/enterKeyHint cho bàn phím tìm kiếm; không autofocus lúc mount.

## 2. Thiết lập dạng hàng

```tsx
<StoreSettingsGroup label="Thiết lập báo cáo" columns={2}>
  <StoreSettingsRow
    label="Kỳ báo cáo"
    value={periodText}
    icon={<CalendarDays size={20} aria-hidden="true" />}
    ariaLabel="Chọn kỳ báo cáo"
    onClick={openPeriod}
  />
  <StoreSettingsRow
    label="Phạm vi"
    value={scopeText}
    valueId="report-filter-summary"
    badge={activeFilterCount}
    ariaLabel="Lọc danh mục báo cáo"
    onClick={openFilter}
  />
</StoreSettingsGroup>
```

Group có label/children, columns=1 mặc định; columns=2 chỉ chia cột ở desktop,
mobile giữ hàng dọc. Row có label/value/onClick, tùy chọn icon/ariaLabel/valueId/
badge. valueId do caller giữ duy nhất trên trang, cũng dùng aria-describedby.
Row luôn là button type=button; không đặt input/button tương tác khác vào
value. Nhãn 12 px, giá trị 14 px, hàng ít nhất 68 px; giá trị dài xuống dòng.
Badge chỉ bổ sung số điều kiện, summary vẫn phải nói rõ điều kiện đang dùng.

Không nhúng ngày hoặc rule DATE vào component. Feature mở modal/điều hướng và
quyết định commit; ví dụ kỳ không đồng nghĩa HSD và không suy snapshot quá khứ.

## 3. Hộp chọn có xác nhận

```tsx
<StoreChoiceSheet
  open={pickerOpen}
  onOpenChange={setPickerOpen}
  value={selectedId}
  options={items.map(item => ({
    value: item.id,
    label: item.name,
    description: item.summary,
  }))}
  onApply={setSelectedId}
  title="Chọn mẫu báo cáo"
  description="Chọn rồi áp dụng; đóng để giữ phần đang làm."
  searchLabel="Tìm mẫu báo cáo"
  searchPlaceholder="Tìm theo tên mẫu"
  applyLabel="Dùng mẫu"
  itemLabel="mẫu"
  emptyLabel="Không tìm thấy mẫu phù hợp."
/>
```

`StoreChoiceOption` chỉ có value/label/description?; ID là chuỗi opaque, duy nhất trong options. Control
không biết report recipe, store scope, authorization hoặc cách lưu dữ liệu.
Caller nhận ID sau Apply rồi ánh xạ về nghiệp vụ. Mẫu báo cáo dùng adapter để
đổi filter/selected IDs mà giữ kỳ; không đưa quy tắc đó vào control chung.

| Thao tác | Kết quả |
| --- | --- |
| Mở | Bắt đầu từ value đã commit; query trống; focus ở vùng tìm nhưng không mở bàn phím. |
| Chọn radio/di chuyển bằng phím | Chỉ cập nhật pending nội bộ. |
| Tìm kiếm | Lọc label; hiện số kết quả và empty state. |
| Xóa tìm | Trả focus về input, giữ pending. |
| Pending bị query che/không có kết quả | Apply bị vô hiệu hóa. |
| Pending trùng value đã commit | Apply bị vô hiệu hóa. |
| Hủy/Escape/đóng sheet | Hủy query và pending, không gọi onApply. |
| Apply | Gọi onApply với ID đang có trong kết quả rồi đóng. |

Search/count, danh sách và footer là ba hàng grid. Chỉ danh sách cuộn, header,
ô tìm và Hủy/Apply luôn trong khung nhìn. Nút footer được tăng chiều cao
khi nhãn xuống dòng/chữ lớn, không khóa height làm cắt chữ. Focus vào radio cuối chỉ cuộn list,
không đẩy header/footer ra ngoài. Khi list đổi kích thước, ResizeObserver/RAF chỉ giữ hàng đang focus trong
vùng cuộn (hàng quá cao thì giữ radio); không setState hoặc đo mỗi touchmove.
Observer/RAF được dọn khi đóng. Radio dùng tên nhóm useId riêng cho từng
instance; focus ring ở cả hàng, không thêm vòng viền đôi quanh input.

Đã kiểm 63 lựa chọn, tên dài, 150% chữ, viewport 620 px cao và 320 px rộng.
Chưa cam kết danh sách remote/hàng nghìn lựa chọn; khi có nhu cầu thực mới
thiết kế phân trang/virtualization và contract tương ứng.

## Token và cách đặt trong portal

Các control trong page nhận role `--store-*` từ StoreApp. StoreChoiceSheet tự
mang `.store-control-surface` với cùng Fresh roles để portal body không phụ
thuộc lớp feature như `store-date-sheet`. Nền trắng/canvas, action #00724e,
ink #20344a, muted #596b7d, control border #718578, focus #20344a.
Đây là ánh xạ palette đã dùng, không tạo theme/token family mới.

Không sửa CSS nội bộ bằng selector con của feature. Dùng className cho lề/
chiều rộng bên ngoài; nếu cần hành vi mới, bổ sung API có consumer và test.
Giữ responsive bằng CSS/native scroll, không đo layout mỗi pointer move.

## Gate trước khi tham khảo sang feature khác

- Props có nhãn và state owner rõ; Cancel/Apply không làm mất draft ngoài ý định.
- Kiểm keyboard/Escape/focus return, search clear và submit của form cha.
- Kiểm 390×844, 1440×1024 và 320 px; chữ 150%, sheet thấp và list dài.
- Contrast text >=4,5:1, input/focus >=3:1, touch target >=44 px.
- Không đổi rule nghiệp vụ/quyền/selection khi thay trình bày. Các trang đã
  accepted cần scope và nghiệm thu riêng trước khi rollout.

[Test contract](../../apps/store-pwa/src/store-choice-sheet.test.tsx),
[gate browser](../../e2e/scripts/check-report-header.cjs),
[bàn giao RPT01](../delivery/rpt01-report-design/handoff.md).
