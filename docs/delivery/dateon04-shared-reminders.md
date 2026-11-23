# DATEON04 · Lịch nhắc chung của cửa hàng

Base DATEON03 `148a498`. [Quyết định nghiệp vụ](../product/DATE_DURABLE_CONTRACT.md).

Cửa hàng trưởng, Admin vùng trong vùng được giao và Admin chuỗi có quyền
REMIND trên lô đang mở trong scope. Chọn 1 hoặc 7 ngày rồi xác nhận. Hủy chỉ
đóng tùy chọn. Nhân viên cùng cửa hàng thấy ngày đã hẹn, vẫn có thể xử lý qua
KPH. Hẹn lại dùng cùng luồng. Backend quyết định ngày đích theo ngày nghiệp
vụ Việt Nam, kiểm version và ghi audit. Hết scope hoặc khác cửa hàng
không được ghi. Lô đã xử lý hết chỉ đọc.

`PUT /api/v1/stores/{storeId}/date-lots/{lotId}/reminder`,
operation `scheduleDateLotReminder`, JSON `DateLotReminderRequest`
`{expectedVersion, afterDays: 1 | 7}`. Session + CSRF, trả 200
`DateLotDetail` theo cùng schema đọc, với history hiện hành. 409 khi version
cũ hoặc đã hết lượng, 422 khi số ngày khác 1 hoặc 7. Discovery thêm `REMIND`
cho scope quản lý.

List và detail `DateLot` bổ sung `remindOn` (ISO date hoặc null) và
`reminderState` (`NONE`, `SCHEDULED`, `DUE`). SCHEDULED khi ngày hẹn ở tương
lai, DUE từ đúng ngày hẹn, NONE khi chưa hẹn hoặc lô resolved. Còn lượng sau
khi tạo KPH thì giữ lịch. Khi hết lượng, clear remindOn trong transaction.
List mặc định giữ lô đang mở. Bộ lọc/đếm Cần chú ý bỏ lô đang hẹn tương lai,
đưa lô đến lịch vào kể cả phase SAFE/BEFORE_NSX. Phase HSD vẫn độc lập.
Backend tính khi đọc, giữ đúng mốc HCM và đọc không sinh audit.
Store tải lại từ API khi resume và qua ranh giới ngày HCM lúc mở DATE.
Hiển thị **Báo lại dd/mm/yyyy** khi đang hẹn và **Đã đến lịch báo lại** khi
đến ngày. Lỗi hẹn cũ tải lại chi tiết và yêu cầu người dùng chọn lại.

Kiểm một lượt thật với hai phiên cùng store cho hẹn 1/7 ngày, reload, quyền
đọc và xác nhận hủy. Backend test với Clock ổn định cho đúng ngày hẹn, lô SAFE
vào Cần chú ý, khác store/cũ version và partial/final. Push, unread và báo
cáo kỳ thuộc slice sau.

## Kiểm trên candidate ngày 23/11/2026

- OpenAPI, 35 API fixtures và client sinh từ schema đạt. TypeScript Store
  đạt với UI package tại chính candidate. Các test API và workspace DATE đạt
  11 ca có mục tiêu.
- PostgreSQL 17 sạch áp dụng V1–V12. Bản sao V11 có bảy lô và bốn liên kết
  xử lý nâng cấp thành công. `DateLotHttpIntegrationTest` đạt 5 ca. Bao gồm
  quyền cửa hàng/vùng/chuỗi và sau thu hồi, hẹn 1/7 ngày, đúng nửa đêm HCM,
  lô SAFE vào Cần chú ý, đọc giữ audit, xử lý một phần giữ lịch và xử lý hết
  xóa lịch hiệu lực.
- Playwright trên 390×844 và 1440×1024 với hai phiên trong cùng cửa hàng.
  Hủy giữ nguyên phiên bản, hẹn 1 ngày và đổi sang 7 ngày được lưu. Lịch cũ
  trả 409 và form yêu cầu chọn lại. Nhân viên thấy ngày hẹn và gửi PUT bị 403.
  Đặt ngày hẹn trùng hôm nay trong fixture riêng để kiểm focus. Lô chuyển
  từ Đã ghi nhận sang Mở, xuất hiện trong Cần chú ý dù HSD còn xa.
- [Store online](http://127.0.0.1:4785/) dùng backend và fixture riêng.
  [Tài khoản mẫu](admin03-store-membership/handoff.md). Nghiệm thu owner
  và thiết bị thật còn chờ.

## Tiến độ và khoảng cách tới target

DATE online lõi đạt kỹ thuật 3/3 mốc. Lô bền vững và gợi ý SKU theo cửa hàng,
xử lý từng phần qua KPH, lịch nhắc chung đã có trên cùng candidate. Hạng mục
tiếp theo là Thông báo dùng DATE thật, sau đó báo cáo snapshot kỳ và gate rollout.
