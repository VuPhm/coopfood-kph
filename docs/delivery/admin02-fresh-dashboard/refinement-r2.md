# ADMIN02 revision 2 — account menu và trọng số Fresh

Owner feedback: “lỗi phần tuỳ chọn tài khoản; nhìn chung ổn, tích hợp các trọng số như giao diện Fresh hiện tại lên”. Giữ hướng bố cục, không coi phản hồi tích cực là sign-off toàn bộ candidate mới. Scope UI tiếp tục theo brief, không push/merge/deploy.

## Nguyên nhân và thay đổi

Playwright tái hiện menu tài khoản: computed background `rgba(0, 0, 0, 0)`, màu chữ/border black mặc định. Shared Dropdown dùng fallback `--cf-color-*` trong khi Admin chỉ khai `--color-*`; portal không có token surface hợp lệ. Screenshot trước sửa cho thấy chữ menu chồng lên date control. Các browser checks revision1 chỉ kiểm hành vi menu nên không phát hiện lỗi paint này.

Sửa bằng context token đầy đủ ngay trên `.admin-account-menu`, nền trắng đặc, border/focus/hover rõ, icon+text căn trái thay space-between. Không sửa shared component hay auth action. Menu logout giữ tên, semantics và handler, chỉ thêm class tone danger.

Fresh adaptation local tại `apps/admin-web/src/admin-fresh-material.css`, nhập sau base Admin stylesheet:

- Tham chiếu code thật `store-material.css`, `store-button-system.css`, `store-chrome-soft.css` và typography Store.
- Xanh #007a52/#00583d; ink #183b2d, muted #52655d; weight body400/label500/control600/heading650.
- Sidebar selected xanh chuyển sắc nhẹ, primary/secondary/danger/disabled/focus/press có phân cấp Fresh; không dịch bounds khi nhấn.
- Mép16%, highlight và bóng thấp cho KPI/chrome/control; bảng và chart vẫn trắng đặc, không blur hoặc gradient phủ dữ liệu.
- Portal menu và dialog có token/layer riêng, reduced motion/transparency/forced colors vẫn có fallback. Không nhập stylesheet Store hoặc đổi shared package.

## Verification revision 2

Candidate `6b818ba2ca6126a4c0cd051d823b5d59e36977c7`. Evidence gắn với content đã build/test trước commit; không đổi implementation khi thêm hồ sơ.

- `npm --workspace @coopfood-kph/admin-web run build`: PASS TypeScript + Vite 1714 modules; JS423.88kB/gzip131.32kB, CSS61.06kB/gzip12.83kB.
- `npm --workspace @coopfood-kph/admin-web test`: PASS 2 files / 19 tests; workflow/session/account tests giữ nguyên.
- `node e2e/scripts/check-admin02-fresh.cjs`: regression scope revision1 + assertions menu mới. PASS cuối: chain thật ở1440×1024/1280×1024/834×1112/390×844; region scope/GET admin-users403; Catalog fixture ở cả4viewport. Không pageerror hoặc page overflow.
- Menu checks mới: computed opaque white `rgb(255, 255, 255)`, border1px, bounds trong viewport, elementFromPoint xác nhận menu phủ control bên dưới; items flex-start; Escape trả focus trigger; ArrowDown mở lại. Chụp account menu ở1440/1280/834/390. Disabled Catalog upload vẫn disabled, opacity1.
- Visual đã xem desktop/mobile account menu và overview sau sửa. Ảnh trước/sau trong `.local/verification/admin02-fresh/` (synthetic, không commit). Kiểm tra có mục tiêu, không pixel snapshot diện rộng.
- Chỉ thay Admin CSS/menu class, E2E script và hồ sơ ADMIN02. Không thay business/API/backend/database/Store/membership/deployment.

Evidence revision1 giữ nguyên làm provenance, không dùng thay cho visual/build gate revision2. Dữ liệu Overview vẫn mock/snapshot cố định; không có realtime thật. Owner acceptance revision2 chưa có. Preview http://127.0.0.1:4175/#overview; tải lại trang để lấy bundle mới.
