# KPH multipart: original và ảnh đóng dấu ở frontend

Ngày30/10/2026, theo yêu cầu owner cho phép xử lý đóng dấu tại frontend.
Ví dụ dùng ảnh tổng hợp; không đưa ảnh vận hành vào repository.

`POST /api/v1/stores/{storeId}/kph` giữ session, CSRF và Idempotency-Key.
Các part theo ordinal:

| Part | Content-Type | Nội dung |
| --- | --- | --- |
| payload | application/json | [payload tổng hợp](kph-create.json) |
| photos | image/png hoặc image/jpeg | File gốc thứ1, bytes nguyên vẹn |
| photos | image/png hoặc image/jpeg | File gốc thứ2, bytes nguyên vẹn |
| stampedPhotos | image/jpeg | JPEG đã đóng dấu từ file gốc thứ1 |
| stampedPhotos | image/jpeg | JPEG đã đóng dấu từ file gốc thứ2 |

Có1–3 ảnh gốc. Nếu gửi stampedPhotos, số part phải bằng số ảnh gốc, giữ
đúng thứ tự; mỗi bản tối đa1MiB, trong1280×720, không phóng lớn hoặc đổi tỷ lệ
(có dung sai làm tròn3pixel). Backend xác minh MIME thực/kích thước trước lưu,
giữ bytes hai bản private và fingerprint cả hai cho idempotency.
Không gửi stampedPhotos thì server xử lý đóng dấu như trước.
MIME khai báo, barcode và mọi metadata phía client không tạo quyền store.

Khi đổi bytes original hoặc stamped với cùng key đã dùng, trả409.
Sai số cặp trả422/STAMPED_PHOTO_COUNT_INVALID; ảnh không hợp lệ hoặc vượt giới
hạn trả422, không để lại file/bản ghi dở. Audit time vẫn là server time;
EXIF gốc vẫn ưu tiên cho capturedAt. Bản stamped phía client không là chứng
thực mật mã cho thời gian/nội dung ảnh.
