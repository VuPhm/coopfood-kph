# Home, sidebar và mobile navigation — 21/10/2026

Tiếp nối [header hợp nhất/compact](handoff.md) trong cùng task. Owner yêu cầu
Home đủ nút tính năng, Tra hạn nổi trên các màn, sidebar desktop và mobile
chỉ Trang chủ/Thông báo/tính năng gần nhất, trình bày theo iOS 27. Owner xác
nhận **Thông báo dùng trang rỗng, chờ nối dữ liệu**.

- Branch `store-app/header-01-style-rollout`, base `0041ac0`.
- Worktree `/Users/vup/Documents/coopfood-kph/.local/worktrees/header-style-rollout`.
- Một writer `/root`; thay đổi chưa commit, chưa merge/deploy.
- Preview bản build: <http://127.0.0.1:4232/#home>.
- Candidate technical PASS, **owner visual acceptance pending**.

## Thay đổi

- `apps/store-pwa/src/store-navigation.tsx` và `.css` mới: nguồn chung bốn
  feature; sidebar sáng 248px từ 900px, nhóm chung và nhóm tính năng đủ bốn
  nhánh DATE/KPH/Báo cáo/Tra hạn, cùng store footer. Mobile capsule nổi 64px, ba link hash, active có aria-current. Recent
  chỉ ID hợp lệ DATE/KPH/reports/shelf, nhớ qua sessionStorage; Home/Thông báo
  không ghi đè. Phiên mới “Tính năng” dẫn về launcher; storage lỗi vẫn dùng được.
- `store-home.tsx`/`.css`: một launcher bốn thẻ responsive, thêm Báo cáo; chuông
  mở Thông báo và hai summary DATE/KPH giữ dữ liệu hiện có. Không render hai
  bộ launcher riêng mobile/desktop. Giữ spacious hero/artwork/native cover.
- `store-notifications.tsx` mới: header compact, white cap, empty state và nút
  Home theo lựa chọn owner. `store-app-frame.tsx`/`store-app.tsx` thêm route;
  không fake entries, badge, push hoặc API.
- `store-app.tsx`: Tra hạn nổi trên Home/KPH/DATE/reports/notifications; login
  và trang Tra hạn đầy đủ không lặp. Popup/dữ liệu/focus giữ hành vi cũ.
  PWA status chuyển vào footer frame để nhận clearance chung.
- `store-action-dock.tsx`: dùng phép đo/listener hiện có để xuất clearance root
  cho utility/toast, tránh đè Lưu mẫu/Tạo báo cáo. Cleanup khôi phục CSS value.
- `store-loading-frame.tsx` dùng chung launcher/nav/empty state; `store-app.css`
  bỏ bộ CSS launcher/rail/four-tabs cũ. Header compact/hợp nhất lượt trước giữ.
- `store-app.test.tsx` thêm hai test hành vi launcher/recent/empty/storage lỗi;
  chỉnh kỳ vọng menu ba ô và launcher chung. E2E đổi selector/role/lối chuyển
  màn tương ứng; report regression đi feature từ Home trên mobile.
- Docs CURRENT_STATE/NEXT/contract index/component catalog/Visual DNA cập nhật;
  [thiết kế UI và nguồn Apple](../../product/STORE_NAVIGATION_DESIGN.md).

Chỉ Store App hiện tại. Không đổi OpenAPI/backend/authorization/business rule;
Admin Web và entry online/Pilot cũ giữ scope riêng. Follow-up owner cùng ngày:
chỉ tham khảo bố cục capsule của iOS 27, **không Liquid Glass**. Navigation nền
đặc `#f9fdfb`, bỏ transparency/backdrop-filter/blur/saturate/phản quang, border
và shadow nhẹ; có focus, pressed, reduced motion/forced-colors và touch >=44px.
Không dùng thư viện UI mới.

## Kiểm chứng

Chạy từ worktree trên; browser headless Chromium, reduced motion, không dùng
snapshot pixel làm gate:

- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build`:
  PASS TypeScript/Vite/PWA; ExcelJS >500KB warning là baseline.
- `npm --workspace @coopfood-kph/store-pwa run test -- --maxWorkers=2`:
  PASS **231 tests / 33 files**.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-store-navigation.cjs`:
  PASS 390×844, 1440×1024, 320×740, 768×1024, 844×390. Home bốn nút, sidebar/
  đúng ba ô, recent/reload, Thông báo rỗng, Tra hạn popup/giữ dữ liệu/focus,
  khoảng cách với action dock/toast PWA (cả màn ngang thấp), chữ navigation 150%,
  contrast, không overflow/JS error.
- `STORE_APP_URL=http://127.0.0.1:4231 node e2e/scripts/check-store-header.cjs`:
  PASS sáu viewport (thêm 1024×768), một hero/header, anchors/chữ 150%/native cover.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-home-scroll-layer.cjs`:
  PASS năm viewport, cover/focus/navigation/giữ spacious reference.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-mobile-toolbar.cjs`:
  PASS năm viewport, active/keyboard/hit bounds/utility/state/modal/login exclusion.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 node e2e/scripts/check-progressive-layout.cjs`:
  PASS Home/KPH × 390/1440, zero layout shifts/JS error khi tải entry và lazy workspace.
- `STORE_PREVIEW_URL=http://127.0.0.1:4231 node e2e/scripts/check-report-selection-dock.cjs`:
  PASS 390/1440/320, floating/settle/focus/kỳ/chọn lô.
- `STORE_PREVIEW_URL=http://127.0.0.1:4232 STORE_REPORT_OUTPUT=.local/navigation/report-regression node e2e/scripts/check-date-report.cjs`:
  PASS 390/1440/320, chọn lô/mẫu/lịch sử/snapshot/DATE mutation/xuất Excel/in PDF
  và lỗi storage. Chỉ đổi helper navigation, giữ assertion nghiệp vụ.
- `npm run check:docs` và `git diff --check`: PASS.

Evidence cục bộ (ignored): `.local/navigation/` chứa ảnh Home/report/Thông báo/
DATE theo viewport; `.local/navigation/report-regression/` chứa hồi quy báo cáo.
Không commit dữ liệu vận hành hay ảnh thật. Các script lịch sử khác được cập
nhật selector không có nghĩa tất cả gate lịch sử đã chạy lại trong lượt này.

## Kiểm lại follow-up nền đặc/bốn nhánh

Home đã có Báo cáo trong source; dựng lại preview tại 4232 để phục vụ bản mới.
`StoreNavigation` gom bốn feature trong cùng nhóm sidebar; không còn tách Tra
hạn sang nhóm tiện ích. Thanh mobile giữ ba ô theo yêu cầu trước, đổi hoàn
toàn chất liệu sang nền đặc. Không đổi phép tính/route/workflow.

- Mock build TypeScript/Vite/PWA: PASS.
- Store App component tests: 8/8 PASS; không chạy lại full suite cho thay đổi
  CSS/nhóm sidebar này (full 231 tests PASS ở lượt ngay trước).
- Navigation gate bổ sung assert sidebar cùng nhóm đúng bốn link và computed
  style nền opaque/opacity 1/filter/backdrop-filter none: PASS năm viewport.
- Mobile toolbar gate keyboard/focus/touch/modal/Tra hạn: PASS năm viewport.
- `npm run check:docs` và `git diff --check`: PASS.

## Giới hạn và bước tiếp

Đây là Store mock/PWA hiện tại: DATE trong phiên, report library browser-local;
chưa nối backend Thông báo. Recent là preference phiên, không phải lịch sử
truy cập/audit. Chưa xác minh iPhone/Safari/PWA standalone hoặc bàn phím OS
thật; Playwright desktop/mobile emulation không thay kiểm thiết bị.

Bước nhỏ tiếp: owner xem Home, sidebar, ba ô mobile và trang Thông báo tại
preview 4232; ghi phản hồi hình ảnh trước khi quyết định tích hợp. Không suy
quyền merge/Pages cutover từ yêu cầu chỉnh UI.
