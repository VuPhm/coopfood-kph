# Store Fresh — một mật độ màn hình

FRESH01 candidate26/10/2026 thay thế cơ chế hai chế độ theo yêu cầu owner.
Store Fresh chỉ có giao diện gọn; Tài khoản không còn công tắc Giao diện.
Không còn preference/provider/document flag hoặc đọc/ghi key mật độ. Giá trị
browser cũ không ảnh hưởng UI và không cần migration/key thay thế.

## Cấu trúc

- Một CTA hàng gọn cho mỗi loại KPH, chung giữa loading/live, có icon/chevron.
- Một hàng thiết lập báo cáo, period/filter có accessible context riêng.
- Sort DATE/KPH trong filter, không còn shortcut và card comfortable trùng.
- List screen giữ approval KPH cạnh định danh, hai tag tình trạng/Biện pháp;
  DATE giữ phase/processing/%HSD/ngày/lịch nhắc và bao tag thứ hai.
- Filter/detail/form dùng section và khoảng cách thay card lồng. Loading cùng
  footprint, giữ neutral labels trước khi feature tải xong.

## Kích thước và khoảng hở

Token tại store-size-tokens.css. Phần chính44px; nút phụ độc lập36px với khoảng
cách12px ở toolbar; icon face32–36px; tag chỉ đọc20px với chữ12/16. Input16/24,
auto-height theo chữ lớn. Khoảng giữa nhóm16–24px, không thu mọi padding/gap
xuống cùng một cỡ. Cả hàng list vẫn bấm được, checkbox và keyboard còn rõ.
[Token/khuôn/màu](STORE_APP_SOLID_COMPACT.md) và
[quy tắc size](STORE_APP_SIZE_TOKENS.md) ghi giới hạn theo vai trò.

## Output và ranh giới

Print là đầu ra riêng: KPH đủ3labels, report giữ document/table/Excel/PDF.
Hook useStorePrint chỉ theo media print, không phải một preference màn hình.
Screen rules ở Store Fresh/login và portal của chúng, không áp online/Pilot/
Admin. Flow, data state, API, date rules và authorization không thay đổi.

Owner chưa nghiệm thu candidate FRESH01; technical/readiness được ghi tại
[hồ sơ](../delivery/fresh01-solid-compact/technical.md). Hồ sơ COMPACT01/02/03
là provenance trước tái dựng, không phải chỉ dẫn bật/tắt còn hiệu lực.
