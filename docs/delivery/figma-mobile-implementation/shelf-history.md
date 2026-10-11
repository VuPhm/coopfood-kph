# Lịch sử tra lùi hàng — bàn giao

Ngày: 10/10/2026. Technical PASS; owner visual acceptance pending.
Branch `store-app/figma-mobile-implementation`, worktree
`/Users/vup/Documents/coopfood-kph`, base HEAD
`b1c772f4753ad13db1a7930a484ac7933b73b383`. Tiếp nối UI đã nghiệm thu;
giữ các thay đổi đã có trước scope này, chưa commit/merge/deploy.

## Quyết định và tích hợp

- Owner chọn **chỉ ghi ở màn chính, lưu trong phiên**. Hook lịch sử ở StoreApp
  giữ dữ liệu khi đổi route. Popup không có callback ghi và không render lịch sử.
  Không dùng storage/API; reload hoặc remount page bắt đầu danh sách mới.
- Ghi khi tính thành công qua debounce 350ms, picker, đổi mode hoặc submit.
  Input thiếu/lỗi không ghi. Mới nhất trước, tối đa 20 bản ghi trong bộ nhớ.
  Bỏ bản ghi trùng liên tiếp cùng mode/ngày/thời hạn/ngày tính để auto + submit
  không chiếm hai chỗ; lần lặp sau một kết quả khác vẫn được ghi.
- Snapshot chứa mode, ngày hợp lệ, thời hạn ngày/tháng, kết quả và thời điểm tra.
  Ngày `dd/mm/yyyy`, giờ `Asia/Ho_Chi_Minh`. Badge ghi rõ trạng thái **lúc tra**.
  “Tra lại” khôi phục input/mode, hủy debounce đang chờ và tính ngay với ngày
  hiện tại; không dùng trạng thái lịch sử làm kết quả mới. Reset chỉ làm mới form,
  giữ danh sách lịch sử của phiên.
- Desktop từ 1200px: form và result cạnh nhau; lịch sử phía dưới với các cột
  thời gian, NSX, HSD, hạn lùi, trạng thái, Tra lại. Desktop hẹp dùng bố cục xếp
  dọc; mobile dùng thẻ với ba ngày và CTA 44px. Tái sử dụng token/chip/icon hiện
  có. Giới hạn 20 mục, không thêm dependency, polling hoặc animation lịch sử.
- Không thay domain, validation, API, Figma, glow/motion đã nghiệm thu hoặc
  nhánh deployment Pages.

## File và kiểm chứng

- Mới: `apps/store-pwa/src/store-shelf-history.tsx`,
  `store-shelf-history.test.tsx`, `e2e/scripts/check-shelf-history.cjs`.
- Sửa: `store-shelf-life.tsx` (callback sau tính/recall/render), `store-app.tsx`
  (state trong phiên), `store-app.css` (history/responsive), `store-app.test.tsx`.
- `npm run verify`: PASS **214 tests**, TypeScript, docs/contracts, generated API
  và production build. Warning Excel import/chunk lớn đã có từ baseline.
- `node e2e/scripts/check-shelf-history.cjs`: PASS 390×844 / 1440×1024; empty,
  invalid, auto, 20 mục/thứ tự/dedup, Recall mode/ngày/tháng và trạng thái mới,
  Reset, đổi route, popup bị loại khỏi nguồn ghi, reload xóa lịch sử. DOM không
  tràn/clipping; thêm kiểm bố cục 900/1024/1200px. Đã xem screenshot mobile/desktop.
- Ba gate hồi quy `check-shelf-auto.cjs`, `check-shelf-result.cjs`,
  `check-shelf-motion.cjs`: PASS cả 390×844 và 1440×1024.
- Screenshot chỉ dùng dữ liệu tổng hợp, lưu ignored tại `.local/shelf-history/`.

Giới hạn: Chromium headless/mock; chưa kiểm trên thiết bị thật. Danh sách 20 mục
cuộn cùng trang, không thêm vùng cuộn lồng. Bước nhỏ tiếp theo: owner kiểm tra
preview `http://127.0.0.1:5175/#shelf` và bố cục lịch sử desktop.
