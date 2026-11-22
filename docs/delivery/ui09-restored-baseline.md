# UI09 · Bản giao diện bàn giao backend

Hai nhánh cùng xuất phát từ `main` local `2d1536f`. `92dba87` chứa KPHQA01, DATEON01 và DATEUI01 ngày 17/11. `8c3fae9` chứa CHAIN01 và STOREUI01 ngày 22/11. UI09 ghép hai lịch sử để nhánh backend có thể lấy một điểm xuất phát duy nhất.

## Đối chiếu những phần phục hồi

| Thay đổi | Commit trên nhánh round | Commit tương đương đã tích hợp |
| --- | --- | --- |
| Hàng KPH compact | `dca66e7` | `1543103` |
| Khôi phục điều khiển nhập DATE, giữ thao tác riêng trên dải tag | `bb412c7` | `2afd570` |
| Thao tác tài khoản Store | `5145f4d` | `b934f4b` |
| Token và điều khiển workspace Admin | `92c4097` | `d0029e4` |

Bốn cặp có cùng `git patch-id --stable`. So sánh nội dung thực của `store-record-items.css` và `store-search-field.tsx` tại hai worktree R5, cùng `feature-loading.css` tại Compact03, cho kết quả trùng baseline. Các bản demo khách hàng, Cloudflare mock/brand và Pilot Pages có entry và mục đích phát hành riêng. Stash RPT01 là mốc trước tích hợp ngày 20/10. Các worktree và stash đó được giữ làm provenance.

KPHQA01 bổ sung logo, thông báo lỗi gửi phiếu, giữ lựa chọn khi tải thêm và chọn đủ ngày. STOREUI01 bổ sung danh sách lô trong phiên. DATEUI01 cung cấp workspace danh sách, dòng compact và trạng thái chưa kết nối. Quyền duyệt khi ghép hai nhánh tuân quyết định CHAIN01 đã được owner xác nhận lại ngày 22/11. [KPHQA01](kphqa01-final-acceptance.md) · [DATEUI01](dateui01-list-checkpoint.md) · [STOREUI01](storeui01-date-list.md) · [CHAIN01](../product/KPH_APPROVAL_SCOPE.md).

## Kiểm trên candidate ngày 22/11

- Backend CHAIN01 và hai entry Store/Admin. Playwright gửi một phiếu có ảnh, kiểm cửa hàng trưởng B nhận 403, cửa hàng trưởng A duyệt, nhân viên mở lại đúng phiếu. Admin vùng thấy 2 phiếu và Admin chuỗi thấy 4 phiếu theo tổng của fixture tại thời điểm chạy. Mỗi vai mở được đúng chi tiết và ảnh trong scope. Lệnh dùng `STORE_URL=http://127.0.0.1:4781 ADMIN_URL=http://127.0.0.1:4780 node e2e/scripts/check-chain01-store-admin.cjs`.
- Đối chiếu OpenAPI và client sinh từ schema qua `npm run check:contracts` và `npm run check:api`. Đạt 31 tài nguyên trong manifest, 23 API fixtures và client không drift. Vitest ở Admin Web và `packages/ui` đạt 31 + 20 ca.
- DATE mock trên 390×844 và 1440×1024. `check-fresh-r5-date.cjs` kiểm lọc nhóm, dải tag nhận chạm/phím riêng, form thêm lô và zoom 200%. Backend UI09 dùng PostgreSQL 17 sạch, áp dụng thành công migration V1–V9, sau đó nạp ba fixture ADMIN03, KPHON02 và CHAIN01 theo guard sẵn có.
- Sau khi tiếp tục phiên, OrbStack gặp lỗi khởi động mạng máy ảo. Lượt browser cuối dùng PostgreSQL 18 local với cùng ba fixture và backend từ source UI09. Store online ở cổng 4784, Admin ở 4783 và API ở 8879. Dữ liệu tổng hợp nằm riêng trong worktree.
- `check-kphon04-review-export.cjs` đạt mobile/desktop, gồm nối thêm giữ chọn, xuất đúng phiếu, ảnh stamped trong workbook và thu hồi quyền. `check-kph-integrated.cjs` đạt gửi ba ảnh, retry cùng ID, thu hồi membership qua Admin, duyệt bằng cửa hàng trưởng và xuất theo quyền vùng. Membership thử nghiệm đã được trả về trạng thái ban đầu. `check-kphon02-lookup-history.cjs` đạt ở hai viewport với 37 phiếu, mỗi trang 25. Các lần chạy có tạo phiếu tổng hợp trong database kiểm thử.
- Build Store online/PWA và Admin đạt. Store online kiểm 12 ca session gồm che bản nháp nhập lô khi xác minh và khôi phục sau khi xác minh thành công.
- DATE online đạt ở 390×844 và 1440×1024. Mở DATE từ Home và route trực tiếp, nhập lô, mở chi tiết, quay về Home rồi mở lại, tải lại trang và kiểm tra danh sách rỗng. Khi giữ request xác minh quyền, sheet chi tiết biến mất và shell bị khóa. Luồng lô trong phiên không gửi request ghi dữ liệu nghiệp vụ.
- Suite Store PWA có 357 ca. Lượt toàn bộ với ngưỡng mặc định đạt 352/357. Chạy lại riêng 3 file liên quan với cùng assertion, giới hạn chờ DOM 5 giây và mỗi ca 20 giây trên máy local đạt 23/23. Cấu hình test trong repo giữ nguyên. Chưa chạy CI từ xa hoặc nghiệm thu iPhone/Excel thực trên UI09.
