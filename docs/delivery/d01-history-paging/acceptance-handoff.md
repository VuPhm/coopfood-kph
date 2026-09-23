# D01 — nghiệm thu phân trang lịch sử KPH online

Candidate: `9f099e134c0894707e3be302fd0df29f1123c040`, branch
`codex/d01-history-paging`, revision 1. Technical gate đã pass; owner gate vẫn
đang **pending** theo yêu cầu tạm chưa nghiệm thu.

## Mở bản chạy thử

- URL local: <http://127.0.0.1:4173>.
- Cửa hàng trưởng: `manager.e2e` / `manager-e2e-password`.
- Nhân viên: `employee.e2e` / `employee-e2e-password`.
- Backend 8080, PostgreSQL 17 ở 55432, chỉ bind loopback.
- Toàn bộ tài khoản, phiếu và ảnh là dữ liệu tổng hợp local; không dùng dữ liệu
  vận hành thật và đây không phải deployment.

Nếu preview chưa chạy, mở Docker/OrbStack rồi chạy từ repository root:

```sh
./e2e/scripts/start-online-acceptance.sh
```

Script không tự ghi đè runtime không khỏe hoặc giết process lạ đang chiếm port.
Muốn reset lại fixture tổng hợp, dừng rồi khởi động lại:

```sh
./e2e/scripts/stop-online-acceptance.sh
./e2e/scripts/start-online-acceptance.sh
```

Log và revision local nằm tại `/tmp/coopfood-kph-online-acceptance/`.

## Kịch bản ngắn cho owner

1. Đăng nhập `manager.e2e`, mở lịch sử và chọn tab **TPTS**. Kỳ vọng có 30
   phiếu, 25 phiếu ở trang 1 và 5 phiếu ở trang 2; tổng không đổi khi chuyển
   trang và ảnh minh chứng hiển thị được.
2. Chọn sắp xếp **Số lượng tăng dần**, đi trang 1 → 2 → 1. Kỳ vọng thứ tự áp
   dụng trên toàn bộ 30 phiếu, không phải sort riêng từng trang; điều hướng có
   trạng thái trang hiện tại và feedback khi đang tải.
3. Chọn một phiếu hoặc chọn tất cả trên trang 1 rồi sang trang 2. Kỳ vọng selection
   được xóa; select-all chỉ tác động trang đang thấy, không chọn ngầm trang khác.
4. Đổi filter/ngày/tab rồi đổi giữa cửa hàng `0001` và `0002`. Kỳ vọng về trang
   1, selection xóa, không ló dữ liệu của scope trước trong lúc tải; tổng theo
   TPCN/TPTS và tổng kết quả phản ánh đúng filter.
5. Thu hẹp cửa sổ như điện thoại và lặp lại chuyển trang. Kỳ vọng card history,
   nút điều hướng và nhãn vẫn đọc/bấm được, không tràn ngang.

## Những gì đã đổi

- OpenAPI, fixture và generated client: page/filter/sort contract đồng bộ.
- Backend KPH: filter/sort/count phía server, phân trang record trước khi nạp
  ảnh, thứ tự tie-break ổn định và giữ nguyên authorization/store scope.
- Store PWA online: query key cách ly đúng scope/filter/page, totals, điều hướng
  accessible, loading feedback và selection chỉ thuộc trang hiện tại.
- Unit/integration/E2E: page boundary, bảy sort, cross-store cache isolation,
  desktop/mobile và ảnh synthetic có thể chạy lại. Xem
  [technical evidence](technical-evidence.md).

## Giới hạn cần biết khi nghiệm thu

- D01 dùng offset pagination, không phải cursor/infinite scroll.
- Không có select-all xuyên trang, search full-text hoặc export contract mới.
- Không thêm migration/index mới vì benchmark synthetic chưa cho thấy nhu cầu;
  production monitoring/capacity nằm ngoài vòng này.
- Kiểm tra mobile dùng Chromium viewport, không thay thế nghiệm thu thiết bị thật.
- Chưa push/merge/PR; cycle chỉ được CLOSED sau khi owner xác nhận rõ kết quả.

