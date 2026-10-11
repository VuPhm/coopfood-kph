# Đăng nhập: lớp trắng trượt trên nền xanh

Ngày 11/10/2026. Owner: “ap dụng hiệu ứng trượt này cho trang đăng nhập”.
Follow-up Home trên cùng nhánh `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, writer `/root`. Code ở working tree;
không commit/merge/deploy, không đổi auth/API.

## Kết quả và file

`apps/store-pwa/src/store-login.css`: vùng xanh sticky ở lớp dưới, form trắng
relative/z-index 1, bo góc và shadow nhẹ. Mobile form cao tối thiểu một viewport,
chồng 24px và trượt lên che phần nhận diện khi cuộn trang. Desktop giữ hai cột:
nhận diện xanh bên trái đứng yên, form phải bắt đầu thấp hơn 64px và trượt lên.
Không còn overflow hidden ở layout cha khiến sticky bị khóa. Landscape thấp
(dưới 600px, kể cả màn rộng) dùng một cột để form có đủ không gian cuộn.
Không thêm scroll listener, nested scrolling hay animation lặp.

`e2e/scripts/check-login-scroll-layer.cjs`: gate cuộn thực tế, hình học/hit-test,
form/keyboard và screenshot. `STORE_PREVIEW_URL` có thể đổi URL preview.
Visual DNA, CURRENT_STATE/NEXT và cycle plan ghi scope/evidence follow-up.
Component dùng chung nên preview và online đều nhận CSS mới; handlers, credential
semantics, autocomplete, busy/error và gateway giữ nguyên.

## Kiểm tra

- `node e2e/scripts/check-login-scroll-layer.cjs`: PASS 390×844, 1440×1024,
  320×740, 768×1024, 844×390. Wheel scroll, nền không dịch chuyển, lớp trắng
  dịch đúng scrollY/nhận hit-test, keyboard/nhập liệu/reveal/error, không tràn ngang
  hoặc lỗi JS. Viewport mobile giảm còn 390×480 kiểm focus input vẫn trong màn;
  đây là mô phỏng không gian bàn phím, chưa kiểm bàn phím OS thật.
- `node e2e/scripts/check-store-identity.cjs`: PASS 5 viewport, account/login
  route, reveal, preview submit/error, trở lại Home và password reset.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-login.test.tsx src/app.online.identity.test.tsx`:
  PASS 14 tests (credential nguyên Unicode/whitespace, busy, online identity).
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS TypeScript/build;
  cảnh báo chunk/dynamic import hiện hữu.
- `node .local/account-login/check-online.cjs`: PASS 390×844 / 1440×1024,
  API fixture online: một request khi busy, lỗi/retry, giữ input, không bỏ qua auth.
- `npm run check:docs`, `git diff --check`: PASS.
- Đã xem screenshot initial/raised mobile và desktop/tablet tại
  `.local/login-scroll-layer/`. Không chạy backend thật/thiết bị thật trong slice CSS.

Technical PASS trên working tree; owner visual acceptance cơ chế mới còn pending.
Bước nhỏ tiếp theo: cuộn `http://127.0.0.1:5176/#login` để xem hiệu ứng.
