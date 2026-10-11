# Tra lùi hàng — UI đã nghiệm thu

Ngày: 10/10/2026. **Owner ACCEPTED**: “đạt, thu dọn” trong chat tiện ích.
Đóng phạm vi follow-up Tra lùi hàng; không suy ra nghiệm thu toàn cycle Figma.
Branch `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Giữ thay đổi đã có trước task.

## Implementation cuối

- Một section kết quả ổn định; empty có icon/hướng dẫn riêng, invalid có hướng
  dẫn sửa. Không tạo ngày, facts hoặc timeline giả. Vùng dành sẵn 297px ở màn
  tra chính và 260px trong quick panel, không nhảy layout khi có kết quả.
- Quick panel lưu hook ở StoreApp: mode/input/ngày/kết quả giữ trong phiên qua
  đóng/unmount/đổi route. Chỉ Reset xóa dữ liệu; không lưu qua reload.
- Debounce nhập 350ms; chọn picker/đổi mode tính ngay. Edit, submit, Reset và
  cleanup hủy timer cũ; input thiếu/lỗi xóa kết quả cũ ngay. Domain/validation
  và cách biểu diễn trạng thái/ngày/timeline giữ nguyên.
- Nền trắng, hai glow đối xứng: empty xanh nhạt trung tính, SAFE xanh ngọc–lime,
  WARNING vàng–cam, DANGER/invalid đỏ–coral, EXPIRED hồng–tím. Pha màu 16% ở
  empty, 32% ở các state khác. Radius ngang 24px, thu 12px khi focus field hoặc
  date picker mở, không đổi border/padding. Sáu radial gradient và một lớp fade
  trắng giảm màu từ trên xuống trong 120px; không filter blur/mask.
- Góc main/mobile 24px, quick desktop 20px. Thu/nới glow 180ms, đổi màu 200ms.
  Pop hữu hạn khi mở quick panel 240ms/khi có kết quả 200ms: opacity .65→1,
  translateY 5px→0, scale .985→1, cubic-bezier(.22,1.12,.36,1). Không thêm JS
  animation/timer, không animate layout hoặc dùng will-change lâu dài. Hỗ trợ
  reduced-motion; holder không remount.
- Quick panel dùng input/action 44px, gap form 8px, field 4px; result padding
  10px/gap 8px, primary date 24/30px, timeline track 86px. Cả form/kết quả/lỗi
  vừa hộp ở hai viewport nghiệm thu. Scrollbar ẩn; overflow auto là fallback
  khi màn hình thấp, zoom lớn hoặc bàn phím thu hẹp vùng nhìn.

## File và kiểm chứng

Implementation: `store-shelf-life.tsx`, `store-app.tsx`, `calendar-input.tsx`,
`store-app.css`; tests trong `store-shelf-life.test.tsx`, `store-app.test.tsx`.
Chi tiết state/debounce tại [bàn giao tương tác](shelf-auto-interaction.md).
Evidence kết quả/timeline và validation trước task được giữ tại
[shelf-result-reference](shelf-result-reference.md) và
[shelf-validation-layout](shelf-validation-layout.md).

- `npm run verify`: PASS 210 tests, TypeScript, docs/contracts, generated API
  và build sau thay đổi holder/state. Warning Vite chunk/import là hiện hữu.
- `npm --workspace @coopfood-kph/store-pwa run build`: PASS sau CSS/motion cuối.
- `node e2e/scripts/check-shelf-auto.cjs`: PASS 390×844 / 1440×1024; holder,
  debounce/picker/mode, đóng mở, invalid/incomplete, Reset, không cần cuộn,
  focus glow 24↔12px không nhảy layout.
- `node e2e/scripts/check-shelf-result.cjs`: PASS 11 tình huống mỗi viewport,
  nhãn/ngày/timeline/validation, thêm kiểm chiều ngang 375px.
- `node e2e/scripts/check-shelf-motion.cjs`: PASS main/quick hai viewport;
  transition width/color, pop, focus interruption, cùng holder node và
  reduced-motion tắt chuyển động, gồm đóng/mở lại panel.
- Audit local palette/layout của bốn status PASS trước cleanup; đã xem ảnh cuối.
  `git diff --check`: PASS.

## Thu dọn và giới hạn

Đã bỏ các script/ảnh trang trí thử nghiệm cũ trong `.local/shelf-glow`,
`.local/shelf-accent`, `.local/shelf-state`, `.local/shelf-side-glow`,
`.local/shelf-scroll`. Giữ gate hồi quy ở `e2e/scripts/` và ảnh kiểm chứng cuối
trong `.local/shelf-auto`, `.local/shelf-result`, `.local/shelf-motion` (ignored).
Tài liệu này mô tả implementation cuối, thay các ghi chú trang trí đã hủy.

Kiểm bằng Chromium headless/mock, chưa benchmark thiết bị thật. Không sửa
API/domain/backend/Figma. Không commit/merge/push/deploy hoặc mở scope mới.
Pages branch giữ `ef629e77891769e344eb137ed6beb208317492a9`; tag bảo tồn giữ
`c789714870eff5912e10fe89361bd845d9e3983d`. Phạm vi này đã đóng; chờ yêu cầu mới.
