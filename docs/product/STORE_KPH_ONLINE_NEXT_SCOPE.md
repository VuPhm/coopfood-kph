# Scope đề xuất — UI mới + KPH online

Ngày 07/11/2026. Trạng thái: đề xuất để chốt trước cycle implementation;
không phải contract accepted, chưa bắt đầu R2-02. Baseline và quyết định hiện
hành ở [CURRENT_STATE](../CURRENT_STATE.md), thứ tự ở [NEXT](../NEXT.md).

## Outcome và phạm vi

Người dùng thao tác KPH trên UI Fresh đã duyệt với session/store scope và dữ
liệu do backend xác nhận: đăng nhập → chọn cửa hàng hợp lệ → scan/lookup hoặc
nhập tay → tạo TPCN/TPTS với 1–3 ảnh → history → duyệt → xuất đúng quyền.
Tái sử dụng backend/API/client, auth, media và rule đã có; không rewrite nền.

## Quyết định cần chốt trước implementation phụ thuộc

- **Effective context:** hình dạng API/context, danh sách store/capability cho
  các actor theo membership, region assignment và chain scope; trạng thái
  zero-access/inactive/revoked, chuyển store và refresh quyền. Không coi danh
  sách membership hiện tại là toàn bộ quyền kế thừa.
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
