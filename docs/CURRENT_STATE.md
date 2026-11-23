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

Candidate DATEON04 trên `store-app/dateon04-shared-reminders` lấy base DATEON03
`148a498`. Ba mốc DATE online lõi đã đạt kiểm kỹ thuật. DATEON02 lưu, đọc, sửa
lô và gợi ý SKU/tên hàng theo từng cửa hàng. DATEON03 xử lý từng phần qua KPH,
giữ lượng và lịch sử. DATEON04 lưu lịch nhắc 1/7 ngày dùng chung cửa hàng,
hiển thị lại trong Cần chú ý từ ngày hẹn theo giờ Việt Nam. Store local dùng
backend thật với fixture nâng từ V11 lên V12.
[DATEON02](delivery/dateon02-durable-lots.md) · [DATEON03](delivery/dateon03-partial-kph.md) ·
[DATEON04](delivery/dateon04-shared-reminders.md) · [Contract DATE](product/DATE_DURABLE_CONTRACT.md).

Nghiệm thu owner trên candidate còn chờ.

## Thông báo

Candidate NOTIFON01 trên `store-app/notifon01-date-notices` lấy base DATEON04
`8a97a1f`. Thông báo đọc lô DATE theo cửa hàng, nhóm theo HSD và lịch đã hẹn,
mở đúng chi tiết lô theo ID. Thứ tự nhóm được áp dụng trước phân trang.
Đã kiểm mobile và desktop với backend V12 thật. Báo cáo kỳ dùng dữ liệu DATE
là mốc tiếp theo. [Evidence NOTIFON01](delivery/notifon01-date-notices.md).

[Xác minh UI09](delivery/ui09-restored-baseline.md) · [Bước kế tiếp](NEXT.md). Nghiệm thu thiết bị thật, camera/quyền hệ điều hành và rollout vẫn đang chờ. Nhánh Pages và tag bảo tồn theo [baseline](STORE_APP_BASELINE.md).

## Báo cáo kỳ

Trên nhánh REPORTON01, Store đọc lô DATE thật và lưu bản chốt tuần/tháng vào PostgreSQL V13. Lịch sử theo cửa hàng, lưu số lượng chính xác đến từng đơn vị và ngày chốt theo giờ Việt Nam. DATE lõi đạt 3/3 mốc kỹ thuật, Thông báo và Báo cáo đạt 2/2 mốc tiếp theo. Nghiệm thu chung Alpha/Delta/Beta và thiết bị thật còn chờ. [Bàn giao REPORTON01](delivery/reporton01-date-snapshots.md).
