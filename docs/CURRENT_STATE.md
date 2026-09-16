# Trạng thái hiện tại

Cập nhật: 2026-09-17

## Giai đoạn

`Online stability S03 — CLOSED; S04 là bước kế tiếp đã được owner cho phép`

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
- Ngày 2026-09-17, S03 chạy lại `npm run verify`: PASS docs/Contract Lock,
  generated API drift, TypeScript, 146 tests và build Admin Web/Store PWA.
- S03 không đổi backend/OpenAPI; backend suite không được dùng làm bằng chứng mới
  cho candidate này. Warning chunk lớn của Store PWA vẫn là baseline chưa có số
  đo thiết bị để kết luận cần đổi thư viện.

## Ranh giới và phần hoãn

- Không thêm microservice, queue, Redis, search engine, offline outbox hoặc
  production infrastructure khi chưa có requirement/ADR.
- Chưa chốt hosting/storage/retention, SSO/MFA, primary supplier nhiều NCC,
  edit/invalidate workflow hoặc cửa sổ duyệt.
- Online hiện hỗ trợ JPEG/PNG; HEIC, thiết bị iPhone thật, production rollout,
  paging history và backup/restore online vẫn là backlog có outcome riêng.
- Pilot chỉ nhận security/critical fix; không migrate IndexedDB Pilot sang online.

## Điểm tiếp tục

Owner đã cho phép tiếp tục sau khi pass S03. Bước duy nhất đang mở kế tiếp là
S04: tách online history authority khỏi Pilot/local state, dùng Query cache làm
nguồn online duy nhất và giữ nguyên behavior UI đã accepted. Phạm vi/acceptance
hiện hành được ghi ở [NEXT](NEXT.md); review đầy đủ và backlog sau đó nằm tại
[roadmap 2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
