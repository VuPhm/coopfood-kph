# Thanh dưới mobile và nút tra hạn lùi

Ngày 11/10/2026. Owner: “xây dựng thanh công cụ dưới cho mobile,
nhân tiện tối ưu nút tra date nổi”. Cùng nhánh `store-app/figma-mobile-implementation`,
worktree `/Users/vup/Documents/coopfood-kph`, writer cho toolbar `/root`.
Working tree còn các thay đổi Home/login/shelf trước đó; không commit/merge/deploy.

## Kết quả và lựa chọn

- Thanh navigation trắng cố định dưới màn hình, 4 mục thật: Trang chủ, Tra cứu,
  KPH, DATE. Icon Lucide hiện có, active xanh/mint + `aria-current="page"`, label
  luôn hiện và vùng bấm trên 44px. Không thêm các mục thông báo/cài đặt chưa có.
- Hiện dưới 900px, có safe-area; desktop giữ rail, login không có thanh nghiệp vụ.
  Tra hạn lùi là tiện ích riêng: lối Home/màn chính vẫn có; nút nổi mở popup ở KPH/DATE.
- Nút nổi từ vòng icon thành capsule peach có nhãn “Tra hạn lùi”, cao 48px,
  nằm 12px phía trên navbar mobile; desktop cũng có nhãn. Label phân biệt với DATE.
- Popup tra hạn lùi nằm 8px trên navbar, max-height theo viewport trừ thanh dưới,
  cuộn nội bộ khi màn thấp. Navbar vẫn dùng được vì utility là non-modal; đổi route
  đóng popup và giữ state lookup trong phiên. Escape/close trả focus về nút nổi.
- Padding cuối trang/KPH/DATE, vị trí decoration Home và toast dành chỗ cho toolbar;
  modal account/create/detail vẫn nằm trên toolbar qua primitive overlay hiện có.

## File và kiểm tra

`apps/store-pwa/src/store-app.tsx`: navigation anchors, active state, icon/label fab,
aria-controls panel. `store-app.css`: scoped navbar/layer/clearance và fab.
`e2e/scripts/check-mobile-toolbar.cjs`: browser gate cho route/hình học/state/focus.
Visual DNA, CURRENT_STATE/NEXT và cycle plan ghi quyết định/evidence.
Giữ các thay đổi shelf DNA hiện có trong cùng CSS; không coi chúng là scope toolbar.

- `node e2e/scripts/check-mobile-toolbar.cjs`: PASS 390×844, 320×740, 768×1024,
  844×390, 1440×1024. Navbar/active/touch/hit-test, cuối danh sách KPH không bị che,
  popup trong viewport/trên navbar, lookup/reveal focus/state qua route, keyboard,
  account overlay trên navbar, desktop hidden và login exclusion; không lỗi JS/tràn ngang.
- `node e2e/scripts/check-home-scroll-layer.cjs`: PASS 5 viewport, native scrolling,
  layering/focus/account và route reset giữ đúng sau thêm navbar.
- `node .local/home-refinement/check-reference.cjs`: Home layout/3 route/image/keyboard
  regression PASS 5 viewport, decoration không đè lên launcher.
- `npm --workspace @coopfood-kph/store-pwa run check`: PASS.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-app.test.tsx src/store-shelf-life.test.tsx`:
  PASS 25 tests.
- `npm --workspace @coopfood-kph/store-pwa test -- --maxWorkers=2`: PASS 174 tests / 23 files.
  Lần chạy full với workers mặc định: 173 PASS, 1 test session timeout 5s khi song song;
  không tăng timeout hoặc tắt test.
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS TypeScript/Vite/PWA;
  bundle warnings hiện hữu. `npm run check:docs` / `git diff --check`: PASS.
- Đã xem screenshot KPH/utility mobile, landscape và KPH desktop tại
  `.local/mobile-toolbar/`; navbar/labels và layering rõ. Chưa kiểm OS keyboard/safe-area
  trên thiết bị thật. Memory-only mock UI; không mở rộng sang authenticated online shell.

Technical working tree gate không đồng nghĩa candidate commit/owner acceptance.
Bước nhỏ tiếp theo: owner thử navbar và nút “Tra hạn lùi” tại `http://127.0.0.1:5176/#kph`.

## Follow-up Tra hạn lùi — 11/10/2026

Owner yêu cầu popup đè lên hoặc không hiện công cụ phía dưới. Quyết định mới
thay hành vi giữ navigation hiện trong bản đầu: mở quick panel dùng `hidden`
trên cả navbar và nút nổi, CSS `display: none` để loại khỏi vùng bấm/tab/accessibility
tree. DOM và ref vẫn giữ; X/Escape hiện lại công cụ, focus về FAB. Lookup state
và kết quả không reset. Đổi route từ các lối khác vẫn đóng popup như trước.

Mobile đặt panel sát đáy, max-height `100dvh - 24px`, giữ padding safe-area;
desktop đặt đáy 24px, max-height `min(720px, 100dvh - 48px)`. Màn thấp vẫn cuộn
nội bộ để không cắt input/kết quả. Không đổi header/rail/logic tra/API/Figma/Pages.

Files: `store-app.tsx`, `store-app.css`, `store-app.test.tsx`,
`e2e/scripts/check-mobile-toolbar.cjs`, `check-shelf-auto.cjs`, Visual DNA và ghi chú này.
Targeted tests session/shelf PASS 25; Store build/TypeScript PASS;
toolbar Playwright PASS 5 viewport nêu trên (ẩn/reveal/hit/keyboard/state/focus,
popup trong viewport, route/active nav sau đóng); auto lookup PASS mobile/desktop.
Screenshot ở `.local/mobile-toolbar/`; mock/headless, chưa thiết bị thật.
Không merge/deploy. Preview 5175 đã cập nhật; bước nhỏ tiếp theo là mở tiện ích
từ KPH/DATE để owner xem khoảng đáy mới.
