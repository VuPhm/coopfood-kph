# Pilot Pages — lọc ngày phát hiện

Ngày: 28/10/2026. Technical PASS; chờ owner xem trước khi push/deploy.

## Mốc và phạm vi

- Nhánh `codex/github-pages-pwa`, base `2cb16a9fc84c70403b7ab052a8d058f33ca0c355`.
- Worktree `/Users/vup/.codex/worktrees/pilot-pages-date-filter/coopfood-kph`;
  một writer trong chat hiện tại, không dispatch agent.
- Đây là thay đổi pilot Pages được owner yêu cầu riêng; không tích hợp Store App
  từ main, không đổi IndexedDB/schema, API, dữ liệu lưu hoặc workflow deploy.
- Remote kiểm tra trước bàn giao: `f6b4d57f1df795ba818c06f4b6937d2e1de56292`.
  Đã có ba commit local `0c42b31`, `34f9d28`, `2cb16a9` trước slice này.
- Main vẫn `04f7c4a4d9001901c3973e7e6bbf5a2118932ee7`; tag bảo tồn
  `preserve/github-pages-pwa-2026-09-24-c789714` vẫn trỏ `c789714870eff5912e10fe89361bd845d9e3983d`.

## Hành vi

- Lọc **ngày phát hiện**, gồm cả hai đầu; cho để trống một hoặc cả hai đầu.
  Tái sử dụng CalendarInput và parser `dd/mm/yyyy` hiện có.
- Hôm nay/Hôm qua theo `Asia/Ho_Chi_Minh`, tính lại khi bấm.
  Tuần này từ thứ Hai đến Chủ nhật, kể cả ngày cuối tuần chưa tới.
- Khoảng chưa hợp lệ hiện lỗi, giữ khoảng hợp lệ trước đó. Đóng hộp lọc bỏ
  phần nhập chưa hợp lệ; mở lại hiển thị khoảng đang áp dụng.
- Kết hợp lọc duyệt, loại thực phẩm và active/trash trước khi sắp xếp/chia batch50.
  Đổi khoảng hợp lệ xóa selection và đặt lại batch; chọn tất cả vẫn chọn toàn
  tập phù hợp, kể cả phiếu chưa render. Giữ lọc khi đổi loại thực phẩm;
  chuyển active/trash reset cùng bộ lọc cũ. Tạo mới bỏ lọc ngày nếu phiếu mới
  nằm ngoài khoảng, để phiếu mới được nhìn thấy theo luồng tạo hiện tại.
- Có khoảng đang áp dụng bên ngoài dialog, nút bỏ lọc riêng và empty message
  cho kết quả không phù hợp. Filter mở được ở desktop và mobile.
- Ô ngày tự xuống một cột khi thiếu chỗ/chữ lớn; dialog có thể cuộn.

## File thay đổi

- `apps/store-pwa/src/history-date-filter.ts`, `history-date-controls.tsx`:
  logic khoảng ngày và giao diện tái sử dụng lịch.
- `apps/store-pwa/src/app.tsx`, `styles.css`: tích hợp lọc, selection, batch,
  summary, empty state và responsive.
- `apps/store-pwa/src/history-date-filter.test.ts`, `app.test.tsx`,
  `app-performance.test.tsx`: biên ngày, tổ hợp bộ lọc và nhãn trigger.
- `scripts/check-pilot-date-filter.cjs`: gate browser với dữ liệu tổng hợp,
  context riêng, chặn request ngoài preview và chặn URL không phải loopback.

## Kiểm chứng

- `npm ci --ignore-scripts --no-audit --no-fund`: theo lockfile, không đổi dependency.
- `npm run verify`: PASS docs/fixtures, API drift, TypeScript, **358 tests**
  (Store329/Admin1/API2/rules19/UI7), build Admin/Store và service worker.
- Sau chỉnh CSS chữ lớn, chạy lại
  `npm --workspace @coopfood-kph/store-pwa run build -- --base /coopfood-kph/`:
  PASS; PWA precache16. Warning bundle ExcelJS >500kB vẫn có sẵn.
- Preview:
  `npm --workspace @coopfood-kph/store-pwa exec vite preview -- --host 127.0.0.1 --port 4381 --strictPort --base /coopfood-kph/`.
- Browser command (dùng Playwright1.62 đã cài ở workspace chính, không thêm dependency):
  `PLAYWRIGHT_MODULE=/Users/vup/Documents/coopfood-kph/e2e/node_modules/@playwright/test node scripts/check-pilot-date-filter.cjs`.
- Chromium headless **390×844 và 1440×1024 PASS**: shortcut ở mốc UTC/VN khác ngày,
  hai đầu, lỗi/giữ khoảng cũ, lịch popup, tổ hợp approval, selection ngoài batch,
  reset batch, đổi loại, thùng rác, no overflow, chữ150%, Escape; không pageerror.
  Đã xem screenshot normal/large-text. Browser evidence ở `.local/pilot-date-browser`.
- `git diff --check`: PASS. Không đọc/đổi dữ liệu vận hành thật; browser fixture
  chỉ tồn tại trong context kiểm tra. Chưa kiểm thiết bị iPhone thật.

## Bước nhỏ tiếp theo

Owner xem preview `http://127.0.0.1:4381/coopfood-kph/`, PIN mặc định `0000`
trên origin mới, mở bộ lọc để thử khoảng ngày. Preview này có database riêng,
không có phiếu trên site Pages đang dùng. Chưa coi technical PASS là nghiệm thu.

Chưa push. Push nhánh này tự deploy Pages và sẽ gồm cả ba commit local có sẵn.
Khi thực hiện push, kiểm tra lại remote rồi chỉ fast-forward đúng nhánh,
không force, không đẩy main/tag. Nếu cần quay lại slice lọc ngày sau deploy,
revert commit của slice rồi build/verify và push lại đúng nhánh;
không rewrite lịch sử hoặc di chuyển tag bảo tồn.
