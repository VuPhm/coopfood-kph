# DATE — compact controls, nền xanh và nắp trượt

**Nghiệm thu 16/10/2026:** owner trả lời “pass, merge” sau preview KPH/DATE
4215 có neo tab. Các mục pending/chưa commit bên dưới là lịch sử trước
nghiệm thu; [hồ sơ tích hợp](merge-2026-10-16.md) ghi kết quả cuối.

Ngày 14/10/2026. Owner yêu cầu “tạm commit, tiếp với date”. Đã lưu checkpoint
local **`216c17c`** trên `store-app/figma-mobile-implementation`, gồm 74 file UI/
docs/tests hiện có; working tree sạch sau commit. `npm run verify` đạt
**257 tests**, docs/contract/API drift/TypeScript và build. Một test KPH cold
lazy import dùng chờ 5 giây thay cho mặc định 1 giây; vẫn kiểm đúng form/type,
không bỏ assertion hoặc test. Chưa push/merge/deploy.

DATE tiếp tục từ base `216c17c`, worktree `/Users/vup/Documents/coopfood-kph`,
writer Codex. Phần DATE mới chưa commit; technical gate khác owner acceptance.

## Thay đổi

- Header/main và vùng tìm/quét nối cùng nền xanh `--store-brand-start`.
  Form giữ nhập/quét/Tìm cùng hàng 48 px, giới hạn 640 px desktop; padding
  trên 12 px mobile/16 px desktop. Nút Tìm nền trắng/chữ xanh, quét mint,
  viền ô nhập sáng và focus trắng trên xanh.
- Vùng tìm ở lớp sticky; tab/danh sách/chi tiết nằm trong nắp trắng bo góc
  24 px, cách form 8 px. Cuộn document tự nhiên lên phủ vùng tìm, không thêm
  scroll container/listener. Nắp tối thiểu một viewport, kể cả empty list.
- Thông tin mã hàng và native metadata disclosure chuyển vào đầu nắp trắng,
  trải toàn chiều rộng trước browser/detail. Mở rộng được cuộn tự nhiên;
  giữ toàn bộ dữ liệu, exact lookup, reset disclosure theo product và leading zero.
- Tab bỏ padding ngoài, gap 8 px; browser gap 12 px, controls gap 8 px.
  Tiêu đề/số lô và sort/lọc cùng hàng khi đủ rộng, tự wrap khi hẹp; trạng thái
  xử lý ở hàng riêng. Desktop giữ list/detail hai cột, cùng lề trên;
  “Thêm theo dõi” vẫn disabled.
- Focus header/tìm/quét đưa về đầu để không bị nắp che. Giữ nội dung thẻ,
  nhãn/bar, typography, rules ngày/mốc, filter/sort, scan/miss/recovery và
  state/terminal guard. CTA xử lý lô giữ màu cam/xanh và vùng chạm 48 px.

So build checkpoint với cùng fixture/ngày 12/10: lô đầu lên cao hơn **28 px
ở 390 và 320**, **84 px ở 1440**; text của toàn bộ thẻ ban đầu không đổi.
Ảnh/geometry trước ở `.local/date-sliding-cover/before*`.

## Files

- `apps/store-pwa/src/store-date-workspace.tsx`: metadata trong cover và focus
  reveal upper controls; giữ state/domain handlers.
- `apps/store-pwa/src/store-date-fresh.css`: nền/lớp/spacing/control layout.
- `apps/store-pwa/src/store-app-frame.tsx`: focus header DATE được reveal như KPH.
- `e2e/scripts/check-date-sliding-cover.cjs`: native wheel/occlusion/focus/
  metadata/empty list/reflow/route gate.
- `e2e/scripts/check-date-layout.cjs`: đo form thay wrapper có padding, kiểm
  toolbar trong bounds browser khi desktop đặt cạnh heading; giữ card/detail/
  date facts/interaction checks.
- CURRENT_STATE, NEXT và handoff này.

Không đổi KPH, shared UI, contract/API, backend, fixture/dependency hoặc frame
Figma đã accepted. DATE vẫn prototype memory-only; chưa thêm persistence,
API tạo/sửa lô, theo dõi qua nửa đêm, thông báo hoặc thống kê.

## Kiểm tra

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/date-sliding-cover/build --emptyOutDir`:
  TypeScript/build/PWA PASS, warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-date-assessment.test.ts src/store-date-milestones.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **32 tests / 5 files PASS**.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4220`:
  `node e2e/scripts/check-date-sliding-cover.cjs` PASS **390×844,
  1440×1024, 320×740, 768×1024, 844×390**: native wheel, upper layer đứng
  đỉnh/nắp dịch theo scrollY/hit-test, contrast, search/scan/Tìm keyboard,
  product disclosure, empty list, header focus, 150% chữ và route reset.
  Route kiểm gần đỉnh ≤2 CSS px do native Chromium link focus, search/account
  hiện trong viewport; explicit focus reveal kiểm scrollY=0.
- `node e2e/scripts/check-date-fresh.cjs` PASS ba viewport: lookup/scan fixture/
  miss/recovery/metadata/processing/terminal guard/state phiên/navigation.
- `node e2e/scripts/check-date-kph-reference.cjs` PASS ba viewport: sort/filter/
  default reset/query/keyboard/outside/bounds/touch/contrast.
- `node e2e/scripts/check-date-layout.cjs` PASS ba viewport: shared gutters,
  compact controls, card dates, desktop detail và 150% chữ.
- `node e2e/scripts/check-date-compact.cjs` PASS ba viewport: product metadata,
  bốn loại lô, CTA không cần cuộn, contrast và 150% chữ.
- `node e2e/scripts/check-progressive-layout.cjs` PASS Home/KPH 390/1440:
  geometry ≤1 px và không shift, cả form loading. DATE bootstrap trước entry
  vẫn dùng generic loading hiện có; không thêm DATE skeleton ở lượt này.
- `npm run check:docs` và `git diff --check`: PASS.

Evidence và build tại `.local/date-sliding-cover/`. Đã xem initial mobile/
desktop, metadata 390 và reflow 320. Kiểm Chromium headless/fixture tổng hợp;
camera thật/backend/owner device acceptance còn pending.

## Preview và bước nhỏ tiếp theo

**http://127.0.0.1:4215/#date** trỏ build DATE mới, gồm KPH đã checkpoint;
4220 dùng kiểm tra. Build checkpoint trước tại `.local/kph-white-cta/build`
giữ nguyên để quay lại.

Bước nhỏ tiếp theo: owner tải lại DATE, tìm SKU/lô, cuộn nắp và thử
Ghi nhận/Đã xử lý. Phần DATE mới giữ working tree; chưa tự checkpoint/deploy.
