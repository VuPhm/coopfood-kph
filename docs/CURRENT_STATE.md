# Trạng thái hiện tại

Cập nhật: 2026-08-15

## Giai đoạn

`Foundation — reboot từ baseline đã kiểm chứng`

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
- Store PWA đã có component shell React giữ brand header, store/session context,
  hai entry TPCN/TPTS, lịch sử table/card responsive, form demo và tra hạn.
- Admin Web đã có entry point riêng; `packages/ui` giữ các source component
  shadcn-style trên Radix, không mang DOM/CSS bundle legacy sang.
- `packages/kph-rules` chạy trực tiếp golden fixture ngày và KPH; API types được
  sinh từ OpenAPI và transport dùng `openapi-fetch` với session/CSRF.
- Backend Java 21/Spring Boot đã có baseline migration 15 bảng, security
  default-deny, ProblemDetail, business clock, ArchUnit và database smoke test.

## Chưa hoàn tất

- Chưa có vertical slice chạy end-to-end trong repository mới: UI hiện dùng dữ
  liệu tổng hợp; backend chưa implement login/store/catalog/KPH HTTP handlers.
- Chưa có pipeline ảnh private/stamp, scanner, Excel hoặc browser E2E.
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
