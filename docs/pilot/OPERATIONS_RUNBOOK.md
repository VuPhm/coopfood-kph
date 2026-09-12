# Runbook vận hành Pilot Store PWA

Pilot là ứng dụng local-only. IndexedDB của từng browser profile là nguồn dữ
liệu duy nhất; không có đồng bộ, central backup hoặc merge giữa thiết bị.

## Điều kiện trước khi sử dụng

1. Dùng thiết bị và browser profile được cửa hàng chỉ định; không dùng cửa sổ
   riêng tư/incognito.
2. Mở app một lần khi có mạng, chờ thông báo sẵn sàng ngoại tuyến.
3. Thiết lập tên cửa hàng và mã cửa hàng bốn chữ số trước khi tạo phiếu.
4. Cho phép persistent storage khi browser hỗ trợ và kiểm tra cảnh báo dung lượng.
5. Tạo một phiếu tổng hợp thử, reload app và xuất thử workbook trước ngày vận hành.

Không xóa site data, cache/storage của origin hoặc browser profile đang dùng.
Việc gỡ app, reset browser hay mất thiết bị có thể làm mất toàn bộ dữ liệu chưa
được kết sổ Excel.

## Kết sổ Excel

1. Chọn đúng loại phiếu `TPCN` hoặc `TPTS` và các dòng cần bàn giao.
2. Kiểm tra store code/name, số dòng, số ảnh và thứ tự ảnh trong màn hình xác nhận.
3. Tạo file Excel. Thông báo “đã tạo file” không có nghĩa file đã được gửi hoặc
   người nhận đã nhận.
4. Mở file bằng công cụ mục tiêu, kiểm tra hàng 7–8, cột ảnh O:Q, người duyệt R,
   footer và toàn bộ ảnh trước khi gửi cho CHT.
5. Gửi file qua kênh vận hành đã được cửa hàng phê duyệt và xác nhận phía nhận.
6. Giữ file theo policy của cửa hàng; không commit workbook vào repository.

Nếu nhiều thiết bị cùng dùng Pilot, mỗi thiết bị xuất workbook riêng. CHT chịu
trách nhiệm gom file; không ghép dữ liệu bằng cách sửa IndexedDB hoặc source code.

## Quota thấp hoặc lưu trữ không bền

- Dừng chụp thêm ảnh khi app cảnh báo quota thấp.
- Kết sổ ngay các phiếu hiện có và xác minh workbook mở được.
- Đóng tab/app khác cùng origin, giải phóng dung lượng thiết bị ngoài dữ liệu app,
  rồi mở lại và kiểm tra.
- Không dùng chức năng “clear site data” để giải phóng dung lượng.
- Nếu lỗi tiếp diễn, chuyển sang thiết bị khác cho phiếu mới; không tuyên bố dữ
  liệu cũ đã được chuyển.

## Mất thiết bị hoặc site data bị xóa

- Ngừng sử dụng account/browser profile liên quan nếu thiết bị bị mất.
- Báo CHT và ghi nhận khoảng thời gian dữ liệu có thể bị mất.
- Khôi phục nghiệp vụ từ các workbook đã kết sổ; Pilot không có cơ chế phục hồi
  IndexedDB trung tâm.
- Không nhập workbook ngược vào Pilot hoặc hệ thống online nếu chưa có quy trình
  nghiệp vụ được phê duyệt.

## Cập nhật ứng dụng

- Hoàn tất hoặc hủy phiếu đang nhập trước khi bấm “Cập nhật”.
- Sau reload, kiểm tra store profile, lịch sử phiếu và tạo/export một phiếu tổng
  hợp smoke test.
- Nếu phiên bản mới lỗi, dừng nhập mới và báo release owner; không xóa site data.

## Deploy và rollback Pilot

1. Xác nhận mọi P0 trong `ACCEPTANCE_LEDGER.md` đã `PASS` trên Git SHA phát hành.
2. Build artefact từ clean checkout bằng runtime đã ghi trong release manifest.
3. Ghi checksum bundle/artefact, tạo annotated tag và deploy đúng tagged SHA lên
   GitHub Pages.
4. Smoke test online load, offline reopen, IndexedDB history, ảnh và Excel bằng dữ
   liệu tổng hợp.
5. Rollback bằng cách redeploy immutable artefact/tag trước. Không clear IndexedDB
   và không down-migrate browser database. Nếu schema không backward-compatible,
   dừng rollout và ưu tiên forward-fix.

## Cutover sang online

- Kết sổ mọi thiết bị bằng Excel và xác nhận người nhận.
- Pilot chuyển maintenance-only; chỉ nhận security/critical fix.
- Không migrate hoặc tự động upload IndexedDB Pilot vào hệ thống online.
- Hệ thống online bắt đầu với authority mới từ backend và store membership thật.
