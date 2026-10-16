# Nhân rộng nhãn màu và thanh cạnh trái — 12/10/2026

Owner chấp nhận KPH qua **“đạt, checkp, nhân bản”**, xác nhận scope qua câu trả
lời **“Toàn bộ nhãn màu và thanh nhãn”**, rồi yêu cầu **“tiếp”**. Checkpoint KPH
local là `5fdfa3ecfcd54b92aaca5a98c140b56421d094df`, trên nhánh/worktree hiện tại
`store-app/figma-mobile-implementation` / `/Users/vup/Documents/coopfood-kph`.
Rollout là working-tree candidate sau checkpoint, chưa có nghiệm thu owner.
Không đưa WIP DATE chưa chốt vào checkpoint KPH.

## Kết quả

| List | Nhãn và màu thanh | Authority giữ nguyên |
| --- | --- | --- |
| KPH Fresh | Ba nhãn/choice/bar đã accepted | Grid/selection/skeleton accepted giữ nguyên |
| DATE | Nhãn theo mốc DATE + xử lý; bar theo DATE | Đã xử lý không đổi tình trạng hạn dùng; không progress/% ở list |
| Lịch sử Tra hạn | An toàn xanh, sắp/cần lùi cam, hết hạn đỏ | Snapshot lúc tra; không tính lại theo ngày hiện tại; giữ 20 lần trong phiên |
| KPH online/Pilot | Cùng adapter KPH; approval read-only dùng label, select có quyền dùng palette | Store scope, page-local selection, placeholder busy, callback, Pilot storage giữ nguyên |
| Admin tài khoản | Active xanh/inactive xám; role tím/xanh dương | Không tạo quyền hoặc mở lại nút vô hiệu hóa |
| Admin lịch lifecycle | Chờ tím, đến hạn cam, thực thi xanh, hủy xám | Ngày due từ helper hiện có; disabled/action/guard không đổi |
| Admin catalog batch/dòng | Staged tím, validated xanh, published xanh dương, rejected/error đỏ, warning cam | Status từ API; giữ raw/normalized identifier và toàn bộ message; hợp lệ chưa phải publish |

Scope là các list **bản ghi nghiệp vụ** hiện có, không thêm bar vào menu, option
lọc, gallery ảnh hoặc danh sách hướng dẫn/message. Mỗi item có một cue, luôn
kèm chữ/icon đọc được. Nhãn không có action/tab stop; thanh aria-hidden.

Pattern chung `ui-list-marker-card`/`ui-list-marker-cell` trong packages/ui dành
padding trái 28px, inset 12px, thanh 3px; card mobile 36px, desktop 24px,
cell bảng 24px căn giữa. Consumer giữ padding chiều còn lại và bố cục riêng;
DATE/history đặt top 16px theo tên/time. Không đổi token global/Tag API.

Yêu cầu mới cập nhật hướng DATE trước đó: thanh cạnh trái chỉ là cue tình trạng,
khác timeline hạn dùng đã bỏ khỏi list. Tài liệu DATE/label/DNA đã ghi rõ.

## Files của rollout

- `packages/ui/src/list-label.css`: marker gutter/card/cell pattern.
- `apps/store-pwa/src/store-date-label.tsx`, `store-date-workspace.tsx`,
  `store-date-fresh.css`: reuse DATE tone và marker; thay đổi này nhỏ trên WIP
  DATE trước lượt này, không nhận toàn bộ WIP đó là đã accepted.
- `apps/store-pwa/src/store-shelf-label.tsx`, `store-shelf-history.tsx`,
  `store-shelf-history.test.tsx`, `store-app.css`: snapshot adapter/layout.
- `apps/store-pwa/src/history-records.tsx`, `styles.css`, `app.tsx`: online/Pilot
  adapter, native select palette và rãnh checkbox/header.
- `apps/admin-web/src/list-labels.tsx`, `list-labels.test.tsx`, `app.tsx`,
  `identity-workspace.tsx`, `catalog-workspace.tsx`: adapter và consumer.
- `e2e/scripts/check-list-label-rollout.cjs`, `check-shelf-history.cjs` và
  docs label/DNA/catalog/DATE/current/NEXT/design-system/plan/handoff.

## Kiểm chứng

Build và browser dùng Node/npm trong repository, Chromium headless qua Playwright;
response online/Admin bị intercept bằng fixture tổng hợp, không gọi backend thật.
Build mock phục vụ 4213, Admin 4214, online 4215. Screenshot và JSON ignored tại
`.local/list-label-rollout/evidence`; đã xem DATE/catalog mobile, identity desktop
và KPH nhân viên mobile. Không dùng Computer Use hoặc pixel snapshot rộng.

| Lệnh | Kết quả |
| --- | --- |
| `npm run check` | PASS các workspace TypeScript. |
| `npm --workspace @coopfood-kph/admin-web test` | PASS 16 tests; gồm status mapping và guard/workflow cũ. |
| `npm --workspace @coopfood-kph/store-pwa test -- src/store-kph-workspace.test.tsx` | PASS 5 tests, kiểm lại timeout lazy form khi chạy full song song. |
| `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2` | PASS 206 tests / 26 files, đầy đủ Store; tổng các workspace 257 tests PASS theo các lượt kiểm đã ghi. |
| `npm --workspace @coopfood-kph/api test`, `npm --workspace @coopfood-kph/kph-rules test`, `npm --workspace @coopfood-kph/ui test` | PASS 2/19/14 tests trong root test run. |
| `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-list-labels/build --emptyOutDir` | PASS mock/PWA. |
| `VITE_KPH_ONLINE=true VITE_STORE_APP_MOCK=false npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/list-label-rollout/online --emptyOutDir` | PASS online/PWA. |
| `npm --workspace @coopfood-kph/admin-web run build -- --outDir ../../.local/list-label-rollout/admin --emptyOutDir` | PASS Admin. |
| `node e2e/scripts/check-list-label-rollout.cjs` | PASS 14 scenarios: 7 nhóm/trạng thái quyền × 390×844/1440×1024, marker geometry/inset, labels wrap 150%, no overflow, text contrast ≥5,39:1 / bar ≥3,48:1, DATE xử lý độc lập, history snapshot, Admin due/disabled/no writes, online selection/scoped request/employee read-only. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4213 node e2e/scripts/check-kph-marker-layout.cjs` | PASS 390/1440/320, hai loại phiếu, clearance/focus/selection/tên dài, giữ bản accepted. |
| `STORE_PREVIEW_URL=http://127.0.0.1:4215 node e2e/scripts/check-kph-online-loading.cjs` | PASS 390/1440, skeleton, scoped paging, prefetch dedupe, busy selection, lazy Excel. |
| `STORE_APP_URL=http://127.0.0.1:4213 node e2e/scripts/check-shelf-history.cjs` | PASS 390/1440, 20 limit/order/dedup/Recall/reset/session và snapshot không bị đổi sau khi clock đổi. |
| `npm run check:contracts`, `npm run check:docs`, `git diff --check` | PASS. |

Lượt root test mặc định có một timeout `findByRole` khi lazy form KPH chưa tải
kịp trong full parallel run; 256 test khác PASS. Không tắt test/guard hoặc sửa
runtime để che lỗi. Kiểm lại riêng và full Store với hai worker như bảng trên.
Build có warning chunk ExcelJS >500kB đã tồn tại từ trước.

## Trạng thái bàn giao

KPH checkpoint đã accepted; phần nhân rộng chờ owner xem, không coi im lặng là
nghiệm thu. Candidate vẫn working tree có WIP DATE chung; manifest SHA-256
source đã kiểm và kết quả nằm tại `source-manifest.json` trong record này.
Formal gate theo commit/cycle checker chưa đóng vì chưa có candidate commit
chung sạch và chưa có owner decision cho rollout; technical report không thay
gate đó. Không push/merge/deploy, không sửa backend/OpenAPI/migration.

Bước nhỏ tiếp: tải lại <http://127.0.0.1:4213/#date>, xem nhãn/bar ở Theo dõi
DATE; mở <http://127.0.0.1:4213/#shelf> và tra một lần để xem history. Admin/
online xem screenshot fixture của handoff hoặc phiên local có API đúng scope.

Resume 13/10/2026 theo “tiếp”: manifest source khớp hoàn toàn với bản đã kiểm,
không có runtime đổi sau gián đoạn. Khôi phục preview 4213; smoke Playwright
DATE 390×844 PASS nhãn/marker khớp tình trạng, không overflow hoặc page error.
Docs/diff check PASS. Giữ nguyên technical evidence và gate owner pending.
