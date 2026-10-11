# Sửa bố cục validation tra hạn lùi

Ngày: 09/10/2026. Technical PASS; owner visual acceptance pending.

Branch `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Writer: Codex trong chat sửa UI.
Tiếp tục working tree hiện có; các thay đổi holder/auto-lookup đã có trước lượt này.

Owner yêu cầu sửa lỗi giao diện nhưng chưa chỉ rõ màn/lỗi. Rà soát fixture bằng
Playwright tìm thấy lỗi có thể tái hiện tại `#shelf`: submit ngày trống hoặc HSD
không sau NSX đặt alert vào cột kết quả, đẩy holder xuống cột form trên desktop.
Đã đọc structured context và screenshot Figma `aEDpXtz0IiEkPiVucqjQ3Q`, node
`21:56`; standalone desktop tiếp tục là adaptation đã ghi trong plan r2.

- `apps/store-pwa/src/store-shelf-life.tsx`: chuyển alert vào form sau action row.
  Giữ role alert, copy, validation và tính ngày; hai direct grid children luôn là
  form và result. Không đổi CSS/token/asset/API/backend/Figma.
- `e2e/scripts/check-shelf-result.cjs`: kiểm alert thuộc form; ở desktop đo holder
  x/y/width/height trước/sau validation chênh dưới 1px; mobile result nằm sau form.

Kiểm chứng:

- `npm run verify`: PASS 210 tests, TypeScript, docs/contracts, generated API và
  build. Warning chunk lớn/dynamic import hiện hữu vẫn còn.
- `STORE_APP_URL=http://127.0.0.1:5176 node e2e/scripts/check-shelf-result.cjs`:
  PASS 390×844 / 1440×1024, 11 result scenarios và validation geometry.
- `STORE_APP_URL=http://127.0.0.1:5176 node e2e/scripts/check-shelf-auto.cjs`:
  PASS hai viewport, auto lookup/picker/reopen/reset.
- `git diff --check`: PASS. Đã xem ảnh trước/sau ở
  `.local/ui-fix/invalid-desktop.png` và `validation-after-{390,1440}.png`.

Giới hạn: Chromium headless/mock; lỗi owner ban đầu chưa được chỉ rõ. Không
commit/merge/deploy. Bước nhỏ tiếp theo: owner mở preview
`http://127.0.0.1:5176/#shelf`, submit ngày trống để kiểm tra bố cục; nếu lỗi
đang gặp khác, bổ sung tên màn và biểu hiện để xác định đúng phạm vi.
