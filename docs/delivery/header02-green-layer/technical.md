# HEADER02 — nền xanh và AppHeader, 23/10/2026

**CLOSED23/10/2026:** owner cho phép merge DATE03 và4450982. Đã tích hợp
main local23f6b19, source giữ nguyên; [nghiệm thu/kiểm main](merge-2026-10-23.md).
Các trạng thái pending/chưa merge dưới đây là bản ghi trước nghiệm thu.

Technical PASS; owner acceptance pending. Không merge/push/deploy trong round này.

## Mốc và phạm vi

- Base main `630ec7b06b369e566b3bd5c9326bebed82b22b72`, main vẫn sạch/nguyên mốc.
- Nhánh `store-app/header02-green-layer`, worktree
  `/Users/vup/.codex/worktrees/header02-green-layer/coopfood-kph`.
- Chỉ shared Store chrome:7 màn Home/DATE/KPH/reports/shelf/notifications/login,
  báo cáo con, header portal Store. Không đổi navigation, content card, chart,
  business/API/auth/data hay packages/ui. Mọi placeholder/example đều synthetic.

## Thay đổi và giả định

Theo yêu cầu trực tiếp “tối ưu lại màu và bố cục vùng nền xanh lớp dưới,
headerapp trong tất cả màn”, giữ page kit đã được duyệt và tinh chỉnh nhẹ:

- Một token gradient115deg `#006b4b → #007a52` cho hero và Store modal header.
  Safe area trên cùng dùng base xanh; print trắng. Không đổi brand/status token.
- Giữ72px, control44px/avatar40px; căn giữa cùng tâm dọc; Back/brand góc14px,
  nền trắng8%, viền trắng20%; giữ logo gốc trên nền xanh để chữ trắng rõ.
- Subtitle xanh trắng `#e3f4ed`; store badge nền nhẹ, ellipsis/title đầy đủ.
- Đệm cuối hero8px thống nhất, mobile tăng4px; nắp trắng overlap12px/radius24px,
  bóng mép nhẹ `0 -3px 12px /6%`. Không thêm blur/animation hay runtime listener.
- Nội dung trắng/khối mềm/viền Home giữ nguyên. Không thay palette biểu đồ DATE.

Files chính: `store-header.css` sở hữu token/geometry; frame/login CSS dùng base
safe area; glass/avatar, mobile refinements bỏ spacing override; Header TSX
thêm title cho store badge. Cập nhật recipe FRAME/SURFACE_STYLE. Thêm chrome
browser gate và cập nhật đúng gradient mong đợi ở page-kit/shelf-dna.

## Lệnh kiểm và kết quả

Runtime local macOS/Node, Chromium Playwright headless, production mock build,
service worker blocked trong browser gate. Không dùng pixel snapshot rộng.

```sh
VITEST_MAX_WORKERS=2 npm run verify
# PASS docs,23 contract resources/15 API fixtures, generated API diff, TypeScript
# PASS327 tests: Admin16 + Store274 + API2 + rules19 + UI16; build/PWA PASS

# Trong apps/store-pwa:
VITE_STORE_APP_MOCK=true npm exec vite -- build --outDir ../../.local/header02/build
npm exec vite -- preview --host 127.0.0.1 --port 4283 --strictPort --outDir ../../.local/header02/build
# PASS mock build/PWA; preview4283 chạy đúng worktree/candidate

# Từ root:
STORE_PREVIEW_URL=http://127.0.0.1:4283 node e2e/scripts/check-store-page-kit.cjs
# PASS7routes ×7viewport:390×844,1440×1024,1920×1080,2560×1440,
# 320×740,768×1024,844×390; bar/gutter/overlap/sticky/focus/150%/no overflow
STORE_PREVIEW_URL=http://127.0.0.1:4283 STORE_CHROME_OUTPUT=.local/header02/production-chrome node e2e/scripts/check-store-chrome.cjs
# PASS390/1440/320:7routes, centered controls,8px spacing, contrast,
# no hero blur, modal/composer header parity, print white, no JS errors;
# exact DATE timeline node/pseudo color/bg/border parity against main4279
STORE_PREVIEW_URL=http://127.0.0.1:4283 STORE_DATE_OUTPUT=.local/header02/date-actions node e2e/scripts/check-date-actions.cjs
# PASS390/1440/320: reminder1/7days/due, DATE→TPCN/TPTS/save/cancel/resolved
STORE_APP_URL=http://127.0.0.1:4283 node e2e/scripts/check-shelf-dna.cjs
# PASS390/1440/320/768: main/quick results/errors/history/picker/focus/44px

git diff --check
# PASS; contracts/packages/backend/domain feature code unchanged from630ec7b
```

Local logs/screenshot ignored tại `.local/header02/`; production chrome ảnh cả7màn
và composer ở390/1440/320. Đã nhìn trực tiếp Home mobile và DATE desktop,
đối chiếu ảnh trước/sau Home/KPH/DATE. Print root từng bị cascade frame thắng
khi dev; đã tăng specificity print và production chrome kiểm lại PASS.
Cổng4281 có process khác nên không dùng; evidence cuối đều trên4283.
Warning password/int64 schema formats, experimental localStorage, chunk>500kB
là các warning hiện có; không có lỗi test/build. Không mở rộng scope xử lý chúng.

## Owner review và giới hạn

Xem <http://127.0.0.1:4283/#home>, rồi DATE/KPH/Tra hạn/Báo cáo/Thông báo và
đăng nhập. Mong đợi nền xanh dịu thống nhất, hàng header cùng anchor, nắp trắng
rõ lớp, không lấn nội dung; mở chi tiết DATE/tài khoản/form KPH thấy cùng xanh.
Màu chart vẫn như main. Đây là kỹ thuật đạt, chưa phải owner đã nghiệm thu.

Chưa kiểm thiết bị iOS thật/notch hardware; safe area qua CSS env, không giả lập
quyền/phần cứng. Không tuyên bố benchmark tốc độ: chỉ không thêm blur/runtime.
DATE reminder/KPH vẫn prototype memory-only như baseline. Bước nhỏ tiếp theo:
owner nhận xét nền/header tại preview; sau khi được cho phép mới tích hợp main.
