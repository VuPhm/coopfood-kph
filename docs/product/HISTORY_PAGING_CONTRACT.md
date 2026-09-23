# D01 — Hợp đồng phân trang lịch sử KPH online

Trạng thái: revision 2 technical PASS trên baseline P04/P05 — 2026-09-24.
Nghiệp vụ revision 1 được giữ; owner chọn tiếp tục D01, chưa nghiệm thu bản tích hợp.

## Outcome

Lịch sử online phải lọc và sắp xếp trên toàn bộ tập phiếu đúng store trước khi
phân trang. Backend không được lấy toàn bộ record × photo vào bộ nhớ rồi mới cắt
trang. Pilot local-only theo ADR-0002 giữ nguyên authority và hành vi hiện tại.

## API

- `GET /api/v1/stores/{storeId}/kph` trả một page object thay cho array.
- `page` đánh số từ `1`, mặc định `1`; `pageSize` mặc định `25`, nhận `1..100`.
- Filter gồm `type`, `detectedFrom`, `detectedTo`, `approvalStatus`. Khoảng ngày
  inclusive và giữ rule `detectedFrom <= detectedTo`.
- Sort gồm `detectedDate`, `product`, `supplier`, `quantity`, `condition`,
  `resolution`, `approval`; direction là `ascending` hoặc `descending`. Không
  truyền sort giữ mặc định `createdAt` mới nhất trước.
- Sort text online dùng nhãn hiển thị (kể cả nội dung `OTHER` và fallback nhập tay)
  với collation PostgreSQL `vi-x-icu`, không dùng mã enum làm thứ tự. PostgreSQL
  17 cần có collation này; kiểm integration phải chạy trên image thực. Collation
  database không cam kết giống từng tie của `Intl.Collator(vi, numeric: true,
  sensitivity: base)` trong Pilot: chuỗi chứa số/case/dấu có thể khác thứ tự phụ.
  Sort số lượng vẫn là numeric.
- Mọi thứ tự đều kết thúc bằng `createdAt DESC, id DESC` để không trùng/mất dòng
  giữa các trang khi dataset không đổi.
- Response gồm `items`, `page`, `pageSize`, `totalItems`, `totalPages` và
  `typeTotals` (`TPCN`, `TPTS`). `totalItems` phản ánh toàn bộ filter hiện hành;
  `typeTotals` phản ánh store + khoảng ngày nhưng không bị giới hạn bởi type hay
  approval filter, để giữ count hai tab như UI hiện tại.
- Backend resolve store scope từ session/database như hiện tại; client không thể
  dùng paging/filter/sort để vượt store.

## Store PWA

- Online gửi active type, khoảng ngày, approval filter, sort và page vào request;
  các giá trị này cùng user/store nằm trong TanStack Query key.
- Đổi user/store/tab/filter/sort đưa về trang 1, xóa selection và trạng thái mở
  card. Đổi trang cũng xóa selection để không thao tác trên dòng đã ẩn.
- Checkbox “chọn tất cả” chỉ chọn các phiếu ở trang hiện tại. Duyệt và xuất chỉ
  dùng selection của trang hiện tại; không suy diễn select-all xuyên nhiều trang.
- Badge cạnh tiêu đề hiển thị `totalItems`; count hai tab dùng `typeTotals`, không
  dùng số item của trang hiện tại.
- Điều hướng hiển thị trang hiện tại/tổng trang, nút trước/sau có accessible name,
  disabled state đúng và vùng chạm tối thiểu `44×44px`. Khi request trang mới
  đang chạy, dữ liệu cũ có thể được giữ để tránh nhảy layout nhưng phải có trạng
  thái loading/busy rõ.
- Sau create/review thành công, invalidate history scope tương ứng; nếu page hiện
  tại vượt quá `totalPages` mới thì đưa về page cuối hợp lệ.

## Verification

- Contract/example/generated client không drift.
- Backend test page boundary, tổng/count, từng filter/sort, tie-breaker ổn định,
  page không trùng/mất trên dataset không đổi và cross-store denial.
- Query chọn record IDs trước rồi mới nạp ảnh; ghi query plan/baseline với dữ liệu
  tổng hợp. Chỉ thêm index khi số đo chứng minh cần.
- Frontend test query key/request, reset state, page-local selection, counts,
  loading/error và Pilot regression.
- Browser backend thật kiểm desktop/mobile đổi filter/sort/page, quay lại không
  trùng/mất và thao tác chỉ tác động selection trang hiện tại.

## Ngoài phạm vi

Cursor pagination, infinite scroll, select-all xuyên trang, bulk API mới,
full-text search, production load/SLO và thay đổi export limit 500 thuộc outcome
khác.
