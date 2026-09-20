# Trạng thái hiện tại

Cập nhật: 2026-09-21

## Giai đoạn

`P02 scoped authorization slice — CLOSED, owner accepted`

Repository là implementation mới của Co.op Food KPH. Hai repository cũ
`coopfood-kph-platform` và `tool-kph` chỉ là provenance read-only; không tiếp
tục phát triển sản phẩm hoặc ghi dữ liệu vận hành vào đó.

## Baseline đã chấp nhận

- Pilot-00 local-only đã đóng ngày 2026-09-04 và được freeze theo ADR-0002;
  IndexedDB chỉ là authority của từng thiết bị Pilot, không được mang sang online.
- Foundation-01 đã đóng ngày 2026-09-13: login, store context, catalog lookup,
  tạo/list phiếu và 1–3 ảnh private chạy qua backend online.
- Foundation-02 đã đóng ngày 2026-09-16: lọc ngày phát hiện, duyệt có audit và
  xuất phiếu `SUBMITTED + APPROVED` cho `STORE_MANAGER` đúng membership.
- Online stability S01–S02 đã merge vào `main` qua PR #3 (`5358ad6`): response
  tạo phiếu cũ không làm bẩn scope mới; duyệt lô đợi mọi request và báo kết quả
  thành công/thất bại với concurrency giới hạn.
- Online stability S03 đã được owner chấp nhận ngày 2026-09-17 trên candidate
  `05b462b`: workbook online dùng store snapshot từ response export; 500 phiếu
  được gửi đủ, 501 bị chặn rõ ràng trước request. Cycle closeout ở
  [plan](delivery/online-stability-s03/plan.json).
- Online stability S04 được owner “tạm cho pass” ngày 2026-09-17 trên candidate
  `ebc9cdc`: online history dùng TanStack Query làm authority duy nhất, cache
  tách theo user/store/date filter và Pilot giữ local state riêng. Real-backend
  E2E chưa rerun do Docker không sẵn sàng và vẫn là giới hạn hoãn, xem
  [S04 plan](delivery/online-stability-s04/plan.json).
- P01 provisioning policy được owner chấp nhận ngày 2026-09-17: hierarchy
  `CHAIN_ADMIN` toàn chuỗi → `REGION_MANAGER` đúng vùng → `STORE_MANAGER` đúng
  store; credential/bootstrap/lifecycle theo security baseline. P01 chỉ khóa
  contract/fixture, chưa triển khai schema/API/Admin UI.
- P02 scoped authorization đã được owner chấp nhận ngày 2026-09-21 trên branch
  `codex/p02-scoped-authorization`: resolver scope store được tách khỏi policy
  capability KPH; migration V6 dùng relational constraint chống race cho invariant
  active store → active region; backend deny inherited scope khi store/region
  inactive. Yêu cầu đặt lịch deactivate store/region trước tối thiểu 30 ngày
  được chuyển sang contract lifecycle kế tiếp, không làm thay đổi candidate P02.

## Hệ thống hiện có

- Một Spring Boot modular monolith, PostgreSQL 17, Flyway và jOOQ; Store PWA và
  Admin Web là hai entry point dùng chung OpenAPI 3.1/generated TypeScript client.
- Backend giữ authority cho session, role, active store membership, store scope,
  catalog published/current, snapshot KPH, approval/audit và private media.
- Store PWA online hỗ trợ login → chọn cửa hàng → lookup barcode/manual fallback
  → tạo phiếu → history/filter → duyệt → xuất Excel. Pilot tiếp tục có persistence,
  trash, scanner, stamped image và export local riêng.
- Business contract ngày/HSD, KPH, catalog, ảnh và Excel nằm tại
  [DOMAIN_RULES](product/DOMAIN_RULES.md); accepted ADR nằm tại [ADR](adr/README.md).

## Kiểm chứng gần nhất

- PR #3 đã merge vào `main` và từng pass remote CI `frontend`, `backend`, `browser`.
- Ngày 2026-09-17, P01 Contract Lock bao phủ role hierarchy, cross-store/
  cross-region denial, last-admin/last-manager và credential/bootstrap guard.
- Ngày 2026-09-21, P02 scoped authorization full backend test PASS trên
  PostgreSQL 17 qua Testcontainers, gồm clean/upgrade V1→V6, lifecycle
  active store/region, inactive store/region denial, cross-region denial,
  region grant/revoke request kế tiếp và chain-wide access; `npm run verify`
  PASS. Owner đã cho pass phần còn lại ngày 2026-09-21.
- Ngày 2026-09-17, S04 `npm run verify` PASS docs/Contract Lock, generated API
  drift, TypeScript, 147 tests và build; browser fixture review pass 7 viewport.
- S04 không đổi backend/OpenAPI. Real-backend browser suite chưa rerun vì Docker
  không hoạt động; warning chunk lớn vẫn là baseline chưa có số đo thiết bị.

## Ranh giới và phần hoãn

- Không thêm microservice, queue, Redis, search engine, offline outbox hoặc
  production infrastructure khi chưa có requirement/ADR.
- Chưa chốt hosting/storage/retention, SSO/MFA, primary supplier nhiều NCC,
  edit/invalidate workflow hoặc cửa sổ duyệt.
- Online hiện hỗ trợ JPEG/PNG; HEIC, thiết bị iPhone thật, production rollout,
  paging history và backup/restore online vẫn là backlog có outcome riêng.
- Pilot chỉ nhận security/critical fix; không migrate IndexedDB Pilot sang online.

## Điểm tiếp tục

P02 scoped authorization đã đóng. Trước khi mở public provisioning API/Admin UI,
cycle kế tiếp phải khóa danh sách “thao tác phá hủy quan trọng” áp dụng lịch tối
thiểu 30 ngày và quyết định ngoại lệ xử lý sự cố bảo mật; không hard delete.
Kết quả P02 nằm trong
[P02 handoff](delivery/p02-scoped-authorization/acceptance-handoff.md); backlog
đầy đủ ở [roadmap 2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
