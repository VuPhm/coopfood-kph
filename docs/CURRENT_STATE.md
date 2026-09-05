# Trạng thái hiện tại

Cập nhật: 2026-09-05

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
- Pilot đã có IndexedDB cho phiếu/stamped image/trash/export history, scanner
  camera với fallback, image processing/viewer, service worker và Excel baseline.
- Device/browser matrix và workbook TPCN/TPTS đã được đóng theo acceptance tối
  thiểu của Pilot-00; acceptance ledger và runbook nằm trong `docs/pilot/`.

## Chưa hoàn tất

- Chưa có vertical slice chạy end-to-end trong repository mới: UI hiện dùng dữ
  liệu tổng hợp; backend đã có login/session/store context nhưng chưa implement
  catalog/KPH HTTP handlers.
- Database migration đã compile nhưng smoke test PostgreSQL cần Docker-compatible
  runtime; môi trường verification hiện tại không có socket nên test được skip.
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
