# D01 — Hợp đồng phân trang lịch sử KPH online

Trạng thái: Accepted — API D01 revision2 ngày24/09/2026; interaction online
được owner yêu cầu đổi17/11/2026 trong vòng UI/UX KPHQA01.
Bản tích hợp trên baseline P04/P05; owner decision tại handoff D01.

Store Fresh có [UI compact/Hiển thị thêm đã duyệt22/10](KPH_COMPACT_HISTORY.md) theo
owner ngày22/10/2026 là provenance. Yêu cầu owner17/11 thay interaction online:
không giới hạn lựa chọn theo trang, chọn đủ ngày dù ngày vượt mốc25. API phân
trang backend giữ nguyên; không thay contract này ngầm theo mock.

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

## Store PWA — interaction owner17/11/2026

- Backend vẫn lọc/sắp xếp toàn tập trước khi trả từng page25. Frontend dùng
  “Hiển thị thêm” nối page tiếp vào tập đã tải; deduplicate theo record ID,
  giữ thứ tự server. Không tự fetch toàn bộ lịch sử khi vào màn.
- Nối thêm không xóa selection, không thay/ẩn dòng đã tải khi chờ page mới;
  lỗi tải thêm giữ tập đã tải/selection và cho retry đúng page thiếu.401/403
  vẫn đóng dữ liệu/scope theo policy, không giữ data private để làm mượt.
- Đổi user/store/tab/filter/sort xóa tập đã tải, selection và detail. Refetch
  sau create/review vẫn invalidate đúng actor/store; không tự duyệt lại khi
  response bị mất.
- Checkbox chung chọn các phiếu đã tải. Checkbox ngày mang nghĩa explicit
  **“Chọn toàn bộ ngày dd/mm/yyyy”** trong type/bộ lọc hiện hành, kể cả chưa
  hiển thị. Frontend query đúng ngày với pageSize100, tối đa500 records để
  giữ export limit; chỉ commit selection sau khi đã lấy đủ, không chọn một
  phần khi lỗi, dataset đổi count/duplicate hoặc vượt giới hạn.
- Số đã tải và tổng selection là hai số riêng. Nếu lựa chọn theo ngày có phiếu
  chưa nằm trong list, giao diện nêu rõ số phiếu đó trước export. Bỏ chọn ngày
  bỏ cả phần chưa hiện. Request chọn ngày bị abort/loại response khi đổi bộ lọc,
  actor/store, mất scope hoặc capability; backend vẫn reauthorize từng ID.
- Badge/tổng tab lấy totalItems/typeTotals của backend, không dùng độ dài page.
  Group theo ngày không đổi thứ tự sort toàn tập; cùng ngày nối qua page không
  thành các màn riêng. Với sort khác ngày, date runs giữ thứ tự server như cũ.
- Confirm export chỉ selected APPROVED đúng store/type và vẫn tối đa500 phiếu;
  phần chưa duyệt/không duyệt được nêu là bị bỏ qua. Không có select-all ngầm
  trên toàn query, API bulk mới hoặc export scope dựa vào frontend.

## Verification

- Contract/example/generated client không drift.
- Backend test page boundary, tổng/count, từng filter/sort, tie-breaker ổn định,
  page không trùng/mất trên dataset không đổi và cross-store denial.
- Query chọn record IDs trước rồi mới nạp ảnh; ghi query plan/baseline với dữ liệu
  tổng hợp. Chỉ thêm index khi số đo chứng minh cần.
- Frontend test query key/request, reset state, append/whole-day selection, cancellation, counts,
  loading/error và Pilot regression.
- Browser backend thật kiểm desktop/mobile đổi filter/sort/page, quay lại không
  trùng/mất và thao tác chỉ tác động selection trang hiện tại.

## Ngoài phạm vi

Cursor pagination, tự động infinite scroll, select-all toàn query, bulk API mới,
full-text search, production load/SLO và thay đổi export limit 500 thuộc outcome
khác.
