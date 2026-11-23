# NOTIFON01 · Thông báo từ lô DATE thật

Base DATEON04 `8a97a1f`. [Thiết kế Thông báo](../product/STORE_NOTIFICATIONS_DESIGN.md)
và [hợp đồng DATE](../product/DATE_DURABLE_CONTRACT.md) quyết định hành vi.

Store Thông báo lấy danh sách DATE hiện tại trong cửa hàng đã chọn. Dùng
`GET /api/v1/stores/{storeId}/date-lots?attentionOnly=true&sort=notification&page=1&pageSize=25`.
Backend dùng điều kiện attention đã có. Sắp theo nhóm Hết HSD, Đến hạn lùi,
Cảnh báo, Cần kiểm tra ngày, Đến lịch báo lại trước khi phân trang. Lô DUE
chỉ vào nhóm lịch báo lại dù phase còn có cảnh báo. Thứ tự trong nhóm theo
HSD hoặc ngày hẹn tăng dần, rồi ID. Trả `businessDate` ISO LocalDate trên
`DateLotPage` để UI dùng đúng ngày khi tính phase/% cùng bộ rule DATE.
Frontend dùng `DateLot.reminderState` cho SCHEDULED/DUE. Mỗi trang tối đa 25
dòng. Dùng tổng từ API cho module DATE, hiển thị số dòng đã tải khi còn
trang kế và cho tải thêm. Ghép theo ID, số lượng nhóm tính trên các dòng đã tải.

Danh sách cửa hàng theo DATE VIEW và backend kiểm lại từng request. Đổi tài
khoản hoặc cửa hàng xóa target và danh sách cũ. Nhấn thông báo mở ngay detail
đúng ID trong DATE bằng endpoint detail, kể cả khi lô ở ngoài trang đầu. Target
dùng một lần khi điều hướng từ Thông báo. Ẩn dữ liệu trong lúc tái xác minh
quyền. Khi quay lại Thông báo hoặc đổi ngày HCM/resume, tải lại để nhận due,
lịch tương lai và lô mới xử lý hết. Loading, lỗi và rỗng phân biệt rõ.

Sol sở hữu contract, integration và review. Luna API thêm sort và businessDate,
giữ API DATE hiện có. Luna Store nối màn Thông báo, lấy lại view/group prototype,
giữ scope và xử lý mở detail theo target. Gate một lượt PostgreSQL thật với hai
cửa hàng, lịch nhắc trước/sau đến hạn, click mở đúng lô và lô ngoài scope.
Push, unread, event history và báo cáo kỳ thuộc các slice sau.

## Kiểm trên candidate ngày 23/11/2026

- Contract có 43 tài nguyên manifest và 35 fixture API. Generated client
  sinh lại khớp. PostgreSQL 17 kiểm `DateLotHttpIntegrationTest` đạt 6 ca,
  gồm toàn bộ thứ tự nhóm qua các trang, DUE ưu tiên và quyền khác cửa hàng.
- TypeScript Store đạt cùng 20 test có mục tiêu cho nhóm, hiển thị và
  mở ID ngoài trang đầu. Mock và Store online dùng chung view và rule nhóm.
- Playwright 390×844 và 1440×1024 trên PostgreSQL fixture V12. Báo Hết HSD,
  Cảnh báo và lịch đến hạn xếp đúng nhóm. Nhấn mở đúng ID và mã lô. Hẹn lô hết
  HSD ẩn thông báo, lô SAFE đến lịch xuất hiện một lần sau focus. Chuyển
  từ cửa hàng A sang B hiển thị lô B và gỡ lô A. Kiểm màu tab đang chọn trên
  mobile giữ tương phản khi hover.
- [Store online](http://127.0.0.1:4786/) dùng backend phiên thật và dữ liệu
  tổng hợp. [Tài khoản mẫu](admin03-store-membership/handoff.md).
  Nghiệm thu owner và thiết bị thật còn chờ.

## Tiến độ và khoảng cách tới target

DATE online lõi đã đạt kỹ thuật 3/3 mốc. Thông báo đạt mốc đầu trong hai mốc
nối tiếp sau phần lõi. Còn báo cáo snapshot kỳ trên dữ liệu DATE thật.
Các gate nghiệm thu và rollout theo NEXT.
