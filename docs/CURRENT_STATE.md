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

Candidate DATEON02 trên `store-app/dateon02-durable-lots` lấy base UI09
`4d671a6`. Store online đọc, tạo và sửa lô qua PostgreSQL. Lô và gợi ý SKU/tên
hàng được phân theo cửa hàng. Nhân viên xem/tạo, quản lý trong phạm vi mới
được sửa. API kiểm phiên bản khi sửa và ghi audit. Đã kiểm từ V9 lên V10 và
chạy luồng qua Store ở hai kích thước. Nghiệm thu owner, xử lý từng phần
DATE → KPH, lịch nhắc chung và báo cáo kỳ còn chờ.
[Evidence DATEON02](delivery/dateon02-durable-lots.md) · [Contract DATE](product/DATE_DURABLE_CONTRACT.md).

[Xác minh UI09](delivery/ui09-restored-baseline.md) · [Bước kế tiếp](NEXT.md). Nghiệm thu thiết bị thật, camera/quyền hệ điều hành và rollout vẫn đang chờ. Nhánh Pages và tag bảo tồn theo [baseline](STORE_APP_BASELINE.md).
