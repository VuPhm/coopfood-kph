# Scope đề xuất — UI mới + KPH online

Ngày 07/11/2026. Trạng thái: đề xuất để chốt trước cycle implementation;
không phải contract accepted, chưa bắt đầu R2-02. Baseline và quyết định hiện
hành ở [CURRENT_STATE](../CURRENT_STATE.md), thứ tự ở [NEXT](../NEXT.md).

## Outcome và phạm vi

Người dùng thao tác KPH trên UI Fresh đã duyệt với session/store scope và dữ
liệu do backend xác nhận: đăng nhập → chọn cửa hàng hợp lệ → scan/lookup hoặc
nhập tay → tạo TPCN/TPTS với 1–3 ảnh → history → duyệt → xuất đúng quyền.
Tái sử dụng backend/API/client, auth, media và rule đã có; không rewrite nền.

## Đề xuất contract cho danh sách cửa hàng KPH

Giữ `GET /api/v1/stores` và `session.user.stores` cho consumer đọc membership.
Đề xuất một endpoint đọc riêng `GET /api/v1/kph/stores` cho bộ chọn cửa hàng
của KPH. Tên endpoint và response dưới đây cần được chốt trước khi đưa vào OpenAPI.

Ví dụ cho một quản lý có quyền tại một cửa hàng (định danh tổng hợp):

```json
[{"id":"00000000-0000-4000-8000-000000000001","code":"0001","name":"Cửa hàng mẫu","capabilities":["VIEW","CREATE","REVIEW","EXPORT"]}]
```

| Quyền hiệu lực tại store và region đang active | Store trả về và thao tác |
| --- | --- |
| EMPLOYEE có membership | Đúng store, VIEW và CREATE |
| STORE_MANAGER có membership | Đúng store, đủ bốn thao tác |
| REGION_MANAGER có active assignment | Store thuộc vùng được giao, đủ bốn thao tác |
| CHAIN_ADMIN | Mọi store hợp lệ toàn chuỗi, đủ bốn thao tác |

Đề xuất lấy hợp các scope và trả mỗi store một lần, kể cả khi user vừa có
membership vừa quản lý vùng. Session hợp lệ hết quyền nhận `200 []`. Phiên hết
hiệu lực nhận `401`. Server kiểm lại mỗi request nghiệp vụ. Nếu quyền bị thu
hồi khi màn đang mở, khi nhận `403` UI tải lại danh sách, bỏ selection và dữ
liệu cũ của store bị mất quyền. Kiểm cả trường hợp chỉ mất quyền duyệt/xuất
nhưng còn quyền xem qua membership.

Dùng cùng policy KPH cho discovery và mutation. Mô tả lookup barcode trong
[OpenAPI](../../contracts/openapi/kph.openapi.yaml) hiện ghi cần membership,
trong khi [CatalogService](../../backend/src/main/java/vn/coopfood/kph/catalog/CatalogService.java)
gọi `requireViewCreate` có xét quyền vùng/chuỗi. Khi chốt contract cần đồng bộ
mô tả với policy đã duyệt và kiểm lookup đúng vùng, sai vùng trên backend thật.

## Quyết định giao diện

- **History:** phương án mặc định bảo toàn D01: page-local selection, reset khi
  đổi scope/filter/sort/page, count từ server và busy state rõ. Nếu muốn nối
  trang và giữ chọn như mock, phải sửa contract/examples/tests bằng quyết định
  explicit trước; không nhập cả hai semantics vào cùng luồng online.
- **Phạm vi navigation:** cách thể hiện DATE/Báo cáo/Thông báo chưa có backend
  trong entry online phải chốt; không để route mock tạo kỳ vọng dữ liệu thật.

## Gate kỹ thuật dự kiến

- API đổi phải đi cùng OpenAPI, examples và generated client; fixture độc lập
  ngôn ngữ cho rule. Migration nếu cần chỉ nối tiếp và có một owner active.
- Backend kiểm employee/store manager/region manager/chain admin, allow đúng
  scope và deny cross-store/cross-region; revoke có hiệu lực request kế tiếp.
- Lookup phân biệt FOUND/NOT_FOUND/CATALOG_UNAVAILABLE; không suy sản phẩm khi
  miss. Giữ ngày Việt Nam, catalog snapshot, ảnh original/stamped private theo
  thứ tự, create retry idempotent và export eligibility/audit.
- History test filter/sort trước paging, count, reset/selection, đổi store khi
  request đang chạy; không hiển thị hoặc mutate dữ liệu của scope cũ.
- Chạy verify frontend/contracts, backend integration/clean migration và
  Playwright với backend/PostgreSQL thật ở 390×844 và 1440×1024. Mock PASS không
  thay real-backend E2E; ghi riêng môi trường, commands và kết quả.

## Gate người dùng và ngoài phạm vi

Owner thử trọn luồng với fixture tổng hợp và chấp nhận candidate đã tích hợp.
Kiểm thiết bị thật cho camera/keyboard/touch/interruption là evidence riêng;
không suy ra từ browser desktop. Ghi rõ gate thiết bị nào cần trước rollout.

Không gồm DATE persistence, notification push, báo cáo định kỳ online, C02
publish, provisioning mở rộng, redesign UI toàn app hoặc triển khai production.
Hosting, backup/restore, media retention và Pages cutover là outcome riêng.
Không thêm abstraction/platform, microservice hoặc dependency nền khi chưa cần.
