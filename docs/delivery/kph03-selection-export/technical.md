# KPH03 — căn đơn vị, chọn phiếu và xuất Excel

Ngày 30/10/2026. Technical PASS; owner visual acceptance pending.
Preview: <http://127.0.0.1:4392/#kph>.

- Nhánh `store-app/kph03-selection-export`, worktree
  `/Users/vup/.codex/worktrees/kph03-selection-export/coopfood-kph`.
- Base `a8d187a5f2d8c8600581f7ef9fd6650cd327d5f2` từ candidate DATE04 r2,
  không suy nghiệm thu DATE04/NOTIF01 từ yêu cầu KPH mới này.
- Runtime candidate `117b6baac45ca67954b7d857bc3b83f085022f36`.
  Root là writer duy nhất; không có agent phụ. Chưa merge/push/deploy.

## Thay đổi

Đơn vị trước cao52px trong khi ô số lượng44px, lệch đáy8px. Dùng44px cho
cả hai ở mobile/desktop, giữ hit area44px; lỗi số lượng nằm riêng dưới ô,
không kéo nhóm đơn vị xuống. Skeleton dùng cùng chiều cao với form thật,
loại bỏ dịch chuyển32px ở phần Hàng hóa lúc tải xong trên mobile.

Thanh chọn có hàng chọn tất cả/số đã chọn và hàng phạm vi/nút Excel.
Checkbox toàn bộ và đầu bảng có trạng thái native indeterminate khi chọn
một phần; chỉ chọn phiếu đã tải, nối thêm giữ lựa chọn. Gỡ recipe batch cũ
để chỉ còn một owner CSS. Màn hẹp/chữ lớn tự wrap, không ép chiều cao.

Hộp xuất giữ shared StoreSheet xanh: loại phiếu, cửa hàng, số đã chọn,
số đưa vào file/số bỏ qua; không có phiếu đã duyệt thì giải thích và khóa tải.
Nội dung cuộn riêng, header/close/footer giữ trong viewport. Các hàng tóm tắt
không bị co/cắt ở chữ200%. Quay lại giữ lựa chọn; tải thật giữ workbook hiện có.

Nhãn dùng “TP khô & khác” / “Tạo Khô & Khác”, nút loại tươi sống dùng
“Tạo Tươi sống”; shared CTA áp cả live/loading và lối vào DATE→KPH.
Online shell cũng bỏ acronym trong nhãn hiển thị/accessibility.
Tên file mẫu dùng `KPH-MAU-Kho-Khac.xlsx` / `KPH-MAU-Tuoi-Song.xlsx`.
Enum/domain/API vẫn giữ `TPCN`/`TPTS`.

## File đã đổi

Trong `apps/store-pwa/src/`:

- `store-kph-create-forms.css`: chiều cao đơn vị/skeleton, bỏ recipe52px cũ.
- `store-kph-create-button.tsx`, `store-app-shell.tsx`: nhãn tạo/accessible.
- `store-kph-workspace.tsx`: thanh chọn, trạng thái mixed, hộp xuất/tên file.
- `store-kph-list.tsx`: checkbox đầu bảng thể hiện mixed.
- `store-kph-selection.css`: recipe riêng cho chọn/xuất và vùng cuộn/footer.
- `store-kph-fresh.css`: gỡ các override batch cũ.
- `store-kph-workspace.test.tsx`: regression chọn một phần/phiếu chưa duyệt.
- `store-screen-layout.test.tsx`: xác nhận nhãn mới.

`e2e/scripts/check-kph-selection-export.cjs`: regression geometry/interaction,
workbook tải thật và chữ lớn; dùng dữ liệu tổng hợp có sẵn.

## Kiểm tra

Tại worktree trên:

```sh
npm run check --workspace @coopfood-kph/store-pwa
npm run test --workspace @coopfood-kph/store-pwa -- --maxWorkers=2
VITE_STORE_APP_MOCK=false npm run build --workspace @coopfood-kph/store-pwa
VITE_STORE_APP_MOCK=true npm run build --workspace @coopfood-kph/store-pwa
STORE_PREVIEW_URL=http://127.0.0.1:4392 STORE_KPH_OUTPUT=/tmp/kph03-selection-export node e2e/scripts/check-kph-selection-export.cjs
STORE_PREVIEW_URL=http://127.0.0.1:4392 STORE_CREATE_OUTPUT=/tmp/kph03-create-panel node e2e/scripts/check-kph-create-panel.cjs
npm run check:docs
git diff --check
```

TypeScript PASS;43files/302tests PASS. Build online92/mock122precache PASS;
ExcelJS vẫn có cảnh báo chunk lớn đã có trước. Không thêm dependency.

Playwright selection/export PASS390×844,1440×1024,320×740,844×390:
đơn vị44px/hit44 và delta0 cả trạng thái thường/lỗi, đổi đơn vị thật,
chọn một phần/tất cả/nối thêm, chặn tải chỉ có phiếu chưa duyệt. Workbook
đọc lại bằng ExcelJS chứa đúng1phiếu đã chọn, SKU `0011730` giữ số0 đầu.
Chữ200%, header/close/footer, không tràn ngang hoặc cắt hàng tóm tắt đều đạt.
[Results](selection-results.json). PNG tại `/tmp/kph03-selection-export`.

Cold form gate PASS390/1440/320 × motion thường/reduce, CPU6x:
portal/overlay ổn định, một animation, geometry skeleton/ready≤1px,
scroll/draft/ảnh/xem lại/resize/hủy/gửi/focus đạt.
[Results](create-panel-results.json). PNG tại `/tmp/kph03-create-panel`.
Một lần chạy song song với gate xuất có đo resize tức thời sai viewport;
chạy lại độc lập đạt đủ6ca, giữ nguyên assertion. Đây là kiểm tra lab,
chưa xác nhận thiết bị thật. Đã xem trực tiếp ảnh mobile/desktop/chữ lớn.

## Giới hạn và bước tiếp

Chọn/xuất Store Fresh vẫn là dữ liệu mẫu trong phiên; backend/quyền/phân trang
online, layout workbook/ảnh và rule nghiệp vụ không đổi. Không thêm API,
persistence hoặc Excel nhập hàng. Prototype UI DNA cũ không nằm trong scope.
Bước nhỏ tiếp: owner mở preview4392, thử đơn vị EA/kg, Chọn và Xuất Excel để
nghiệm thu hình ảnh. Technical PASS không thay owner acceptance.
