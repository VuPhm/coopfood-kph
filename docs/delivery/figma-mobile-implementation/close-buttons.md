# Thống nhất nút đóng — 11/10/2026

Owner đã nghiệm thu phong cách Tra lùi theo Home bằng “ổn”, sau đó yêu cầu
tối ưu nút X của tài khoản và áp dụng toàn hệ thống. Round này chỉ sửa control
đóng, focus và lớp thông báo; không đổi nghiệp vụ, API, Figma hoặc deployment.

## Implementation

- Shared `CloseButton`: vùng bấm thật 44×44px, hình tròn 36×36px, Lucide X
  20px/stroke 1.8, căn giữa. Nền mint/chữ brand cho hộp trắng; nền tối trong suốt
  10%/chữ trắng cho header xanh và màn ảnh/quét mã. Nền tối giữ contrast của nét
  trắng ngay cả ở đầu gradient xanh sáng. Hover/active chỉ chuyển màu 150ms;
  reduced motion tắt transition. Có accessible label, focus, disabled và ref.
- `DialogContent` dùng component này qua Radix Close `asChild`, giữ overlay,
  Escape và callback đóng. `closeTone` chỉ là lựa chọn thị giác của UI primitive.
  Fallback focus ghi lại opener thường khi mở; khi đóng trả focus nếu đang ở
  body và opener còn trong DOM. Callback hoặc focus chủ động của caller được ưu tiên.
- Áp dụng ở tài khoản, popup tra, scanner, viewer, PWA, tiện ích kế thừa và
  prototype. Hộp thoại Admin/Store nhận chung qua primitive. Xóa CSS kích thước,
  nền và pseudo hit area cũ của các nút được thay. Kích thước hit area không còn
  phụ thuộc pseudo-element.
- Tiện ích kế thừa trả focus về toggle sau X/Escape/overlay. Thông báo PWA dùng
  z-index 46, trên tiện ích nổi 45 và dưới modal 50: gate phát hiện nút X trước
  đó bị tiện ích che vùng bấm.

## Files của round này

- `packages/ui/src/close-button.tsx`, `close-button.test.tsx`, `dialog.tsx`,
  `dialog.test.tsx`, `index.ts`.
- `apps/store-pwa/src/store-account-sheet.tsx`, `store-app.tsx`, `store-app.css`,
  `store-shelf-life.css`, `barcode-scanner-dialog.tsx`, `image-viewer.tsx`,
  `pwa-status.tsx`, `utility-panel-meta.tsx`, `expiry-dialog.tsx`, `styles.css`,
  `ui-dna-prototype.tsx`, `ui-dna-prototype.css`.
- `e2e/scripts/check-close-buttons.cjs` và tài liệu này.

Các thay đổi đã có trước round trong Home/login/navigation/Tra lùi và docs
chung được giữ nguyên; danh sách trên chỉ xác định scope của round nút X.

## Verification

- `npm run verify`: docs/contracts/generated API/TypeScript, 221 tests và build
  các workspace PASS. Warning ExcelJS/chunk lớn là hiện trạng trước round.
- `node e2e/scripts/check-close-buttons.cjs`: Store ở 390×844, 1440×1024,
  320×740; Admin và PWA/tiện ích kế thừa ở 390×844, 1440×1024 PASS. Đo DOM
  sau animation: hit 44, circle 36, glyph 20, stroke 1.8, căn giữa/trong viewport.
  Kiểm Enter/Escape, focus về opener, bấm cạnh ngoài circle, dữ liệu popup giữ
  sau đóng/mở, ảnh còn sau đóng viewer và thông báo PWA không bị che.
- `node e2e/scripts/check-shelf-dna.cjs`: 5 viewport PASS (thêm 768×1024,
  1024×768), empty/result/error, history Recall, picker, focus và không tràn ngang.
- Screenshot được xem tại `.local/close-buttons/`; không dùng pixel snapshot.
  Admin dùng contract fixtures và ảnh dùng PNG synthetic; camera chỉ kiểm
  mở/đóng màn, không chứng nhận thiết bị hay khả năng decode thực tế.
- `git diff --check` PASS. Nhánh làm việc `store-app/figma-mobile-implementation`;
  không merge/push/deploy, ref Pages và tag bảo tồn không thay đổi.

Technical PASS; owner chưa nghiệm thu trực quan riêng round nút X. Bước nhỏ
tiếp theo: mở tài khoản và tiện ích Tra trên preview 5175 để xem control cuối.
