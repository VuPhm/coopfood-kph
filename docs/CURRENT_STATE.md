# Trạng thái hiện tại

Cập nhật: 2026-09-09

## Giai đoạn

`Foundation-01 — vertical slice tạo và xem phiếu KPH`

Pilot local-only theo ADR-0002 đã được project owner đóng ngày 2026-09-04 bằng
acceptance tối thiểu. Pilot đang chạy được giữ nguyên, không tạo tag/deploy mới
hoặc rehearsal rollback; `REL-01`–`REL-03` được waive một lần. Foundation-01 là
milestone active cho vertical slice online.

Repository này là implementation mới. Hai repository tham chiếu
`coopfood-kph-platform` và `tool-kph` chỉ được đọc để lấy provenance,
business behavior và UI DNA; không tiếp tục phát triển sản phẩm trong đó.

## Đã mang sang

- Hợp đồng nghiệp vụ ngày, KPH, catalog/barcode, ảnh và Excel trong
  `docs/product/DOMAIN_RULES.md`.
- UI DNA, behavior inventory và screen map legacy, có provenance rõ ràng.
- Fixture tổng hợp cho biên ngày, option matrix KPH, catalog identifier,
  image envelope/timestamp và cấu trúc Excel.
- OpenAPI v1 tối thiểu cho health, session, store context, barcode lookup và
  KPH create/list. Frontend và backend dùng contract này là ranh giới cộng tác.
- Contract Lock kiểm schema/examples và golden option matrix. Migration V2
  đồng bộ đơn vị `kg`, đủ năm tình trạng mỗi loại như Pilot, và số lượng `EA`
  nguyên/`kg` thập phân dương; không tự làm tròn số lượng trước validation.
  `DAMAGED` trong dữ liệu database cũ chuyển sang `OTHER` kèm provenance;
  không suy diễn thành Dập úng hay Thối mốc, không migrate IndexedDB Pilot.
- Store PWA đã có component shell React giữ brand header, store/session context,
  hai entry TPCN/TPTS, lịch sử table/card responsive, form demo và tra hạn.
- Pilot Store PWA cho cấu hình context cửa hàng/người dùng theo từng thiết bị,
  lưu trong IndexedDB; tên và mã cửa hàng 4 chữ số là bắt buộc, thông tin nhân
  sự là tùy chọn. Cấu hình local này không phải authorization của topology đích.
- Admin Web đã có entry point riêng; `packages/ui` giữ các source component
  shadcn-style trên Radix, không mang DOM/CSS bundle legacy sang.
- `packages/kph-rules` chạy trực tiếp golden fixture ngày và KPH; API types được
  sinh từ OpenAPI và transport dùng `openapi-fetch` với session/CSRF.
- Backend Java 21/Spring Boot đã có baseline migration 15 bảng, security
  default-deny, ProblemDetail, business clock, ArchUnit và database smoke test.
- Foundation-01 đã có KPH create/list/photo HTTP handlers với idempotency,
  catalog/store/actor snapshot bất biến và local private original/stamped media;
  Store PWA có adapter online dùng cùng OpenAPI cho session, history, lookup và
  create multipart, bật bằng `VITE_KPH_ONLINE=true`.
- Catalog lookup và snapshot creation dùng chung resolver published/current;
  test KPH bao gồm barcode miss giữ nhập tay, fixed business clock và thư mục
  media tạm. Seed nâng cấp V1 tách khỏi seed có snapshot V4.
- Có workflow PR `Verify Foundation` cho frontend và backend. Full backend
  verification yêu cầu Docker; integration không tự skip khi thiếu runtime.
- Verification local ngày 2026-09-09: `npm run verify` pass 117 test và build;
  backend `./mvnw -q verify` qua OrbStack/PostgreSQL 17 pass 30 test, không skip,
  gồm database sạch và nâng cấp V1→V4. Workflow CI chưa được chạy trên GitHub.
- Đợt tiếp theo làm rõ vùng dùng chung Pilot/online: model hiển thị `RecordView`
  tách khỏi fixture demo; table/card nhận callback thao tác từ workspace; bỏ
  state duyệt trùng. Online context/người nhập chỉ đọc từ session, có trạng thái
  loading/error/empty và retry tải workspace; dialog Pilot không mount ở online.
- Verification frontend sau đợt ranh giới: `npm run verify` pass 121 test và
  build, gồm 4 ca online loading/retry và capability EMPLOYEE/STORE_MANAGER.
  Đây là component tests với gateway mock, chưa thay thế browser E2E.
- Pilot đã có IndexedDB cho phiếu/stamped image/trash/export history, scanner
  camera với fallback, image processing/viewer, service worker và Excel baseline.
- Device/browser matrix và workbook TPCN/TPTS đã được đóng theo acceptance tối
  thiểu của Pilot-00; acceptance ledger và runbook nằm trong `docs/pilot/`.

## Chưa hoàn tất

- Đã rà local/remote branches ngày 2026-09-09 và lập
  [kế hoạch đóng Foundation-01](FOUNDATION_01_COMPLETION_PLAN.md). Các nhánh
  identity/contract/Pilot đã nằm trong HEAD; phần KPH online đã checkpoint tại `2c456ea`.
  Nhánh WIP planning chứa policy khác và không được merge nguyên nhánh.
  Ba team Luna max đã giao commit từ ba worktree riêng; chờ root tích hợp và chạy acceptance.
- Chưa có browser E2E chạy end-to-end trong repository mới; integration test
  KPH đã pass với Docker/PostgreSQL local, và online mode hiện
  nhận session đã đăng nhập từ backend thay vì tự dựng màn hình login.
- Database migration V2 đã được kiểm chứng với PostgreSQL 17 qua Testcontainers,
  bao gồm clean database và nâng cấp dữ liệu mã cũ tổng hợp.
- Chưa chốt hosting, PostgreSQL/object storage provider, retention, SSO/MFA,
  primary supplier khi một product có nhiều NCC, và workflow approve/edit đầy đủ.

## Ranh giới hiện tại

- Modular monolith, hai frontend entry point, một OpenAPI contract.
- Backend quyết định session, role, store membership và data isolation.
- Không microservice, queue, Redis, offline outbox hay production infrastructure
  trong foundation này.
- Không copy DOM imperative, CSS override, generator API viết tay, JDBC mapping
  hoặc EXIF parser tự viết từ implementation cũ.
- Pilot đang chạy được freeze, chỉ nhận security/critical fix; dữ liệu Pilot
  không được migrate sang authority online.
