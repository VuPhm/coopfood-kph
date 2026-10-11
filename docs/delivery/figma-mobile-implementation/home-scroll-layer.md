# Home: khối trắng cuộn trên nền xanh

Ngày 11/10/2026. Owner: “ổn, xây dụng cơ chế này, làm với home trước:
hộp trắng nằm ở lớp bên trên và trượt trên nền xanh khi cuộn trang”.
“Ổn” ghi nhận acceptance tài khoản/login của revision 7; cơ chế Home mới
technical PASS, chờ owner visual acceptance. Revision 8 tiếp tục cùng nhánh
`store-app/figma-mobile-implementation`, worktree `/Users/vup/Documents/coopfood-kph`,
writer `/root`; không commit/merge/deploy.

## Kết quả

Header xanh sticky ở lớp dưới. Khối trắng có z-index cao hơn, bo góc 25px,
shadow nhẹ và chiều cao tối thiểu một viewport: cuộn lên che dần header,
cuộn về đầu hiện lời chào lại. Ảnh/slogan/sóng đi cùng khối trắng. Dùng cuộn
trang tự nhiên, không tạo scroll container lồng hoặc animation theo listener.
Giữ vị trí ba nút lúc bắt đầu; ảnh chân trang xuất hiện đầy đủ khi cuộn lên.
Khi focus quay lại nút logo/tài khoản đang bị che, trang về đầu để nút hiện rõ.

File: `apps/store-pwa/src/store-app.css` (Home-only sticky/layer/height/shadow),
`store-app.tsx` (reveal header khi focus), `e2e/scripts/check-home-scroll-layer.cjs`
(browser gate), Visual DNA/CURRENT_STATE/NEXT và cycle plan (evidence/acceptance).
Các trang nghiệp vụ tiếp tục kiểu cuộn hiện có.

## Kiểm tra

- `node e2e/scripts/check-home-scroll-layer.cjs`: PASS 390×844, 1440×1024,
  320×740, 768×1024, 844×390. Wheel scroll thật, header không dịch chuyển,
  khối trắng di chuyển đúng scrollY và nhận hit-test ở vùng chồng, scroll về đầu,
  focus tài khoản/Escape/skip link, đổi route rồi Home reset, không tràn ngang/lỗi JS.
- `node .local/home-refinement/check-reference.cjs`: Home regression 5 viewport
  với 3 nút/route, account, keyboard, ảnh alpha, layout/decoration và Home-only logo.
- `npm --workspace @coopfood-kph/store-pwa run check`: PASS.
- `npm --workspace @coopfood-kph/store-pwa run test -- src/store-app.test.tsx src/store-login.test.tsx`:
  PASS 6 tests.
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS; cảnh báo bundle hiện hữu.
- `npm run check:docs` và `git diff --check`: PASS.
- Đã xem screenshot initial/midway/raised mobile và raised desktop;
  evidence tại `.local/home-scroll-layer/`. Kiểm browser headless, chưa thiết bị thật.

Giới hạn: gate technical theo SHA vẫn pending vì code chưa commit; các lệnh
trên xác minh working tree. Không chạy lại toàn bộ verify 216 tests cho thay đổi
CSS/focus nhỏ này; kết quả full verify tài khoản/login giữ trong report revision 7.
Bước nhỏ tiếp theo: owner cuộn Home ở `http://127.0.0.1:5176/#home` để xem cơ chế.
