# KPH — khu chức năng theo DATE, 13/10/2026

Owner yêu cầu bố trí tiêu đề/số phiếu và sắp xếp nhanh/chọn/lọc đồng bộ với
DATE. Reuse task `store-app/figma-mobile-implementation`, base `5fdfa3e`, writer
Codex tại `/Users/vup/Documents/coopfood-kph`. Working tree có follow-up UI khác
được giữ nguyên; không tạo commit, push, merge hoặc deploy.

## Bố trí

- Tìm/quét nằm riêng phía trên tab. Danh sách: tab → tiêu đề/số phiếu →
  Sắp xếp / Chọn / Lọc → nội dung. COUNT vẫn là tổng phiếu phù hợp bộ lọc,
  tab giữ type totals; selection/page/lookup/create semantics giữ nguyên.
- Tiêu đề 17 px/650 và số phiếu 13 px/400 cùng baseline, wrap khi cần.
  Khoảng controls 12 px, nút 8 px, vùng bấm tối thiểu 44 px theo mẫu DATE.
- Chọn có Lucide ListChecks 20 px/nét 1,8, aria-pressed và trạng thái xanh
  khi chọn; nút không dịch bounds khi hover/press. Lọc giữ SlidersHorizontal,
  badge criteria tự tăng chiều cao theo chữ. Không đổi DATE hoặc shared UI.
- Loading frame dùng cùng thứ tự/control/bounds, tránh nhảy sau lazy load.

## File và kiểm tra

Runtime: `apps/store-pwa/src/store-kph-workspace.tsx`,
`store-kph-loading.tsx`, `store-kph-fresh.css`.
Gate `e2e/scripts/check-progressive-layout.cjs` thêm geometry tìm kiếm/controls.
Docs: CURRENT_STATE, NEXT và tài liệu này.

- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-kph-workspace.test.tsx src/store-app.test.tsx --maxWorkers=2`: **11 tests / 2 files PASS**.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph-date-controls/build --emptyOutDir`: **TypeScript/build/PWA PASS**, warning chunk lớn có sẵn.
- Playwright targeted `.local/kph-date-controls/check.cjs`: **390×844,
  1440×1024, 320×740, 844×390 PASS**. So trực tiếp CSS/geometry DATE: thứ tự,
  baseline/type scale/gap, touch, keyboard sort, chọn tất cả/search reset,
  count/filter/focus, 150% chữ và không overflow/page errors.
- Với `STORE_PREVIEW_URL=http://127.0.0.1:4214`, chạy
  `node e2e/scripts/check-kph-filter-sort.cjs`: **3 viewport PASS** về
  sort/filter/reset/date guard/keyboard/contrast/bounds/touch.
- `node e2e/scripts/check-kph-fresh.cjs`: **3 viewport PASS** về
  list/search/selection/form/modal focus; fixture tổng hợp.
- `node e2e/scripts/check-progressive-layout.cjs`: **Home/KPH 390/1440 PASS**,
  geometry ≤1 px và không layout shift, bao gồm vùng controls mới.
- `npm run check:docs` và `git diff --check`: PASS.

Screenshots/results/logs: `.local/kph-date-controls/`. Chữ 150% đã kiểm cả
badge active sau đổi sắp xếp. Preview mock **http://127.0.0.1:4213/#kph** trỏ tới
build mới và bao gồm CTA/panel lượt trước. Build cũ tại
`.local/kph-list-labels/build` được giữ, không ghi đè; có thể chạy lại Vite
preview với outDir đó để quay lại. Preview 4214 chỉ dùng kiểm tra tạm.

Technical gate đạt; owner visual acceptance và thiết bị thật còn pending.
Bước nhỏ tiếp theo: owner tải lại 4213, xem KPH cạnh DATE và thử chọn/lọc;
không suy ra nghiệm thu CTA/panel từ kết quả kỹ thuật lượt này.
