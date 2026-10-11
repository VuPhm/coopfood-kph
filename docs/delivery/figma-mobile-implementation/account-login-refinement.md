# Tài khoản và đăng nhập theo DNA — revision 7

Ngày: 11/10/2026. Technical PASS trên working tree; owner visual acceptance ngày 11/10/2026 qua “ổn”.
Owner: “sửa trình bày của xem tài khoản, rồi sau đó làm trang đăng nhập”.
Tiếp tục nhánh `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, writer `/root`, HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Không commit/merge/deploy.
Không giao agent; reviewed diff trực tiếp trên working tree có các follow-up
Home/shelf sẵn có. HEAD không chứa implementation mới, không coi SHA đó là
candidate đã test. Lượt này ưu tiên hai màn owner vừa yêu cầu, các slice rollout
Tra cứu/DATE/KPH/shelf tiếp tục hoãn theo kế hoạch.

## Kết quả và file

Tài khoản làm trước: hero xanh, avatar và tên, role pill, thẻ mint cho cửa hàng
và mã, nhãn dữ liệu mẫu, CTA Trang chủ và lối xem đăng nhập. Mobile bottom sheet,
desktop dialog giữa màn hình. Chỉ một close control, Escape/focus return về avatar.

Đăng nhập dùng chung cho online và preview: logo/vùng nhận diện xanh, form trắng,
label rõ, autocomplete/password manager/paste, toggle hiện/ẩn password, busy/error
và submit. Desktop dùng hai cột, minh họa thực phẩm nằm ngoài form; mobile gọn
một cột. Chữ nhỏ đặt trên vùng xanh đậm; role pill có nền xanh riêng. Giữ
username trim, password nguyên whitespace/Unicode, gateway/API/CSRF/session cũ.
Không thêm forgot-password, remember-me hay xác thực mới.

| File | Thay đổi |
| --- | --- |
| `apps/store-pwa/src/store-account-sheet.tsx` | Dialog account riêng dùng primitive hiện có, profile/card/CTA/focus return |
| `apps/store-pwa/src/store-app.css` | CSS scoped account; Home và các sheet khác giữ kiểu riêng |
| `apps/store-pwa/src/store-app.tsx` | Tích hợp account, thêm route `#login` preview, giữ state phiên của nghiệp vụ |
| `apps/store-pwa/src/store-login.tsx` / `store-login.css` | Shared login presentation, form state local, mobile/desktop, reused basket asset |
| `apps/store-pwa/src/app.tsx` | Dùng shared login cho online thay panel cũ, header đăng nhập do component mới quản lý; auth mutation giữ nguyên |
| `apps/store-pwa/src/app.online.identity.test.tsx` | Query login heading theo role/tên mới, giữ tất cả assertions về auth/session |
| `apps/store-pwa/src/store-login.test.tsx` | Password whitespace/Unicode, reveal không submit, busy chống duplicate, error giữ input |
| `e2e/scripts/check-store-identity.cjs` | Gate preview tài khoản/login, screenshot và tương tác 5 viewport; `STORE_PREVIEW_URL` tùy chọn |
| `docs/product/STORE_APP_VISUAL_DNA.md` | Cho phép dùng lại decoration trong vùng nhận diện login theo yêu cầu mới; acceptance riêng còn pending |
| `docs/CURRENT_STATE.md`, `docs/NEXT.md`, cycle plan | Scope r7, kết quả và bước nghiệm thu |

## Preview và ranh giới

- Home: `http://127.0.0.1:5176/#home` → avatar → xem tài khoản.
- Đăng nhập: `http://127.0.0.1:5176/#login`, hoặc CTA Xem trang đăng nhập trong account.
- Dev hiện tại là memory-only preview: nút Vào bản dùng thử mở Home; submit login
  báo chưa khả dụng trong bản thử, không gửi credential đến backend và không tạo
  fake authenticated session. Password bị xóa khi rời qua lối preview.
- Online (`VITE_STORE_APP_MOCK=false`, `VITE_KPH_ONLINE=true`) dùng cùng UI và
  gọi gateway login thật đã có; không có lối bỏ qua auth. Kiểm tra browser online
  dùng server riêng port 5180 và route API fixture, không phải nghiệm thu backend thật.
- Account mới là presentation của mock profile; chưa chuyển account online sang
  mock và không bổ sung đổi mật khẩu/đăng xuất giả vào preview.

## Kiểm tra thực tế

- `npm run verify`: PASS 216 tests (Store PWA 174, Admin 14, API 2, rules 19,
  UI 7), docs/fixtures, contract/generated client drift, TypeScript và builds.
  Log `.local/account-login/verify.log`. Chunk/dynamic import warnings hiện hữu.
- Targeted login/session/online: 25 PASS trước integrated run; integrated run
  bao gồm hai test login mới và các gate identity hiện có.
- `node e2e/scripts/check-store-identity.cjs`: PASS 390×844, 1440×1024,
  320×740, 768×1024, 844×390. Account open/Escape/focus, preview navigation,
  autocomplete, reveal/hide, missing input disable, preview submit báo đúng,
  vào Home/return login không giữ password, no overflow/runtime error.
- `node .local/account-login/check-account.cjs`: PASS 390/1440/320, đóng bằng
  close và Escape, focus về avatar, thông tin profile/mã cửa hàng, no panel overflow.
- `node .local/account-login/check-online.cjs`: PASS 390×844/1440×1024 với API
  fixture: login request, form/input disabled khi pending, một request, auth error
  hiển thị và cho retry, không có CTA dùng thử hoặc header trùng ở online.
- `node .local/home-refinement/check-reference.cjs`: Home regression PASS trên
  5 viewport (390, 1440, 320, 768, 1024), giữ layout/route/account/image/keyboard.
- Đã xem screenshot account 390/1440 và login 390/1440/768 + online error 390;
  screenshot tại `.local/account-login/`. Chỉnh preview badge trên desktop và
  gradient dưới chữ nhỏ sau visual review.
- `git diff --check`: PASS.

Không chạy lại real-backend/device test trong lượt presentation này. Owner đã xác nhận hình ảnh tài khoản/login qua “ổn” trong yêu cầu tiếp theo.
Nghiệm thu này không đóng các workflow gate r5 hoặc backend thật. Bước tiếp theo
được owner yêu cầu là cơ chế lớp trắng cuộn trên nền xanh, áp dụng Home trước.
