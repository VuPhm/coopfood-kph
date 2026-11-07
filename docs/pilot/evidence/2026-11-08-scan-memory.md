# Pilot — scan tự điền và tên dự phòng cùng SKU

Nhánh/worktree tiếp tục `store-app/pilot-sku-reuse` tại
`/Users/vup/Documents/coopfood-kph/.local/worktrees/pilot-sku-reuse`.
Base source9f07dd3, artifact719a790; root sole writer. Owner cho phép push sau
kiểm tra và một vòng kiểm lại. Main/ADR/schema/API/dependency không đổi.

## Hành vi và phạm vi

- Scanner dùng đúng toàn bộ mã + loại thực phẩm để lấy tên/NCC của phiếu hợp
  lệ mới nhất theo createdAt; không suy từ prefix barcode cân. Vẫn loại trash/
  rejected và giữ string/leading zero/tie legacy như trước.
- Exact-SKU dropdown có tối đa8 tên khác nhau mới nhất; cùng tên chỉ lấy NCC
  mới nhất. Chọn fallback chỉ thay metadata, không đổi quantity/unit/condition/
  resolution/date/note/photo. Không làm thay đổi phiếu nguồn.
- Auto-fill scanner không mở danh sách; click lại input hoặc phím↓ mở fallback.
  Guard focus tự trả về từ dialog scanner tránh mở dropdown ngoài ý muốn.
- Nhập tay vẫn chọn đề xuất explicit. Không thêm persistence/migration; chỉ mục
  latest+variants được tạo từ metadata lịch sử bằng useMemo hiện có, không đọc ảnh.

Files: sku-memory.ts, create-record-dialog.tsx và ba test memory/form/app;
script `scripts/check-pilot-scan-memory.cjs` dùng camera/decoder giả trong
browser context local cô lập, không dùng camera hoặc dữ liệu vận hành thật.

## Rủi ro và hiệu năng

Tự điền theo lịch sử local có thể lấy tên nhập sai mới nhất; fallback giữ tên cũ
để người nhập sửa, không khẳng định đây là catalog authoritative. Bỏ trống ở
snapshot mới nhất không được ghép ngầm với thông tin cũ. Nếu quá8 tên, list chỉ
hiện8 tên mới nhất. Scanner cân vẫn áp dụng quy tắc trọng lượng hiện có khi quét;
chọn fallback của cùng mã không trích lại trọng lượng.

Node24 lab,10000 phiếu/5000SKU/2tên mỗi SKU,25 mẫu sau warmup:
- build median7.31→12.87ms (+5.56ms khi lịch sử thay đổi, không mỗi keystroke).
- exact suggestion3.70→0.0023ms nhờ lookup index thay quét cả danh sách.
-10000 latest get0.342→0.321ms.
- retained heap xấp xỉ585→1326KiB (GC, không tính lịch sử/ảnh), tăng~741KiB.
Không có field INP/iPhone đo thật; không suy số đo desktop thành đảm bảo thiết bị.

## Kiểm tra và vòng review thứ hai

- Docs/API drift/typecheck, tests các workspace và build/PWA.
- Store tests chạy `--maxWorkers=2`; các helper chọn option đầu được cập nhật
  để kiểm latest trong danh sách nhiều tên, không bỏ assertion/test/timeout.
- Browser390×844/1440×1024: native camera+BarcodeDetector giả lập đầy đủ5
  định dạng; auto newest/supplier mới nhất, refocus fallback dedup tên,
  lượng7,5EA/tình trạng/biện pháp khác giữ nguyên, unknown full barcode không suy.
- Gate dropdown/copy/image/save/reload/hit-test cũ đạt cả390×400.
- Vòng hai đọc diff và kiểm độc lập đã bắt việc focus trả về từ scanner tự mở
  dropdown: thêm guard focus tự động; pointer và keyboard vẫn mở theo yêu cầu.
- `git diff --check`; không có dữ liệu/ảnh thật trong commit.

Phát hành source vào codex/github-pages-pwa, artifact vào gh-pages bằng build
local `--base /coopfood-kph/` + .nojekyll, giữ nguyên URL/IndexedDB origin.
Đối chiếu remote trước push, không force; rollback artifact719a790 bằng revert
commit mới nếu cần. Không đổi main/tag preserve.

Kết quả cuối: PASS369 tests (Store340 + các package29), docs/API drift/types,
root build và Pages-base build/PWA. Native scan gate PASS390×844/1440×1024;
gate dropdown/copy cũ PASS ba viewport. Đã xem screenshot fallback390px:
Tên mới/Tên cũ của cùng mã, lượng7,5EA giữ nguyên. Không thêm dependency,
CSS/palette/API/schema. Cảnh báo chunk Excel có sẵn giữ nguyên.
