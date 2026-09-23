# Trạng thái hiện tại

Cập nhật: 2026-09-24

## Giai đoạn

`D01 history paging — technical PASS revision 2, chờ owner acceptance`

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
- Online stability S03 đã được owner chấp nhận và merge vào `main` qua PR #4
  ngày 2026-09-16 trên candidate
  `05b462b`: workbook online dùng store snapshot từ response export; 500 phiếu
  được gửi đủ, 501 bị chặn rõ ràng trước request. Cycle closeout ở
  [plan](delivery/online-stability-s03/plan.json).
- Online stability S04 được owner “tạm cho pass” ngày 2026-09-17 trên candidate
  `ebc9cdc`: online history dùng TanStack Query làm authority duy nhất, cache
  tách theo user/store/date filter và Pilot giữ local state riêng. Candidate chưa
  rerun được real-backend E2E do Docker không sẵn sàng; giới hạn lịch sử này đã
  được khép lại trong preflight PR #5 ngày 2026-09-21, xem
  [S04 evidence](delivery/online-stability-s04/technical-evidence.md).
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
- P03 bổ sung lịch ngừng hoạt động vùng/cửa hàng (tối thiểu 30 ngày), đổi/hủy/
  thực thi thủ công khi đến hạn, audit và Admin Web cùng contract. Lịch không tự
  chạy; owner đã chấp nhận lựa chọn tối thiểu này ngày 2026-09-21. Preview local
  dùng dữ liệu tổng hợp riêng, không dùng dữ liệu vận hành thật.
- C01 bổ sung catalog staging/validation CSV cho `CATALOG_ADMIN`: giữ identifier
  dạng string, trả lỗi theo dòng, replay idempotent theo checksum và không tạo
  catalog published. Owner đã chấp nhận ngày 2026-09-21.
- P05 trên `codex/p05-credential-self-service` bổ sung self-change
  password cho Store PWA và Admin Web, credential version để vô hiệu session cũ,
  hash mới PBKDF2 có prefix và khả năng đọc BCrypt legacy. Technical verification
  đã pass trên candidate `39c0cff`; browser preview đã kiểm tra đến ngay trước
  submit ở cả hai entry point. Owner đã xác nhận “pass” ngày 23/09/2026;
  cycle đã đóng theo [owner acceptance](delivery/p05-credential-self-service/acceptance-handoff.md).
- Business contract ngày/HSD, KPH, catalog, ảnh và Excel nằm tại
  [DOMAIN_RULES](product/DOMAIN_RULES.md); accepted ADR nằm tại [ADR](adr/README.md).

## Kiểm chứng gần nhất

- D01 revision 2 đã tích hợp backend/Store PWA/E2E do GPT-6 Luna triển khai trên
  baseline P04/P05, nhánh `codex/d01-p04-integration`. Application/browser candidate
  `7fc9b8d`; 162 frontend/package tests, 65 backend tests và real-backend browser
  8 PASS / 4 skip theo viewport. Query-plan 20.000 phiếu + 40.000 dòng ảnh tổng hợp
  xác nhận page-before-photo; chưa cần index/migration mới. Preview sạch
  <http://127.0.0.1:4173>, owner acceptance pending.
  [Evidence revision 2](delivery/d01-history-paging/technical-evidence-r2.md).


- P05 đã merge qua [PR #7](https://github.com/VuPhm/coopfood-kph/pull/7),
  commit `2d32ffd`, ngày 23/09/2026. CI frontend/backend/browser PASS trên
  head `0374016`; cây nội dung merge trùng head đã kiểm chứng.
- P04 tiếp tục từ candidate `92dedf7` trên `codex/p04-user-deactivation` và tích hợp
  P05. Chỉ CHAIN_ADMIN được khóa user khác; giữ guard self/last-admin/last-manager,
  audit và session invalidation. Revision 3 đã pass 161 frontend/package tests,
  64 backend tests và browser real-backend ở 4 viewport. Bản tích hợp đã kiểm
  đổi mật khẩu từ workspace Tài khoản và chặn phiên admin cũ; owner đã chấp nhận P04 ngày 23/09/2026. [Evidence](delivery/p04-user-deactivation/technical-evidence.md).

- PR #5 đã merge chuỗi accepted S04 → P01 → P02 → P03 → C01 vào `main` ngày
  2026-09-21: head `048a7ff`, merge commit `3ffc774`. Remote CI của PR PASS cả
  frontend, backend và browser.
- Ngày 2026-09-17, P01 Contract Lock bao phủ role hierarchy, cross-store/
  cross-region denial, last-admin/last-manager và credential/bootstrap guard.
- Ngày 2026-09-21, P02 scoped authorization full backend test PASS trên
  PostgreSQL 17 qua Testcontainers, gồm clean/upgrade V1→V6, lifecycle
  active store/region, inactive store/region denial, cross-region denial,
  region grant/revoke request kế tiếp và chain-wide access; `npm run verify`
  PASS. Owner đã cho pass phần còn lại ngày 2026-09-21.
- Ngày 2026-09-21, C01 `npm run verify` PASS 155 frontend tests/build/Contract
  Lock; 53 backend tests PASS trên PostgreSQL; real-backend browser E2E PASS
  upload/replay/reject và lookup isolation. Owner đã cho pass cùng ngày.
- Ngày 2026-09-17, S04 `npm run verify` PASS docs/Contract Lock, generated API
  drift, TypeScript, 147 tests và build; browser fixture review pass 7 viewport.
- Ngày 2026-09-21, preflight PR #5 đã chạy lại Foundation real-backend browser
  suite trên PostgreSQL 17/backend thật sau migrations V1–V8: PASS 6, skip 4
  theo viewport. Seed đã được đồng bộ với hierarchy V6 và expectation
  `CHAIN_ADMIN` với policy P02. Warning chunk lớn vẫn là baseline chưa có số đo
  thiết bị.

## Ranh giới và phần hoãn

- Không thêm microservice, queue, Redis, search engine, offline outbox hoặc
  production infrastructure khi chưa có requirement/ADR.
- Chưa chốt hosting/storage/retention, SSO/MFA, primary supplier nhiều NCC,
  edit/invalidate workflow hoặc cửa sổ duyệt.
- Online hiện hỗ trợ JPEG/PNG; HEIC, thiết bị iPhone thật và production rollout
  vẫn là backlog. D01 đã tích hợp trên nhánh P04/P05 nhưng chờ owner nghiệm thu; O01 backup/restore
  còn candidate riêng, chưa được owner nghiệm thu hoặc tích hợp.
- Pilot chỉ nhận security/critical fix; không migrate IndexedDB Pilot sang online.

## Điểm tiếp tục

P03 và C01 đã đóng theo owner acceptance; close record ở
[P03 plan](delivery/p03-scheduled-lifecycle/plan.json) và
[C01 plan](delivery/c01-catalog-staging/plan.json). Integration PR #5 cho chuỗi
accepted S04 → P01 → P02 → P03 → C01 đã merge vào `main`; không còn blocker
tích hợp của chuỗi này. P05 đã được owner chấp nhận và merge vào `main` ngày 23/09/2026.
P04 đã CLOSED theo owner “pass p04” ngày 23/09/2026; chưa merge/deploy.
D01 là cycle active revision 2, đã tích hợp và đạt technical gates trên baseline
P04/P05. Owner thử preview theo [handoff D01](delivery/d01-history-paging/acceptance-handoff.md);
chưa merge/deploy, chưa mở cycle khác. C02 chỉ nên mở sau khi chốt
primary supplier; primary supplier và lookup current vẫn là quyết định nghiệp vụ
riêng. Admin reset credential và bootstrap/recovery vẫn thuộc slice khác; khóa user đã có ở P04.
Kết quả P02 nằm trong
[P02 handoff](delivery/p02-scoped-authorization/acceptance-handoff.md); backlog
đầy đủ ở [roadmap 2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
