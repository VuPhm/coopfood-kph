# ADR0008 — DATE bền vững và xử lý từng phần

Status: Proposed — 17/11/2026. Quyết định nghiệp vụ A/B/C đã được owner chốt;
ADR/public wire là candidate, chưa có implementation DATE hoặc migration mới.

## Bối cảnh

DATE Fresh là prototype memory-only, không có quantity/version/audit; model
liên kết một KPH rồi resolve. Owner17/11 chọn lượng đang theo dõi (không tồn kho),
xử lý từng phần, lịch chung cửa hàng và chỉ quản lý được sửa/hẹn. Một link/boolean
không thể giữ lượng còn lại hoặc ngăn hai request xử lý vượt lượng.

## Quyết định đề xuất

- Theo [DATE contract](../product/DATE_DURABLE_CONTRACT.md): module DATE trong
  modular monolith/PostgreSQL hiện tại, entry có optimistic version và nhiều
  processing link tới KPH. Tổng xử lý/remaining do backend quyết định.
- Endpoint DATE-scoped tạo KPH tái dùng policy/domain/media KPH; một DB transaction
  khóa source, ghi KPH/link/remaining/version/audit. Idempotency replay trước
  stale-version check; receipt cũ không giả remaining hiện tại.
- Capability DATE explicit. NV xem/tạo/process khi có KPH_CREATE; chỉ quản lý
  đúng store/region/chain sửa/hẹn. Revoke/inactive có hiệu lực request kế tiếp.
  Không sửa policy P01/KPH ngầm hoặc nâng ADR0007 Proposed thành Accepted.
- Reminder chung lưu LocalDate, due tính theo ngày HCM khi đọc/resume. Không cần
  queue/cron/Redis để biết đã tới ngày; push/unread và report snapshot tách riêng.

## Trade-off và hệ quả

- Thêm processing history và version thay single kphRecordId, nhưng giữ được
  nhiều lần xử lý, decimal và audit/concurrency. Client không tự trừ lượng.
- DB/file compensation không phải distributed transaction; giữ private-media
  rollback và không phát success trước commit. Response mất vẫn retry cùng key.
- Khoá ngắn trên một entry có thể trả409 khi hai người xử lý cùng version; UI
  reload lượng còn lại trước retry. Không retry mutation tự động bằng key mới.
- Không có tồn kho/ledger hoặc hoàn lượng theo KPH REJECTED. Thay đổi các nghiệp
  vụ đó cần contract/audit mới, không tự cộng remaining trong review flow.

## Xem xét lại khi

Cần ledger/tồn kho, xử lý nhiều entry trong một KPH, hoàn lượng/undo, nhiều unit
quy đổi, notification delivery/push, workload/retention có số đo hoặc quantity
không còn chỉ là phần hàng được theo dõi thủ công.
