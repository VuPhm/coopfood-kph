# DATEON03 · Xử lý từng phần DATE qua KPH

Base DATEON02 `86c00f8`. [Quyết định nghiệp vụ](../product/DATE_DURABLE_CONTRACT.md).
Từ lô theo dõi 1.25025 kg, nhân viên tạo KPH có ảnh cho 0.37525 kg. Lô còn
0.875 kg và giữ mốc DATE. Lần xử lý tiếp đủ 0.875 kg ẩn lô khỏi danh sách
đang mở. Hai phiếu đều bắt đầu ở Chờ duyệt. Lô giữ hai liên kết và snapshot.

POST `/api/v1/stores/{storeId}/date-lots/{lotId}/kph` dùng multipart `payload`
(JSON) và `photos` như KPH, CSRF và `Idempotency-Key`. `payload` gồm
`expectedVersion` và `kph`. `kph` có type, detectedDate, processedDate tùy chọn,
quantity dạng chuỗi thập phân, unit, condition/conditionDetail,
resolution/resolutionDetail, note và photoLastModified tùy chọn. Backend dùng
thông tin hàng từ snapshot DATE. Không gửi identity hàng để tránh sửa nguồn
qua form KPH. Response 201 là `DateLotProcessingReceipt` có recordId,
quantity dạng chuỗi, unit, sourceVersion, resultingVersion, remainingAfter
dạng chuỗi, processedAt và actor. Detail lô trả `kphType` nullable và
`processingHistory` gồm các receipt, theo thứ tự xử lý. Discovery thêm PROCESS
cho người có quyền tạo trong store. Reminder thuộc DATEON04.

Backend khóa theo lô và xác minh store/role, trả receipt cũ trước kiểm version
nếu cùng key, payload và ảnh. Chỉ commit KPH, link và lượng còn lại cùng lúc.
Khóa type từ phiếu đầu; lô đã xử lý giữ identity, unit và type khi sửa. Quản lý
chỉ sửa lượng theo dõi còn lớn hơn lượng đã xử lý. Lô resolved chỉ đọc.
Store đọc lại lô sau khi gửi thành công. Lỗi tải lại không biến lần gửi thành lỗi.

Sol sở hữu OpenAPI, fixtures, generated client, tích hợp và browser. Luna
backend sở hữu migration và test quyền, retry, rollback, cạnh tranh. Luna Store
dùng lại màn tạo KPH và trang chi tiết lô. Review một lượt mobile/desktop với
cùng hai lần xử lý và hai cửa hàng tổng hợp.
