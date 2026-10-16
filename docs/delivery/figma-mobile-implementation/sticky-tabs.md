# KPH + DATE — neo tab khi cuộn tiếp

**Nghiệm thu 16/10/2026:** owner trả lời “pass, merge” sau preview 4215,
chấp nhận UI KPH/DATE hiện tại và cho phép merge. Trạng thái pending/chưa
commit bên dưới ghi thời điểm bàn giao trước đó; xem
[hồ sơ tích hợp](merge-2026-10-16.md) cho kết quả cuối.

Ngày 15/10/2026, yêu cầu “sửa kph và date, vuốt lên thêm nữa thì neo tab lại
trên top”. Nhánh `store-app/figma-mobile-implementation`, base `216c17c`,
worktree `/Users/vup/Documents/coopfood-kph`, writer Codex. Giữ nguyên phần
[DATE nắp trượt](date-sliding-cover.md) chưa commit từ lượt trước.

## Kết quả và files

- `apps/store-pwa/src/store-sticky-tabs.tsx` và `.css`: wrapper dùng chung,
  tab cuộn cùng nắp rồi native sticky tại safe-area trên đỉnh. Nền trắng đặc,
  cover dùng overflow clip để giữ bo góc mà không tạo scroll container.
  Tab bình thường cao 44 px trong lớp 64 px; tự tăng chiều cao khi chữ wrap.
  Nội dung sau tab cách thêm 4 px, đủ khoảng trống focus 8 px.
- `store-kph-workspace.tsx`, `store-date-workspace.tsx`: bọc tab hiện có,
  giữ group/aria-pressed và toàn bộ state/handlers. Focus control bị tab che
  được reveal tức thì và kiểm lại một frame sau native scroll anchoring;
  không thêm scroll listener. Bỏ qua portal, metadata trước tab và DATE
  detail bên phải. DATE desktop chỉ neo tab trong cột danh sách.
- `store-kph-loading.tsx`: cùng wrapper/geometry với live workspace.
  `store-app-frame.tsx` nạp CSS sớm cho cả loading/live.
- `e2e/scripts/check-sticky-tabs.cjs`: gate cuộn/pin/đổi tab/focus/popup/
  text 150%/cuộn về đầu cho cả hai màn ở năm viewport.
  `check-progressive-layout.cjs` đo thêm wrapper khi loading.
- CURRENT_STATE, NEXT và component catalog ghi source/consumer/evidence.

Các file source ở `apps/store-pwa/src/`. Không đổi contract/API, rule ngày,
authorization, dữ liệu phiếu/lô hoặc dependency. Chưa commit/push/deploy.

## Kiểm tra kỹ thuật

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/sticky-tabs/build --emptyOutDir`:
  TypeScript/build/PWA PASS; warning chunk lớn có sẵn.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-date-assessment.test.ts src/store-date-milestones.test.tsx src/store-date-workspace.test.tsx src/store-date-lookup.test.tsx src/store-app.test.tsx --maxWorkers=2`:
  **37 tests / 6 files PASS**.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4221`, chạy
  `node e2e/scripts/check-sticky-tabs.cjs`: **10 tổ hợp PASS**, KPH + DATE
  ở 390×844, 1440×1024, 320×740, 768×1024, 844×390. Kiểm native wheel,
  vị trí pin/opaque hit-test, đổi tab, focus 8 px dưới lớp neo, sort popup
  và trả focus, text 150%/44 px targets/no overflow, trả tab về vị trí đầu.
- Cùng preview: `node e2e/scripts/check-kph-fresh.cjs` và
  `node e2e/scripts/check-date-fresh.cjs` PASS ba viewport mỗi gate:
  tìm/quét fixture, selection/form/modal và DATE lookup/recovery/metadata/
  processing/terminal guard. Hai gate này chạy trước điều chỉnh khoảng đệm
  dưới tab cuối cùng +4 px; gate sticky và unit chạy trên bản cuối.
- `node e2e/scripts/check-progressive-layout.cjs` PASS Home/KPH 390/1440,
  gồm wrapper mới: geometry ≤1 px, không layout shift hoặc page error.
- `npm run check:docs`, `git diff --check`: PASS.

Build, JSON và screenshots ở `.local/sticky-tabs/`; Chromium headless,
fixture tổng hợp. Technical PASS chưa thay nghiệm thu owner trên thiết bị thật.

## Preview và bước tiếp theo

Preview **http://127.0.0.1:4215/#kph** và **http://127.0.0.1:4215/#date**
phục vụ build mới. Build trước ở `.local/date-sliding-cover/build` giữ nguyên
để quay lại. Bước nhỏ tiếp theo: owner tải lại hai màn, vuốt nắp lên, cuộn
tiếp/đổi tab rồi cuộn về đầu trên thiết bị sử dụng thực tế.
