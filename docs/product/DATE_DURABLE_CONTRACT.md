# DATE bền vững — DATEON01

Ngày17/11/2026. **A/B/C đã được owner chốt; wire/ADR dưới đây là proposal để
triển khai slice, chưa có API/schema/runtime DATE.** Base `82b01b3` gồm KPH UI
revision2 `fdcfd2f` được owner cho “đủ để tiếp”. Nhánh
`store-app/dateon01-durable-contract`, một writer. Main vẫn `2d1536f`;
không tự merge/push/deploy hoặc nhập nhánh BE/DATE cũ.

Cập nhật triển khai 23/11/2026. DATEON02 đã nối lô bền vững và gợi ý SKU,
DATEON03 đã nối xử lý từng phần với receipt cố định. Wire triển khai nằm trong
[OpenAPI](../../contracts/openapi/kph.openapi.yaml). Quyết định nhắc chung còn ở DATEON04.

## Authority và evidence

Đã đọc [model DATE](DATE_MILESTONE_MODEL.md), [domain](DOMAIN_RULES.md),
[P01](PROVISIONING_POLICY.md), [index](STORE_APP_CONTRACTS.md), code/test intake,
assessment, actions, workflow và OpenAPI thực tế. Prototype chưa có quantity/
unit/version/backend; report để Tồn là “—”. Catalog API published chỉ có
product/barcode/SKU/name/NCC, không có unit hay loại KPH. Không lấy metadata
mock làm authority online; không nhập các nhánh BE10–15 làm feature đã chốt.

Ngày date/LocalDate, hiển thị dd/mm/yyyy, timezone Asia/Ho_Chi_Minh; shelf life
inclusive, mốc20%/40% giữ [fixture ngày](../../contracts/fixtures/golden/dates).
DATE phase độc lập processing/reminder. Thiếu NSX vẫn giữ HSD, không suy NSX/
timeline/%. HSD đã qua vẫn EXPIRED; có NSX thì HSD phải lớn hơn NSX. Intake mẫu
đang bắt buộc NSX, nhưng model/assessment/contract đã hỗ trợ thiếu NSX: online
nullable theo authority đó, không sao chép validation chặt hơn từ form mẫu.

## Quyết định owner A/B/C — 17/11/2026

### A — lượng đang theo dõi, không phải tồn kho

Owner chọn **“Số lượng đang theo dõi, không phải tồn kho”**. Mỗi entry giữ
trackedQuantity nhập/đo thực tế, unit explicit EA hoặc kg; không tự giảm khi
bán/chuyển hàng và không tạo ledger/đối soát kho. Tạo mới quantity >0; EA nguyên
dương, kg decimal dương theo KPH hiện tại (BigDecimal/NUMERIC, không tự round
hoặc thêm scale3). Frontend không tự tính lượng còn lại bằng float làm authority.
Không mặc định quantity1 hoặc đoán unit từ tên/catalog không có metadata.

UUID entry tách lotCode optional dạng chuỗi. SKU/barcode giữ số0 đầu. HSD
required, NSX nullable; SKU/tên bắt buộc. FOUND snapshot do backend resolve,
NOT_FOUND giữ barcode và dữ liệu nhập tay explicit. Không tự cộng/gộp các
entry trùng mã lô; cảnh báo trùng store/SKU/lotCode/ngày, không tự đặt hard-unique
hoặc biến các entry thành số tồn toàn SKU.

### B — xử lý từng phần, giữ lượng còn lại

Owner chọn **“Từng phần, giữ lượng còn lại”**. Một entry liên kết **nhiều KPH**;
không dùng một kphRecordId/resolved flag của prototype làm mô hình online.

- processedQuantity là tổng lượng từ các lần tạo KPH đã commit. remainingQuantity
  = trackedQuantity − processedQuantity; server quyết định, không âm.
- Mỗi KPH dùng quantity >0 và <=remainingQuantity, cùng unit và đúng hàng của
  source. Mỗi link giữ amount/unit, KPH ID, actor/time, sourceVersion và snapshot
  nguồn tại thời điểm xử lý. Phiếu KPH mới PENDING; duyệt sau đó không trừ lần nữa.
- Còn dư: entry tiếp tục ở DATE/Thông báo theo phase/lịch hiện hành. Xử lý một
  phần không tự ghi nhận, xóa lịch hay đổi phase. Chỉ khi remaining=0 mới
  resolved và rời danh sách active/nhắc; dữ liệu nguồn và toàn bộ link vẫn giữ.
- Hủy/lỗi gửi không trừ lượng. Retry cùng key không thêm link/trừ lần hai.
  Hai người cùng xử lý phải khóa/version source và không over-process.
- V1 không mở hoàn tác/reopen theo việc KPH bị REJECTED. Resolve gắn với tạo
  KPH thành công theo workflow đã accepted; review không tự cộng lại lượng.
  Nếu cần hoàn trả quantity thì phải có operation/audit riêng, không sửa ngầm.

### C — lịch chung, chỉ quản lý sửa/hẹn

Owner chọn **“Lịch chung, chỉ quản lý được sửa/hẹn”**. Entry/lịch nhắc là công
việc chung cửa hàng, không phải bản riêng theo createdBy.

| Quyền DATE | EMPLOYEE đúng store | STORE_MANAGER đúng store | REGION_MANAGER đúng region | CHAIN_ADMIN | CATALOG_ADMIN đơn thuần |
| --- | --- | --- | --- | --- | --- |
| Xem, tạo entry | Có | Có | Có | Có | Không |
| Sửa thông tin/lượng theo dõi | Không | Có | Có | Có | Không |
| Ghi nhận/hẹn lại1 hoặc7 ngày | Không | Có | Có | Có | Không |
| Tạo KPH xử lý một phần | Có, đồng thời cần KPH_CREATE | Có, đồng thời cần KPH_CREATE | Có, đồng thời cần KPH_CREATE | Có, đồng thời cần KPH_CREATE | Không |
| Xóa/vô hiệu hóa entry | Không | Không | Không | Không qua Store PWA | Không |

Sửa/hẹn là quyền khác PROCESS: NV được tạo KPH trong scope hiện có, không dùng
PROCESS để sửa trackedQuantity/unit/identity hoặc hẹn nhắc. Đây là phân định
áp dụng câu trả lời về **sửa/hẹn**, không cấp thêm duyệt/xuất KPH. Role kế thừa
phải explicit và backend resolve store→region; inactive/revoke chặn request
kế tiếp. CreatedBy là attribution, không là private ownership. Mọi thay đổi có
audit actor/store/target/version/server time. Không tự nâng CATALOG_ADMIN.

## Mô hình và wire proposal

[ADR0008 Proposed](../adr/0008-durable-date-partial-processing.md) ghi trade-off.
Các tên/paths dưới đây sẽ đi vào OpenAPI/examples/generated client trong cùng
slice implementation; chưa sửa contract API đang chạy hoặc migration V1–V9.

Entry: id, storeId, lotCode nullable, product/catalog hoặc manual snapshot,
lookupStatus/barcode/SKU, kphType nullable, manufacturedOn nullable, expiresOn,
trackedQuantity, processedQuantity, remainingQuantity, unit, processingStatus,
remindOn nullable, version, created/updated actor/time. Type không được suy từ
name/SKU/unit; thiếu metadata giữ chưa phân loại, yêu cầu người dùng chọn khi
xử lý KPH. Lựa chọn type đầu tiên được lưu explicit lúc commit; link sau khớp.

Proposal mutation: expectedVersion, không last-write-wins. Quản lý sửa quantity
phải >processedQuantity khi entry còn active; không đóng entry bằng edit về0.
Sau link đầu, giữ product identity/unit/type; sửa lotCode/ngày do quản lý có lý
do/audit và không đổi snapshot của link cũ. Entry resolved read-only ở v1.

| Route đề xuất | Quyền/ý nghĩa |
| --- | --- |
| GET `/api/v1/date/stores` | Discovery DATE explicit: VIEW/CREATE/UPDATE/REMIND/PROCESS; không coi capability KPH là token DATE |
| GET `/api/v1/stores/{storeId}/date-lots` | List store-scoped, mặc định unresolved; filter/sort/count trước page, stable tie-breaker; không load hết để lọc |
| GET `/api/v1/stores/{storeId}/date-lots/{lotId}` | Detail + quantity authoritative và các processing receipts/link KPH |
| POST `/api/v1/stores/{storeId}/date-lots` | Create có idempotency key; actor/store server-owned, quantity/unit explicit |
| PATCH `/api/v1/stores/{storeId}/date-lots/{lotId}` | UPDATE manager, expectedVersion và lý do; snapshot/audit trước-sau |
| PUT `/api/v1/stores/{storeId}/date-lots/{lotId}/reminder` | REMIND manager, expectedVersion + afterDays1/7; ngày đích do backend tính theo HCM |
| POST `/api/v1/stores/{storeId}/date-lots/{lotId}/kph` | PROCESS + KPH_CREATE, multipart như KPH hiện có; payload gồm expectedVersion và kph create request; quantity của KPH là lượng xử lý |

Không thêm sourceDate fields vào KPH create thường để bypass quyền DATE. KPH
được tạo từ endpoint source mới vẫn đi qua validation/policy/media/catalog hiện
có. Unit/hàng/type phải khớp nguồn; không nhận actor/store/region authoritative
từ body. Session/CSRF, no-store cho response private giữ như baseline.401 hết
phiên,403 không scope/capability,404 nguồn không nằm trong store đã authorize,
409 stale version/key conflict,422 dữ liệu hoặc lượng xử lý không hợp lệ.

## Atomic processing và retry

Cùng PostgreSQL/modular monolith hiện tại; không Redis/queue/service mới.
Một transaction khóa entry, kiểm version/quyền/remaining, tạo KPH + processing
link + cập nhật remaining/status/version + audit. Lỗi media dùng rollback/
compensation hiện có; không hứa distributed transaction DB/filesystem.

Key gắn actor/store/entry + toàn payload/file signature. Replay đã commit được
nhận ra trước stale-version check, trả cùng KPH/receipt; không trừ thêm lượng.
Receipt giữ quantity, unit, sourceVersion/resultingVersion và remainingAfter
của **lần xử lý đó**. Nếu lần khác đã xử lý tiếp, replay receipt không được coi
là remaining hiện tại: UI invalidate/đọc lại source. Gửi thành công nhưng GET
refresh lỗi vẫn báo đã gửi/chưa tải lại DATE, không giả write thất bại rồi tạo
key mới. Hai request khác key/version cũ chỉ một lần commit, lần kia409.

Audit tối thiểu create/update, reminder set/reschedule và từng KPH link; không
log secret/ảnh/PII đầy đủ, không hard delete. Retention rollout chốt riêng.
Không có hạch toán nhập/xuất kho, hoàn lượng KPH hoặc edit/invalidate KPH mới.

## Lịch nhắc bền vững và phase

Lưu remindOn date. Manager xác nhận1/7 ngày mới đổi lịch/version/audit; Hủy
không ghi. Cả cửa hàng thấy cùng lịch. Đến/ngang ngày hẹn, API biểu diễn Mở/due
kể cả phase còn an toàn; không cần cron đổi hàng DB lúc nửa đêm. App refresh
khi resume/qua ngày; read không tạo audit mutation giả. Partial processing còn
dư giữ lịch; lần xử lý hết clear hiệu lực nhắc. Resolved không hẹn tiếp.

Persisted schedule không đồng nghĩa push khi đóng app hoặc unread đã có.
Thông báo/Báo cáo trên DATE thật là slice sau; không coi quantity này là Tồn
trong report khi chưa có contract/snapshot báo cáo mới.

## Fixture và bước nhỏ tiếp

[Scenarios độc lập ngôn ngữ](../../contracts/fixtures/proposals/date-durable-v1.json)
là proposal fixture dựa trên A/B/C, chưa là response schema hoặc runtime PASS.
Gồm partial/final, decimal, replay sau một lần xử lý khác, concurrency, amount
vượt remaining, lỗi media, permission/revoke và nhắc còn dư/qua ngày.

1. DATEON01 hiện tại: chốt A/B/C đã xong; wire/ADR và fixtures reviewable.
2. DATEON02: OpenAPI/examples/generated + migration mới, lưu/xem/tạo/sửa entry
   với audit/version/quyền; frontend online theo contract, không fallback mock.
3. DATEON03: partial DATE→KPH atomic, retry/concurrency và lịch sử nhiều link.
4. DATEON04: hẹn1/7 ngày bền vững/due/resume, rồi mới Thông báo/Báo cáo DATE thật.

Technical checks cho DATEON01 chỉ docs/JSON/fixture consistency và links;
không chạy app/backend suite cho prose/fixture-only diff. Migration, API, app,
remote CI và thiết bị thật chưa được triển khai/kiểm cho DATE bền vững.
