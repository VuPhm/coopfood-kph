# KPH02 — nhóm/lọc/tag và surface Store, revision 5

Ngày22/10/2026; candidate chờ owner xem. Revision5 đổi default nhóm ngày và
tách vùng chọn/thu mở theo feedback; nền trắng revision4 giữ nguyên. Không suy
acceptance từ technical PASS. Một writer Codex; cùng nhánh
`store-app/kph02-compact-history`, worktree
`/Users/vup/.codex/worktrees/kph-compact-history/coopfood-kph`, base`982c04c`.
Main`fb8e4b7` vẫn sạch/riêng; chưa commit/merge/push/deploy, không mở cycle/team.

## Kết quả và quyết định

- Mặc định nhóm ngày, reset filter trả grouping về bật. Switch trong lọc giữ
  query/filter/sort/selection/tập đã tải. Trong Chọn vẫn thu/mở: chỉ label
  checkbox44×44px chọn ngày; phần ngày/count/chevron là button thu/mở riêng,
  cách8px. Thu/mở không đổi chọn; chọn ngày thu gọn không mở nhóm. Vào/thoát
  Chọn giữ collapse hiện tại. Tắt nhóm: ngày mobile căn trái cạnh SKU/số lượng
  kèm icon lịch; checkbox vẫn chỉ chọn các phiếu đã tải.
- Desktop giữ typography13px/dòng~60px/nhãn26px, click toàn hàng/chevron; input
  selection độc lập. Button tên giữ lối vào keyboard, mở từ ô khác cũng trả focus
  đúng hàng. OTHER ellipsis theo cột, native title khi hover và detail đầy đủ.
- Mobile14px/metadata12–13px: tag strip riêng ngoài nút mở, nowrap/scroll-x,
  hidden bar/fade mép khi còn nội dung, keyboard khi overflow. Đã mô phỏng touch
  swipe/ArrowRight, không mở nhầm dialog hoặc làm trang tràn ngang; OTHER cap146px.
- Bỏ canvas xám revision3 theo feedback “xấu dơ”: nền/sidebar trắng thuần
  `#fff`, holder trắng/edge`#dfe5e9` và bóng nhẹ; inner well gần trắng`#fafbfc`.
  Không thêm gradient phủ nền. Hero holders trắng đặc; nav/dock giữ glass và
  fallback trắng. Giữ brand xanh/module pastel/status palette,
  geometry và glow Tra hạn. Scope nền dùng chung nên kiểm thêm Home/DATE/reports.
- Lối tắt ngày Việt Nam, tuần từ thứ Hai; nối25 giữ chọn, điều kiện xuất/duyệt,
  fixture29phiếu/loại và nhóm5/ngày/OTHER dài giữ nguyên. [Semantics](../product/KPH_COMPACT_HISTORY.md).

## Files trong task

- `apps/store-pwa/src/store-kph-workspace.tsx`: presets/more/group toggle,
  selection/collapse/reset/focus, switch trong filter.
- `apps/store-pwa/src/store-kph-list.tsx`: flat/grouped/date, row click/chevron,
  DayHeading và KphTagStrip/ResizeObserver, one layout/breakpoint, StoreKphMore.
- `apps/store-pwa/src/store-kph-fresh.css`: mobile spacing/scroll strip/fade,
  desktop column/ellipsis/row feedback và group switch; token canvas scoped.
- `apps/store-pwa/src/store-glass.css`: palette canvas/holder/well/sidebar,
  trắng fallback/hero và bóng trung tính; giữ giới hạn blur đã có.
- `apps/store-pwa/src/store-kph-label.tsx`: metadata custom detail, nguyên văn
  title/DOM; `store-kph-loading.tsx`: same list mặc định nhóm ngày/count/more.
- `store-kph-history.ts`: date range/đợt25/nhóm đoạn; `store-app-mock.ts`:
  fixture synthetic nhiều phiếu/ngày và OTHER dài, không dữ liệu thật.
- `store-kph-workspace.test.tsx`, `store-kph-label.test.tsx`,
  `store-kph-history.test.ts`: state giữ/reset/presentation/row/check isolation/
  calendar boundaries và capability label semantics.
- `e2e/scripts/check-kph-compact-history.cjs`: default grouped/toggle/flat, row
  click/title/ellipsis, touch strip/keyboard/no overflow/150% chữ/presets/append.
- `check-kph-fresh.cjs`, `check-kph-filter-sort.cjs`: actual record row selector,
  expectation fixture mới, không nới rule/ngưỡng.
- `check-progressive-layout.cjs`: footer more; `check-store-navigation.cjs`:
  fallback trắng mới; `check-store-surfaces.cjs`: canvas/holder/contrast scope.
- CURRENT_STATE/NEXT, KPH design/contract index/D01 note/label system/component
  catalog/Visual DNA và handoff này: candidate R5 (nền trắng R4 giữ nguyên), không đổi accepted business API.

## Technical verification

Các gate revision3/revision4 dưới đây là lịch sử trước feedback mới. Revision3 đã đạt: Revision4 chỉ đổi CSS màu nền/viền và
assertion surface theo nền trắng; kết quả kiểm lại ghi riêng phía sau.

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS294 tests (Store241/Admin16/API2/
  rules19/UI16), docs/contracts/API drift/TypeScript/build/PWA. Log
  `.local/kph02/r3-verify.log`; ExcelJS chunk warning là baseline.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build -- --outDir ../../.local/kph02/build --emptyOutDir`: PASS;
  `.local/kph02/r3-mock-build.log`. Preview <http://127.0.0.1:4262/#kph>.
- `STORE_PREVIEW_URL=http://127.0.0.1:4261 node e2e/scripts/check-kph-compact-history.cjs`: PASS390/1440/320, cả fixture review và stress30phiếu/ngày;
  touch swipe/keyboard scroll không mở phiếu, trang không tràn ngang, toggle
  giữ selection/loaded extent, OTHER title/detail và click hàng/chevron/focus.
  Ảnh/JSON `.local/kph02/r3-browser/`, log `r3-browser.log`.
- Cùng script trên URL4262 với `STORE_KPH_SYNTHETIC_ROUTE=false` và
  `STORE_KPH_COMPACT_OUTPUT=.local/kph02/r3-build-browser`: PASS cả3viewport trên
  bundle cuối. Log `.local/kph02/r3-build-browser.log`.
- URL4262 + `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH390/
  1440, geometry≤1px/zero layout shifts/pageerror, gồm form/focus/scroll.
- URL4262 + `node e2e/scripts/check-kph-fresh.cjs` và
  `node e2e/scripts/check-kph-filter-sort.cjs`: PASS390/1440/320, hai form,
  search/selection/filter/sort/date guard/picker/focus/contrast/touch.
- URL4262 + `node e2e/scripts/check-store-navigation.cjs`: PASS390/1440/320/
  768/844×390; Home đủ tính năng, recent/reload, utility/report dock/offline toast,
  focus/geometry/contrast. Log `.local/kph02/r3-navigation.log`.
- URL4262 + `node e2e/scripts/check-store-surfaces.cjs`: PASS5màn×2viewport
  (Home/KPH/DATE/reports/shelf), neutral canvas/holder separation/no overflow,
  scoped contrast. Ảnh/JSON `.local/kph02/r3-surfaces/`, log `r3-surfaces.log`.
  Auditor tuyến tính không mô hình multi-layer radial glow Tra hạn đã có:
  trên màn đó đo history ở canvas mới; form/result kiểm ảnh, không tuyên bố
  contrast audit toàn bộ glow hoặc WCAG certification.
- `npm run check:docs`, `git diff --check`: kiểm cuối sau cập nhật hồ sơ.

### Kiểm lại revision4 — nền trắng

- Mock build bằng lệnh phía trên: PASS, `.local/kph02/r4-mock-build.log`.
- URL4262 + `node e2e/scripts/check-store-surfaces.cjs`: PASS Home/KPH/DATE/
  reports/shelf ở390×844 và1440×1024. Assertion nền trắng thuần/không gradient,
  holder có viền hoặc bóng, scoped contrast và không tràn ngang. Ảnh/JSON
  `.local/kph02/r4-surfaces/`, log `r4-surfaces.log`; giới hạn glow vẫn như trên.
- URL4262 + `STORE_KPH_SYNTHETIC_ROUTE=false STORE_KPH_COMPACT_OUTPUT=.local/kph02/r4-build-browser node e2e/scripts/check-kph-compact-history.cjs`:
  PASS390/1440/320, grouping/select/append/tag scroll/detail/focus giữ nguyên;
  `.local/kph02/r4-build-browser.log`.
- URL4262 + `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH390/
  1440, zero layout shifts/pageerror; `.local/kph02/r4-progressive-layout.log`.
- Đã xem ảnh KPH và Home ở390/1440: trắng liên tục, holder viền mảnh, sidebar
  trắng, không còn vùng canvas xám. `npm run check:docs` và `git diff --check`
  PASS sau cập nhật tài liệu. Không chạy lại294 unit tests cho thay đổi màu CSS;
  kết quả revision3 phía trên vẫn là mốc kiểm hành vi.

### Kiểm revision5 — nhóm mặc định và chọn/thu mở độc lập

- `VITEST_MAX_WORKERS=2 npm run verify`: PASS294 tests (Store241/Admin16/API2/
  rules19/UI16), docs/contracts/API drift/TypeScript/build/PWA. Log
  `.local/kph02/r5-verify.log`; cảnh báo ExcelJS chunk vẫn là baseline.
- `npm run check:docs`, `git diff --check`: PASS sau cập nhật bàn giao.
- `npm --workspace @coopfood-kph/store-pwa test -- src/store-kph-workspace.test.tsx src/store-kph-history.test.ts src/store-kph-label.test.tsx`:
  PASS18 tests; thêm assertion checkbox label chọn ngày đang thu gọn, bấm count
  chỉ thu/mở, giữ selection, đổi grouping/reset về mặc định bật; nối thêm mở
  nhóm có phiếu mới và cập nhật mixed state. Log `.local/kph02/r5-unit.log`.
- Mock build cùng lệnh phía trên: PASS, `.local/kph02/r5-mock-build.log`.
- URL4262 + `STORE_KPH_SYNTHETIC_ROUTE=false STORE_KPH_COMPACT_OUTPUT=.local/kph02/r5-build-browser node e2e/scripts/check-kph-compact-history.cjs`:
  PASS390×844/1440×1024/320×844. Default nhóm ngày; tắt nhóm kiểm tọa độ ngày
  mobile cùng cụm SKU/số lượng; tap label padding44px chỉ chọn, date/count chỉ
  thu/mở; Enter/Space, hidden body, checked state và focus. Các gate tag scroll/
  row click/ellipsis/append/detail/contrast vẫn đạt. Log `r5-build-browser.log`,
  ảnh `.local/kph02/r5-build-browser/`.
- URL4261 + `node e2e/scripts/check-kph-compact-history.cjs`: PASS3viewport,
  stress30phiếu/ngày: chọn25 → thu gọn → nối thêm → nhóm mở/mixed → chọn30,
  xuất chỉ15phiếu đã duyệt; presets/manual reset/150% chữ không tràn ngang.
  Log `.local/kph02/r5-browser.log`, ảnh/JSON `.local/kph02/r5-browser/`.
- URL4262 + `node e2e/scripts/check-progressive-layout.cjs`: PASS Home/KPH390/
  1440, skeleton/live cùng mặc định nhóm, zero shifts/pageerror;
  `.local/kph02/r5-progressive-layout.log`.
- Đã xem ảnh flat390/320 và selection390/1440: ngày căn trái, checkbox và
  button thu/mở tách rõ. Không dùng Computer Use.

Đã xem ảnh KPH3viewport và Home/DATE/report390/Home1440, flat/grouped/scroll/
selection. Chỉ Playwright headless/Chromium, không Computer Use. Technical PASS
và nghiệm thu thực của owner/thiết bị thật giữ riêng.

## Giới hạn / bước tiếp

Store Fresh memory-only; fixture08/2026 nên lọc ngày hiện tại có thể rỗng.
Không đổi backend/OpenAPI/authorization/online/Pilot/Pages hoặc frame Figma.
Chưa API wiring cho UX này, không đổi contract D01 page-local của online.

Bước nhỏ tiếp theo: owner tải lại4262, thử Chọn → thu gọn một ngày → tick ngày
đang thu gọn → mở lại; tắt Nhóm theo ngày trong lọc để xem ngày mobile căn trái.
