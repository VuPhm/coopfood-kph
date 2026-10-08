# Hộp kết quả tra hạn lùi theo ảnh tham chiếu

Ngày: 08/10/2026. Follow-up nhỏ của owner; giữ cycle hiện có chờ nghiệm thu.

- Branch: `store-app/figma-mobile-implementation`.
- Worktree: `/Users/vup/Documents/coopfood-kph`; writer: Codex.
- Base SHA: `b1c772f4753ad13db1a7930a484ac7933b73b383`.
- Reference: ảnh owner gửi trong chat; không sửa frame Figma.

## Thay đổi

- `apps/store-pwa/src/store-shelf-life.tsx`: ngày chính có semantics `time`,
  hai số ngày có nhãn, copy “Đã qua hạn lùi x ngày”, badge theo trạng thái,
  nhãn Hôm nay và các ngày biên.
  Tra lại lấy ngày nghiệp vụ tại lúc submit để tránh stale status qua nửa đêm.
- `apps/store-pwa/src/store-app.css`: hộp trắng bo góc theo hệ thống, ngày chính 28px,
  số ngày 18px, nhãn 11–12px; giảm padding và timeline. Ô đã qua hạn lùi dùng
  nền đỏ nhạt, cả nhãn và số ngày màu đỏ; dùng semantic tokens hiện có.
- `apps/store-pwa/src/store-shelf-life.test.tsx`: thêm 12 cases, gồm bốn trạng thái,
  chạm hạn lùi/HSD, dưới 10 ngày, trước NSX, edit/reset và submit qua nửa đêm.
- `e2e/scripts/check-shelf-result.cjs`: gate DOM, interaction và screenshot cho
  11 tình huống tại hai viewport, invalid/reset, chưa biết NSX và hộp tra nhanh.

Mốc timeline chia đều theo ref để nhãn dễ đọc; Hôm nay nội suy theo ngày trong
khoảng giữa hai mốc. Đây là sơ đồ các mốc, không phải trục đo độ dài thời gian.
Dưới 10 ngày gộp Hạn lùi / HSD. Trước NSX hoặc sau HSD neo Hôm nay tại đầu/cuối
và ghi rõ phạm vi. Giữ behavior ngày chính của EXPIRED là HSD; các trạng thái
còn lại dùng hạn lùi. Không thay rule domain/API.

Số 37 ngày / 18 ngày trong reference dùng clock tổng hợp 30/09/2026 để kiểm chứng;
giao diện sử dụng ngày hiện tại tại Việt Nam, không hardcode các số này.

## Kiểm chứng

- `npm run verify`: PASS 205 tests, TypeScript, contract/docs, generated client
  drift và build. Cảnh báo chunk lớn/dynamic import vẫn là baseline.
- `STORE_APP_URL=http://127.0.0.1:5176 node e2e/scripts/check-shelf-result.cjs`:
  PASS headless 390×844 và 1440×1024; bổ sung kiểm tra hộp tra nhanh ở 375px.
  Không chồng nhãn/tràn ngang, không runtime error; kết quả cao dưới 300px,
  kiểm tra ngày chính không vượt 28px và nhãn/số ngày đã qua hạn lùi màu đỏ.
  Timeline trong hộp nhanh
  cuộn tới được. Test bật reduced motion.
- `git diff --check`: PASS.
- Đã xem ảnh kết quả reference, EXPIRED, short-life và hộp nhanh.
- Ảnh cục bộ: `.local/shelf-result/*.png`; log verify tại
  `.local/shelf-result/verify-compact.log`, không commit các artifact này.

## Bàn giao

Preview: <http://127.0.0.1:5176/#shelf>. Bước nhỏ kế tiếp: owner xem hộp kết quả
trên mobile và xác nhận visual. Technical PASS chưa thay visual acceptance.
Preview vẫn dùng mock của Store App; không có API wiring/thiết bị thật mới trong
lượt sửa này. Không merge/push/deploy hoặc Pages cutover.
