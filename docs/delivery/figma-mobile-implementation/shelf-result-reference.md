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

Follow-up 11/10/2026 theo owner: mốc timeline gần tỷ lệ ngày hơn, dồn Cảnh báo
và Hạn lùi sang phải vừa phải thay cho chia đều. Cảnh báo tối đa 56%, Hạn lùi
tối đa 78%, khoảng giữa hai mốc tối thiểu 22% để đủ chỗ ghi ngày/nhãn trong
popup. Hôm nay nội suy theo ngày giữa các vị trí đã chỉnh, vẫn khớp khi chạm
Cảnh báo/Hạn lùi. Đây là sơ đồ gần tỷ lệ thời gian, có bù khoảng đọc chữ.
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

## Kiểm chứng follow-up 11/10/2026

- `store-shelf-life.tsx`: chỉ sửa vị trí hiển thị/interpolation timeline.
- `store-app.test.tsx`: cố định clock tổng hợp 06/10/2026 và phục hồi sau test;
  test quick panel trước đây phụ thuộc ngày thật và thất bại sau HSD 10/10.
- Test liên quan: `npm --workspace @coopfood-kph/store-pwa run test --
  src/store-shelf-life.test.tsx src/store-shelf-history.test.tsx
  src/store-app.test.tsx` PASS **28 tests**.
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS TypeScript/build;
  warning Excel import/chunk hiện hữu.
- `node e2e/scripts/check-shelf-result.cjs`: PASS **12 tình huống** ở 390×844 /
  1440×1024, thêm rounding 13 ngày và popup 375px; không chồng nhãn/ngày, Hôm
  nay khớp các mốc. `check-shelf-auto.cjs` PASS cả hai viewport, popup vẫn vừa.
- Đã xem screenshot reference mobile, popup desktop và popup rounding nhỏ.
  Preview đã khởi động lại ở <http://127.0.0.1:5175/#shelf>. Chưa kiểm thiết bị
  thật hoặc có owner visual acceptance cho thay đổi này; không merge/deploy.

Follow-up nhãn Hôm nay cùng ngày: bỏ ngưỡng căn start/end tại 20%/80% và offset
10px. Nhãn căn giữa chấm mốc; CSS `clamp` + container units chỉ đẩy nhãn vào
trong khi thiếu chỗ ở lề, theo đúng chiều rộng chữ/track. Giữ nguyên chấm và
vạch tại ngày thực, không JS đo kích thước/ResizeObserver. File sửa:
`store-shelf-life.tsx`, `store-app.css`, `check-shelf-result.cjs`.
Build PASS; gate result PASS 12 tình huống mỗi viewport, thêm 13 vị trí Hôm nay
từ trước NSX đến sau HSD và resize popup 375px ↔ viewport ban đầu. Kiểm DOM xác
nhận nhãn căn giữa hoặc sát biên khi cần, nằm trong track và vẫn phủ chấm mốc.
Đã xem ảnh ở giữa/hai biên; chưa kiểm thiết bị thật.
