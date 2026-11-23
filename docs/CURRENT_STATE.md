# Trạng thái hiện tại

Ngày 22/11/2026, nhánh bàn giao backend là `store-app/ui09-restored-baseline`. Nhánh gom hai dòng công việc cùng xuất phát từ `main` local `2d1536f`.

| Nguồn | Phần giữ trên candidate |
| --- | --- |
| Fresh R5/R6 và desktop, qua `82191c2` | Danh sách compact KPH/DATE, thao tác tài khoản, form đăng nhập, token Admin và khung desktop chung. |
| KPHQA01 và DATEUI01, qua `92dba87` | Wordmark, phản hồi khi gửi lỗi, giữ khung khi xác minh quyền, tải thêm giữ chọn, chọn đủ ngày vượt một trang và workspace quản lý DATE. |
| CHAIN01 và STOREUI01, qua `8c3fae9` | Giám sát KPH bốn vai, điều hướng Store ổn định, thêm và xem lô DATE trong phiên của đúng tài khoản và cửa hàng. |

## KPH

Owner đã nghiệm thu KPHON03–04 và cho tiếp sau vòng UI local ngày 17/11. Ngày 21/11 owner đổi quyền duyệt và xác nhận lại ngày 22/11. Chỉ cửa hàng trưởng có membership active tại cửa hàng của phiếu được duyệt. Quản lý vùng/chuỗi theo dõi trong phạm vi và có quyền xuất độc lập. Backend kiểm quyền ở từng request. [Nghiệm thu KPHQA01](delivery/kphqa01-final-acceptance.md) · [Quyền CHAIN01](product/KPH_APPROVAL_SCOPE.md) · [Lịch sử và lựa chọn](product/HISTORY_PAGING_CONTRACT.md).

## DATE

Candidate DATEON03 trên `store-app/dateon03-partial-kph` lấy base DATEON02
`86c00f8`. Store đọc, tạo, sửa lô và gợi ý SKU/tên theo từng cửa hàng.
DATEON03 tạo một hoặc nhiều phiếu KPH từ lô, ghi lượng đã xử lý và giữ lại
lượng còn theo dõi. Lô xử lý hết rời danh sách đang mở. Phiếu mới ở Chờ duyệt.
Đã kiểm PostgreSQL từ V10 lên V11 và luồng Store trên hai kích thước.
[DATEON02](delivery/dateon02-durable-lots.md) ·
[DATEON03](delivery/dateon03-partial-kph.md) · [Contract DATE](product/DATE_DURABLE_CONTRACT.md).

DATEON04 còn lịch nhắc chung theo cửa hàng. Thông báo và báo cáo kỳ dùng dữ liệu
DATE thật ở các slice sau. Nghiệm thu owner trên candidate vẫn còn chờ.

[Xác minh UI09](delivery/ui09-restored-baseline.md) · [Bước kế tiếp](NEXT.md). Nghiệm thu thiết bị thật, camera/quyền hệ điều hành và rollout vẫn đang chờ. Nhánh Pages và tag bảo tồn theo [baseline](STORE_APP_BASELINE.md).
