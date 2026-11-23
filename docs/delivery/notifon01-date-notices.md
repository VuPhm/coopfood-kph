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
