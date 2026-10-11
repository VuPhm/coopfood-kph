# Trạng thái hiện tại

**KPH Co.op Fresh r13 đã được owner duyệt ngày 11/10/2026** qua “duyệt, checkpoint”.
Phạm vi: giao diện danh sách/form/sheets, hai CTA cam/xanh và tab tương phản rõ
trên preview 4201. Technical PASS: build, contrast 66 trạng thái, Fresh 3 viewport
và progressive layout; workflow/mock regression có bằng chứng riêng. Lưu checkpoint
local trên `store-app/figma-mobile-implementation`; không push/merge/deploy.
[Bàn giao và nghiệm thu](delivery/figma-mobile-implementation/kph-coop-fresh-colors.md).

Các trạng thái pending ở mục r12 trở xuống là lịch sử hoặc gate khác (backend,
thiết bị thật, cycle trước), không phải nghiệm thu giao diện KPH r13 hiện tại.

Cập nhật: 2026-10-11

Owner yêu cầu “làm” kế hoạch KPH Fresh: r12 triển khai F1–F3 trong working tree
trên base `c8365e6`. Danh sách/thẻ/bảng, form và skeleton, detail/filter/export
cùng Co.op Fresh; tìm/sắp xếp hiện trên mobile. Evidence và preview riêng ở
[bàn giao KPH Fresh](delivery/figma-mobile-implementation/kph-coop-fresh-handoff.md).
Technical PASS: `npm run verify` 228 tests/build, mock/online build và 9 gate
Playwright; geometry skeleton ≤1px, không shift, workflow/workbook/offline PASS.
Owner visual/workflow acceptance cho bản này pending; lịch sử chuẩn bị bên dưới
không còn là trạng thái runtime hiện hành. Không suy ra merge/deploy từ lượt này.

Trong lúc nghiệm thu, owner yêu cầu lập kế hoạch nâng KPH và đặt tên phong cách.
**Co.op Fresh** (`coop-fresh-v1`) được ghi là mặc định thiết kế cho các nâng cấp
Store PWA tiếp theo trong [Visual DNA](product/STORE_APP_VISUAL_DNA.md).
[Kế hoạch KPH r11](delivery/figma-mobile-implementation/kph-coop-fresh-plan.md)
chi tiết rollout r6: danh sách → tạo phiếu → chi tiết/duyệt/xuất. Chỉ cập nhật
docs trên checkpoint `91f0c70`; chưa reskin, gate nghiệm thu hiện tại giữ nguyên.

Git checkpoint 11/10 theo yêu cầu owner: lưu toàn bộ các follow-up UI và tối ưu
hiện tại trên nhánh `store-app/figma-mobile-implementation` bằng commit local.
Các ghi chú “chưa commit” bên dưới là trạng thái lịch sử trước checkpoint này.
Checkpoint không thay owner acceptance còn pending; chưa push/merge/deploy.

Progressive loading follow-up 11/10: KPH/form và Home dùng khung đúng geometry,
khung nhẹ tải song song entry; giữ scroll form, ảnh Home WebP responsive.
Technical PASS 180 tests, build mock/online, layout ≤1px/0 shift trong lab hai
viewport, lazy/focus/recovery, workflow và offline gồm ảnh mới.
[Bàn giao](delivery/figma-mobile-implementation/progressive-loading.md).
Owner visual acceptance/điện thoại còn pending; preview 4197, không deploy.

Offline follow-up 11/10 theo clarification owner: chỉ bản Store App hiện tại,
bỏ hướng prototype 6 shell. Đăng ký worker ở entry này, giữ precache lazy
chunks, copy đúng dữ liệu phiên/online và toast không che toolbar mobile.
Technical PASS 180 Store PWA tests, build mock/online, Playwright offline reload/
form/export/tra hạn lùi hai viewport. [Bằng chứng](delivery/figma-mobile-implementation/kph-offline.md).

KPH loading follow-up 11/10: tách entry/workspace/form/Excel theo thời điểm dùng,
skeleton + recovery, prefetch trang online đúng scope, memo hóa và chỉ mount một
layout danh sách. Technical PASS 178 Store PWA + 12 UI tests, build mock/online,
Playwright loading/error/focus/paging và toàn luồng tạo/duyệt/xuất hai viewport.
Build CPU 6×: JS Home giảm 29,9%, DOM KPH giảm 45–47%; cold navigation thêm
24–56 ms, có skeleton; prefetch theo ý định cải thiện thời gian sau click.
[Bằng chứng](delivery/figma-mobile-implementation/kph-loading.md).
Bước nhỏ tiếp theo: owner thử build `http://127.0.0.1:4197/#kph` trên thiết bị
đã thấy >600 ms; chưa field INP/real-backend/owner acceptance.

Modal theo tài khoản follow-up 11/10: áp dụng đúng header gradient xanh, chữ trắng,
X inverse và body trắng/lề 24px; giữ bố cục thao tác tạo/quét/xem ảnh.
Technical PASS 180 Store + 12 UI + 14 Admin tests, check/build; Playwright modal
5 viewport trên dev/build, X Store/Admin/PWA, motion 2, header 6 và workflow 2 PASS.
Owner visual acceptance còn pending, bước nhỏ tiếp theo: xem popup tra và lọc tại
`http://127.0.0.1:5175/#kph`. [Bàn giao](delivery/figma-mobile-implementation/modal-account-reference.md).

Modal chung follow-up 11/10: popup tra dùng Radix modal/backdrop tối 55% không
blur, khóa cuộn/focus và giữ state phiên. Shared chrome/motion/X; sheet mobile
sát đáy, desktop centered. Store 177 + UI 12 + Admin 14 tests/build PASS;
Playwright modal 5, close controls Store/Admin/PWA và workflow/header gates PASS.
Build CPU 6× popup median mobile/desktop 96/88 ms, max 128/152 ms; đây là lab,
lần đầu tài khoản desktop còn 504 ms. Visual acceptance/thiết bị thật pending.
[Bàn giao](delivery/figma-mobile-implementation/modal-unification.md).
Bước nhỏ tiếp theo: owner thử backdrop/X tại `http://127.0.0.1:5175/#kph`.

## Giai đoạn

Modal INP follow-up 11/10: bỏ blur backdrop chung, tách state mở tài khoản/lọc/
tạo phiếu khỏi workspace và giảm render form; giữ Radix/focus/workflow.
174 Store PWA + 12 UI tests, TypeScript/build và Playwright PASS.
Build CPU 6×: trung vị mobile tài khoản/lọc/tạo 56/64/128 ms; lần mở đầu
lớn nhất 280 ms. Đây là lab latency, owner còn cần đo trên thiết bị đã thấy
>600 ms. [Bằng chứng](delivery/figma-mobile-implementation/modal-inp.md).
Bước nhỏ tiếp theo: thử build tại `http://127.0.0.1:4187/#kph`.

Mobile toolbar follow-up 11/10: thanh dưới 4 mục Trang chủ/Tra cứu/KPH/DATE,
active xanh/mint và safe-area; nút nổi “Tra hạn lùi” dạng capsule peach trên thanh.
Popup giữ phía trên navigation, state/focus/route semantics cũ. Playwright toolbar,
Home scroll và Home regression 5 viewport PASS; TypeScript/build và 174 Store PWA tests PASS (2 workers).
[Bằng chứng](delivery/figma-mobile-implementation/mobile-toolbar.md).
Bước nhỏ tiếp theo: owner thử thanh dưới/nút nổi tại `http://127.0.0.1:5176/#kph`.

Đăng nhập follow-up 11/10: áp dụng lớp form trắng cuộn trên nền xanh sticky,
mobile một cột và desktop giữ hai cột. Technical PASS 14 tests, TypeScript/build,
Playwright scroll/identity 5 viewport và online API fixture 2 viewport.
[Bằng chứng](delivery/figma-mobile-implementation/login-scroll-layer.md).
Bước nhỏ tiếp theo: owner cuộn `http://127.0.0.1:5176/#login` để xem hình ảnh.

Home follow-up 11/10: khối nội dung trắng là lớp trên, cuộn tự nhiên lên che
header xanh giữ vị trí; chỉ áp dụng Home. Technical PASS Playwright 5 viewport,
TypeScript, 6 targeted tests và build. [Bằng chứng](delivery/figma-mobile-implementation/home-scroll-layer.md).
Owner đã chấp nhận tài khoản/login bằng “ổn”; cơ chế cuộn Home mới chờ xem hình ảnh.
Bước nhỏ tiếp theo: cuộn Home tại `http://127.0.0.1:5176/#home`.

Tài khoản + đăng nhập theo DNA đã triển khai theo yêu cầu owner ngày 11/10/2026;
revision 7 được owner visual acceptance bằng “ổn”; technical PASS trên working tree:
`npm run verify` 216 tests/build, Playwright account/login 5 viewport, online API
fixture 2 viewport và Home regression PASS. [Bàn giao](delivery/figma-mobile-implementation/account-login-refinement.md).
Preview: avatar ở `http://127.0.0.1:5176/#home`; đăng nhập ở
`http://127.0.0.1:5176/#login`. Login UI được dùng lại cho online gateway hiện có;
bản dev có lối vào dữ liệu mẫu riêng, không tạo session giả. Chưa real-backend/
thiết bị thật, chưa commit/merge/deploy.
Các trang còn lại giữ kế hoạch r6 hoãn; owner yêu cầu cuộn Home trước.

Home đã được owner nghiệm thu hình ảnh ngày **11/10/2026** bằng “quá đẹp,
tích hợp vào dna, chuẩn bị điều chỉnh các trang còn lại theo”. Header xanh,
logo nhỏ Home-only, thẻ pastel/icon tròn, giỏ thực phẩm và sóng mint đã được ghi
vào [Visual DNA](product/STORE_APP_VISUAL_DNA.md), liên kết từ
[Store App UI DNA](product/STORE_APP_UI_DNA.md). Check/build, 4 session tests và
Playwright 5 viewport PASS; [Home evidence](delivery/figma-mobile-implementation/home-brand-refinement.md).
Acceptance này chỉ cho Home/hướng thị giác, không đóng workflow gate r5 hoặc
lịch sử shelf. Code/asset vẫn ở working tree, chưa commit/merge/deploy.

Trước yêu cầu tài khoản/login, cycle ở **PLANNING revision 6** để chuẩn bị áp dụng DNA:
nền UI chung → Tra cứu → DATE → KPH → Tra hạn lùi. Chuẩn bị tài liệu hoàn tất,
chưa triển khai reskin các màn còn lại. [Kế hoạch](delivery/figma-mobile-implementation/visual-dna-rollout-plan.md)
ghi scope, gate và checkpoint cần có. R5 giữ lịch sử nghiệm thu riêng ở
[plan-r5](delivery/figma-mobile-implementation/plan-r5.json); gate rollout r6 pending.

Follow-up 11/10: dời mốc Cảnh báo/Hạn lùi gần tỷ lệ ngày (khoảng 56%/78%),
bù khoảng nhãn; Hôm nay vẫn khớp các mốc. Test liên quan 28 PASS, build và
Playwright main/popup mobile/desktop PASS; xem
[evidence timeline](delivery/figma-mobile-implementation/shelf-result-reference.md).

Follow-up mới: lịch sử 20 lần tra hợp lệ gần nhất **chỉ ở màn chính, trong phiên**,
theo lựa chọn owner ngày 10/10/2026. Desktop form/result cạnh nhau và lịch sử bên
dưới; mobile dùng thẻ. `npm run verify` PASS 214 tests/build và bốn gate Playwright
Tra lùi hàng PASS. Owner visual acceptance cho lịch sử còn pending; xem
[bàn giao lịch sử](delivery/figma-mobile-implementation/shelf-history.md).

Follow-up tiện ích Tra lùi hàng đã được owner xác nhận “đạt, thu dọn” ngày
10/10/2026. Holder/state/tự tra và glow/motion đã chốt, test mobile/desktop PASS;
xem [nghiệm thu và cleanup](delivery/figma-mobile-implementation/shelf-empty-state.md).
Phạm vi holder/state/glow trước đó đã đóng, chưa commit/merge/deploy. Nghiệm thu này không thay
gate owner cho toàn cycle revision 5 bên dưới.

Lịch sử revision 5: `figma-mobile-implementation` ở **AWAITING_ACCEPTANCE**
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
