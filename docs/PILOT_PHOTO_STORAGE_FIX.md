# Pilot: lỗi lưu ảnh Blob trên iOS

Base Pages: `2f72d0a` (2026-10-13). Screenshot báo
`Error preparing Blob/File data to be stored in object store` sau khi ảnh đã
được xử lý và hiển thị preview. Đường ghi hiện tại đưa Blob JPEG trực tiếp vào
IndexedDB; cùng lỗi đã được ghi nhận tại
<https://bugs.webkit.org/show_bug.cgi?id=188438>. Chưa tái hiện trên iPhone thật.

## Thay đổi

- Codec nội bộ ghi `photos[].blob` bằng ArrayBuffer, đọc cả Blob cũ và byte mới,
  trả Blob cho UI/xem ảnh/Excel. Giữ nguyên byte JPEG, MIME, tên và thứ tự ảnh.
- Không đổi tên/version DB, object store, index, API, rule KPH hoặc Pages config.
  Không reset DB hay migration hàng loạt; bản ghi cũ chỉ đổi cách lưu ảnh khi ghi lại.
- Đọc byte trước transaction ghi; kiểm tra đủ byte. Transaction cập nhật nhiều
  phiếu/ghi lịch sử export vẫn atomic, giữ metadata mới nhất nếu thao tác đồng thời.
- Đọc lịch sử bằng cursor theo từng phiếu, tránh giữ tất cả ArrayBuffer thô cùng
  lúc với Blob đã dựng lại. Giữ nguyên giới hạn nén và tối đa ba ảnh mỗi phiếu.
- Test mô phỏng IDB từ chối Blob, byte round-trip, dữ liệu cũ/mới, FileReader,
  đọc chậm, quota/rollback và giữ draft để thử lưu lại.

## Giới hạn triển khai

Cần xác nhận lưu 1–3 ảnh, đóng/mở lại, xem ảnh, duyệt/thùng rác và xuất Excel trên
iPhone đã báo lỗi, gồm lịch sử nhiều ảnh. Không coi fake-indexeddb là bằng chứng
đã sửa trên iPhone thật.
Reader trước patch không hiểu ArrayBuffer: nếu rollback sau khi có byte records,
phải giữ codec đọc hai dạng; không rollback về reader cũ hoặc xoá dữ liệu người dùng.

## Kiểm tra local

- Pages base `2f72d0a`: deployment run `37780881081` thành công.
- `npm --workspace @coopfood-kph/store-pwa test`: 206 test / 17 file pass.
- `npm run build`: pass; build Store PWA với `--base /coopfood-kph/`: pass.
- `git diff --check`: pass. Chưa push/deploy patch.
