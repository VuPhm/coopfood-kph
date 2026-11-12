# ADMIN02 — header/sidebar và logo chính thức, 12/11/2026

Owner yêu cầu tối ưu điểm giao header/sidebar Admin, sau đó đồng bộ phong cách
sang Store desktop. Ưu tiên token Store mobile → Admin desktop → phần còn lại.
Owner xác nhận worktree ADMIN02, yêu cầu bỏ hộp xanh quanh logo desktop và cung
cấp hai logo chính thức không slogan. Slogan bổ sung sau.

Giữ nhánh `store-app/admin02-fresh-dashboard`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/admin02-fresh-dashboard`,
base trước vòng này `b6c4eb38dd19d5532ffb9cd5fe1fca1368e146a3`;
Codex `/root` là writer duy nhất. Resume revision9; revision10 ghi thêm authority
logo của owner. Chưa nghiệm thu UI mới, không tích hợp vào main hoặc deploy.

## Kết quả

- Sidebar Admin sát cạnh màn hình; vùng thương hiệu và header chung baseline72px,
  rail248px, collapsed80px. Bỏ card tổ chức lặp với vai trò trong menu tài khoản.
  Nav nghỉ dùng màu muted, chọn dùng Fresh xanh; giữ tên accessible và thu/mở.
- Store desktop từ900px dùng cùng nền trắng, edge, gutter32px, font, bo góc,
  màu và gradient selected của Admin/Fresh. Logo chỉ ở sidebar; Home header
  hiển thị tên trang. Vùng tác vụ xanh và semantics theo feature giữ nguyên.
- Mobile Store giữ presentation; thay artwork logo theo yêu cầu owner. Bản dark
  không slogan nằm trên header xanh; bản light trên desktop trắng và login Admin.
  Không recolor, filter hoặc bóp tỷ lệ logo. Admin collapsed vẫn có wordmark.
- Original assets được copy nguyên byte: Store có light/dark, Admin có light;
  nguồn `/Users/vup/Documents/cf/light-vector.png` và `dark-vector.png`,598×246.
  Logo có slogan cũ vẫn giữ trong repository cho provenance/consumer cũ; không
  đổi export, Pilot hoặc backend. Không có asset tải từ web trong candidate.

## File thay đổi

- `packages/ui/src/fresh-tokens.css`: Fresh desktop geometry/chrome/nav roles;
  giá trị palette/mobile foundations giữ nguyên.
- `apps/admin-web/src/admin-shell.tsx`, `admin-fresh.css`,
  `admin-fresh-material.css`, `app.tsx`: shell, nav, brand và login logo.
- `apps/store-pwa/src/store-desktop-chrome.css`, `store-app-frame.tsx`,
  `store-navigation.tsx`, `store-material.css`, `store-app-header.tsx`,
  `store-header.css`: desktop bindings, alias selected navigation và logo.
- `apps/{admin-web,store-pwa}/public/brand/coopfood-logo-light.png`,
  `apps/store-pwa/public/brand/coopfood-logo-dark.png`: original owner assets.
- `e2e/scripts/check-desktop-chrome.cjs`, `check-store-page-kit.cjs`: UI checks.
- `docs/product/STORE_APP_UI_DNA.md` và hồ sơ ADMIN02: authority/scope/evidence.

## Kiểm chứng kỹ thuật

- `npm --workspace @coopfood-kph/admin-web run build`: PASS TypeScript/Vite.
- `VITE_STORE_APP_MOCK=true npm --workspace @coopfood-kph/store-pwa run build`:
  PASS TypeScript/Vite/PWA. Cảnh báo ExcelJS chunk>500kB giữ nguyên.
- `VITEST_MAX_WORKERS=1 npm --workspace @coopfood-kph/admin-web test`:
  PASS19tests; chạy lại sau thay logo Admin.
- `npm --workspace @coopfood-kph/store-pwa run check` và
  `VITEST_MAX_WORKERS=1 npm --workspace @coopfood-kph/store-pwa test`:
  PASS294tests trên logic không đổi; bước thay logo tiếp theo được kiểm bằng
  TypeScript/build/browser. Không tuyên bố đây là một lượt fullverify mới.
- `npm --workspace @coopfood-kph/ui run check` và
  `VITEST_MAX_WORKERS=1 npm --workspace @coopfood-kph/ui test`: PASS16tests.
- `node e2e/scripts/check-desktop-chrome.cjs`: PASS Admin fixture tại
  1440/1280/1024/900/834/390px, Store7routes tại1440/900/390px. Kiểm junction,
  collapsed/expanded, navigation, portal/account/password, opaque menu,
  focus-return, logo source/background, actual desktop nav paint equality,
  không page overflow/pageerror. Screenshot được xem trực tiếp.
- Mobile Home/KPH390px: computed-style baseline trước sửa bằng nhau, ngoại trừ
  artwork/tỷ lệ logo được owner yêu cầu thay và DOM sidebar desktop đang ẩn.
- `STORE_PREVIEW_URL=http://127.0.0.1:4176 node e2e/scripts/check-store-page-kit.cjs`:
  PASS7routes×7viewports390/1440/1920/2560/320/768/844landscape, geometry,
  contrast, scroll/focus, report navigation, account và login preview. Kỳ vọng
  gradient cũ115° được sửa thành baseline120° vốn đã có trong `store-header.css`
  trước revision9. Home desktop chỉ có account trong header sau khi chuyển logo
  sang sidebar; test giữ scroll cho account, về đầu trang cho navigation.
- `npm run check:docs`, `git diff --check`: PASS.

Ảnh/log nằm ở `.local/verification/chrome-r9/` (baseline và revision10 cuối),
Store page-kit ở `.local/store-page-kit/`; không commit screenshot/log.

## Dùng thử và giới hạn

Store mock preview `http://127.0.0.1:4176/#home`; Admin source preview
`http://127.0.0.1:4175/#overview`. Vite strictPort, không thay cấu hình runtime.
Admin cần backend8081 để đăng nhập; backend không chạy trong vòng UI này.
Playwright Admin dùng route fixtures, không phải evidence backend thật hoặc
cross-region authorization. Store Fresh vẫn mock; chưa kiểm thiết bị thật.

Bước nhỏ tiếp: owner xem điểm giao Admin mở/thu sidebar, Store desktop Home/KPH
và logo trên trắng/xanh. Hai gate UI Admin/Store mới chờ quyết định owner.

Candidate implementation `0cc2e963dc3804b9b93a80bd54b73b4ed63a7b71`; metadata checkpoint theo sau chỉ cập nhật hồ sơ. Gate UI owner vẫn pending.
