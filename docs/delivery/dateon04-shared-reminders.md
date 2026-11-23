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
