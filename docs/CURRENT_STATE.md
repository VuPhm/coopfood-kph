# Trạng thái hiện tại

Cập nhật: 2026-10-09

## UI repair — revision 7 trên worktree riêng

Theo yêu cầu owner “còn rất nhiều lỗi, cứ rà và sửa” ngày 09/10/2026, cycle
`figma-mobile-implementation` tiếp tục trên `store-app/qa-20261009-sheet-focus`,
worktree `/Users/vup/.codex/worktrees/store-sheet-focus/coopfood-kph` từ checkpoint
`b180484`. Preview mock riêng: <http://127.0.0.1:5177/>.

Đã sửa focus khi đóng dialog, Escape giữa các lớp, giữ draft tiện ích nhanh khi
đóng Account, route lifetime/focus, tìm kiếm DATE/KPH có khoảng trắng, Lookup
name recovery và kết quả trễ, copy DATE quá hạn, kích thước header/tab/CTA/chevron,
icon tìm kiếm và hàng action DATE desktop. `npm run verify` PASS 205 tests/build;
5 gate Playwright gồm hai viewport bắt buộc và 7 kích thước responsive PASS.
Hai lượt review kỹ thuật đã khép lại; owner visual/workflow acceptance pending.
[Evidence r7](delivery/figma-mobile-implementation/technical-evidence-r7.md),
[handoff r7](delivery/figma-mobile-implementation/acceptance-handoff-r7.md) và
[plan](delivery/figma-mobile-implementation/plan.json) ghi candidate và giới hạn.

Task khác đang sửa kết quả Tra hạn lùi trên worktree gốc. Round này không sửa
component/test/script kết quả hoặc CSS shelf của task đó. Cần review tích hợp
stylesheet khi kết hợp hai nhánh. Không đổi API/backend/Pilot, không merge/push,
deploy hoặc viết Figma; mock vẫn chỉ giữ thay đổi trong phiên.

## Giai đoạn

Cycle `figma-mobile-implementation` tiếp tục ở **AWAITING_ACCEPTANCE revision 5**
trên nhánh `store-app/figma-mobile-implementation`. Round sửa theo QA 08/10 đã
xử lý 5 lỗi P2: ID fixture KPH trùng, DATE mất state/count khi đổi màn, mobile
lùi trạng thái DATE đã xử lý, tiện ích hạn lùi còn nổi/ID trùng và UPC bị ghi thành
SKU. Metadata Tra cứu theo fixture, vùng bấm mobile và CTA Tra cứu cũng đã sửa.
Candidate được ghi trong [plan](delivery/figma-mobile-implementation/plan.json).
`npm run verify` PASS **193 tests** và build; Playwright headless ở
390×844 / 1440×1024 đạt gate sửa lỗi, aggregate UI và KPH calendar.
Owner visual/workflow acceptance vẫn pending. Xem
[evidence r5](delivery/figma-mobile-implementation/technical-evidence-r5.md),
[handoff r5](delivery/figma-mobile-implementation/acceptance-handoff-r5.md) và
[plan sửa r5](delivery/figma-mobile-implementation/implementation-plan-r5.md).

Revision 3/4 icon repairs và evidence được giữ làm lịch sử. Mock vẫn memory-only:
DATE giữ cập nhật khi đổi màn trong cùng phiên, reload sẽ reset fixture. Không đổi
API/backend/Pilot, không sửa frame Figma. Technical PASS không suy ra merge,
push, deploy hoặc Pages cutover.

Theo yêu cầu owner ngày 03/10/2026, giao diện mobile từ Figma `aEDpXtz0IiEkPiVucqjQ3Q`
đã được triển khai trên working tree nhánh `store-app/figma-mobile-implementation`.
Home, tra cứu hạn lùi, KPH và DATE chạy với fixture tổng hợp trong dev; desktop
co giãn tạm thời khi owner tiếp tục thiết kế. Technical gate PASS 164 tests,
build và Playwright 390×844 / 1440×1024; chưa có owner visual acceptance.
[Implementation handoff](delivery/figma-mobile-implementation/handoff.md) ghi scope,
icon replacements, preview và giới hạn mock/API. Lượt [review/sửa](delivery/figma-mobile-implementation/review.md)
ngày 03/10/2026 đã xử lý stale date ở tra hạn lùi, count/filter KPH và vùng
bấm/focus/spacing; `npm run verify` PASS 169 tests. Owner visual acceptance
vẫn pending, API/desktop parity chưa được chứng minh.
Thông tin R2-01 bên dưới là baseline lịch sử; không phải mô tả giao diện mới.

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
  <http://127.0.0.1:4173>; owner đã xác nhận “pass” ngày 24/09/2026.
  Cycle CLOSED, close checker PASS tại `8144b7c`; tích hợp cùng P04 qua
  [PR #8](https://github.com/VuPhm/coopfood-kph/pull/8), merge commit
  `1a339f3` ngày 24/09/2026. CI frontend/backend/browser đều PASS; chưa deploy.
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
  vẫn là backlog. O01 backup/restore
  còn candidate riêng, chưa được owner nghiệm thu hoặc tích hợp.
- Pilot chỉ nhận security/critical fix; không migrate IndexedDB Pilot sang online.

## Điểm tiếp tục

R2-01 đã CLOSED trên candidate `3799a30`; [technical evidence](delivery/r2-01-shell-spine/technical-evidence.md)
và owner acceptance ghi rõ preview tổng hợp, giới hạn chưa chạy lại real-backend
E2E khi Docker không sẵn sàng, và visual refinement được hoãn. Không tự mở
R2-02 hoặc suy ra quyền merge/deploy từ nghiệm thu này.

P03 và C01 đã đóng theo owner acceptance; close record ở
[P03 plan](delivery/p03-scheduled-lifecycle/plan.json) và
[C01 plan](delivery/c01-catalog-staging/plan.json). Integration PR #5 cho chuỗi
accepted S04 → P01 → P02 → P03 → C01 đã merge vào `main`; không còn blocker
tích hợp của chuỗi này. P05 đã được owner chấp nhận và merge vào `main` ngày 23/09/2026.
P04 đã CLOSED theo owner “pass p04” ngày 23/09/2026 và tích hợp cùng D01 qua
[PR #8](https://github.com/VuPhm/coopfood-kph/pull/8) vào `main` tại
`1a339f3` ngày 24/09/2026; CI frontend/backend/browser đều PASS. Chưa deploy.
D01 revision 2 đã CLOSED theo owner “pass” ngày 24/09/2026 trên baseline
P04/P05; [owner decision](delivery/d01-history-paging/acceptance-handoff.md).
Đã tích hợp, không còn cycle active và chưa deploy. C02 chỉ nên mở sau khi chốt
primary supplier; primary supplier và lookup current vẫn là quyết định nghiệp vụ
riêng. Admin reset credential và bootstrap/recovery vẫn thuộc slice khác; khóa user đã có ở P04.
Kết quả P02 nằm trong
[P02 handoff](delivery/p02-scoped-authorization/acceptance-handoff.md); backlog
đầy đủ ở [roadmap 2026-09-16](REVIEW_AND_ROADMAP_2026-09-16.md).
