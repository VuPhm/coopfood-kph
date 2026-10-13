# Pilot Pages — round 3: vòng đời tài nguyên ảnh

Ngày 13/10/2026, base `0f6ac1b`, branch `codex/github-pages-pwa`.
Người dùng cho phép ship sau khi kiểm tra, cùng các commit Excel editable,
lazy workspace và hai round lịch sử/scanner đang chờ trên branch.

## Điểm nghẽn và phạm vi sửa

- Draft giữ `originalFile` nhưng không có consumer; bỏ tham chiếu này. File gốc
  chỉ cần trong batch xử lý, draft/saving tiếp tục dùng JPEG stamped như ADR-0002.
- Full bitmap hoặc `<img>` Safari được giữ qua các lượt JPEG encode. Giải phóng
  ngay sau khi vẽ xong ảnh/tem vào canvas đã resize; không vẽ lại tem hoặc đổi
  EXIF/date priority, kích thước, quality, byte target hay thứ tự ảnh.
- Xoá backing canvas khi không còn cần sau encode/resize, kể cả khi encode lỗi.
  Thiếu context ở lượt resize trả lỗi thay vì lưu ảnh trống.
- Hydration trước đây tạo URL cho mọi ảnh. URL nay do gallery đang mount sở hữu,
  tạo/thu hồi theo lifecycle; record/Excel giữ Blob gốc đã lưu. Với fixture 1.000
  phiếu × 3 ảnh, round 3 giảm URL ban đầu từ 3.000 xuống 150 (50 desktop gallery;
  mobile compact chưa mount gallery). Con số này đo URL, chưa phải phép đo RAM.
- Không đổi DB/version/codec, API, schema, dependency, worker update policy hoặc
  Pages configuration. Không resize/nén lại ảnh đã lưu; không xoá dữ liệu.

## Kiểm chứng

- Regression trước patch fail đúng 3.000 URL và bitmap chưa close lúc encode.
  Sau patch cover 150→300 URL khi xem thêm, thu hồi khi đổi view/unmount,
  photo replacement/StrictMode, xem đúng ảnh thứ hai, xuất ảnh chưa render,
  Safari `<img>` fallback và cleanup ở các nhánh lỗi canvas/JPEG.
- `npm --workspace @coopfood-kph/store-pwa test`: **236 test / 23 file pass**.
- `npm run build`, Store PWA build với `--base /coopfood-kph/`: pass.
  Warning chunk ExcelJS >500 kB hiện hữu; thư viện vẫn lazy load.
- `npm run check:docs`, `git diff --check`: pass.
- Harness ngoài repo so sánh pipeline baseline/candidate trong browser, store
  stamp tổng hợp `9999`, cùng file/timestamp. Ba output JPEG giống từng byte:

| Input PNG tổng hợp | Output JPEG | Byte output | Byte/time identical |
| --- | --- | ---: | --- |
| 4032×2268 | 1280×720 | 283051 | Có |
| 3024×4032 | 540×720 | 76138 | Có |
| 640×480 | 640×480 | 192846 | Có |

- Production preview riêng `localhost:5186/coopfood-kph/` đã xác minh DOM script
  là `/coopfood-kph/assets/index-EIR3h2o2.js`, đúng build candidate. Origin
  `127.0.0.1:5186` từng trả app cũ trong cache nên không dùng kết quả đó làm
  acceptance. Không xoá cache/record của preview người dùng hoặc Pages.
- Candidate: TPTS barcode `2912345612345` → `1.234 kg`, chọn ba PNG trên,
  xử lý/lưu/reload/mở PIN/xem ảnh thứ hai/xuất Excel đều thành công. Workbook
  tổng hợp có ba JPEG (282997/75386/193277 bytes), sheet không protected,
  F9=`kg`, G9=`1.234`. Chỉ file tổng hợp ngoài repo, không commit ảnh/workbook.

## Giới hạn và rollback

Toàn bộ Blob lịch sử vẫn được hydrate vào bộ nhớ. URL lifecycle và decoder/canvas
cleanup giảm tài nguyên giữ thừa; chưa thay kiến trúc đọc ảnh theo nhu cầu hoặc
chứng minh hết lag trên iPhone thực. Bước nhỏ tiếp theo: thử thêm/quét liên tục
với ảnh thực trên thiết bị đã báo lỗi, kiểm lưu/mở lại/xuất khi ngoại tuyến.

Round này không đổi dữ liệu đã lưu; có thể revert riêng tối ưu tài nguyên nếu cần.
Giữ codec đọc Blob/ArrayBuffer của `cd55154` khi rollback sau khi có byte records.
Không rollback bằng reset DB hoặc quay về reader chỉ hiểu Blob trước codec đó.
