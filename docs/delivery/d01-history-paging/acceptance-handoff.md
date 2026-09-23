# D01 — nghiệm thu phân trang lịch sử, revision 2

Ngày: 24/09/2026. Bản tích hợp P04/P05 + D01 trên
`codex/d01-p04-integration`; application/browser candidate `7fc9b8d`.
Owner acceptance **pending**; xác nhận P04 trước đó không được tính là pass D01.

## Bản dùng thử

- URL: <http://127.0.0.1:4173>.
- CHT: `manager.e2e` / `manager-e2e-password`.
- Tài khoản, phiếu và ảnh đều tổng hợp local; backend thật 8080, PostgreSQL 17
  ở 55432. Chưa push/merge/deploy.
- Khởi động lại: `./e2e/scripts/start-online-acceptance.sh` với OrbStack hoạt động.
  Runtime có revision tại `/tmp/coopfood-kph-online-acceptance/revision`.
  Reset bằng stop script rồi start script cùng thư mục.

## Thử nhanh

1. Đăng nhập, chọn tab **TP Tươi sống**: 30 phiếu, trang 1 có 25, trang 2 có 5;
   ảnh hiển thị được, tổng vẫn 30 khi chuyển trang.
2. Sort **Số lượng tăng dần**, đi trang 1 → 2 → 1: thứ tự áp dụng trên toàn bộ
   tập dữ liệu, trở lại đúng các phiếu ở trang 1. Quay lại có thể dùng cache.
3. Chọn một phiếu hoặc chọn tất cả rồi sang trang khác: selection về 0. Trong
   lúc chờ trang mới, các dòng cũ đang giữ chỗ không được chọn/duyệt/xuất.
4. Đổi filter/ngày/tab/cửa hàng: trở về trang 1, không hiển thị dữ liệu sai store;
   count hai tab và tổng kết quả theo contract.
5. Thu hẹp màn hình như điện thoại: điều hướng/card vẫn đọc và thao tác được.
   Nút **Đổi mật khẩu** P05 vẫn hiện diện.

## Giới hạn

- Offset pagination; selection chỉ thuộc trang hiện tại. Không select-all xuyên
  trang, không đổi giới hạn export 500, không thêm migration/index.
- Text sort dùng nhãn tiếng Việt và PostgreSQL `vi-x-icu`; thứ tự chuỗi chứa số,
  case/dấu có thể khác Pilot `Intl.Collator` (numeric/base). Sort số lượng numeric.
- Chromium desktop/mobile không thay nghiệm thu thiết bị thật hoặc production load.
- Evidence và các sửa lỗi review: [technical evidence](technical-evidence-r2.md),
  [review](review-r2.md). Owner thử rồi xác nhận D01 pass hoặc nêu lỗi cụ thể.
