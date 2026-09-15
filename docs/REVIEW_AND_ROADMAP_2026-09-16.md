# Review code, kiến trúc và kế hoạch tiếp tục

Ngày: 16/09/2026. Trạng thái: **đề xuất để owner chia việc, chưa mở milestone**.

## 1. Kết luận

Giữ modular monolith Spring Boot + PostgreSQL, Store PWA/Admin Web và OpenAPI.
Không có bằng chứng trong code hiện tại cho thấy cần đổi stack hoặc tách service.
Foundation-01/02 đã tạo được luồng online hữu ích; phần thiếu lớn nhất để vận hành
là quản lý đầu vào (tài khoản, membership, catalog) và khả năng khôi phục dữ liệu.
Trước đó nên xử lý một slice nhỏ về trạng thái bất đồng bộ của Store PWA.

Thứ tự đề xuất: **ổn định online → tài khoản/cửa hàng → catalog → quy mô dữ liệu
và vận hành → thử online trên thiết bị thật**. Phân trang có thể kéo lên trước
Admin nếu lượng phiếu dự kiến lớn; không cần hoàn tất toàn bộ backlog kỹ thuật
mới làm feature tiếp theo.

### Phạm vi và độ chắc chắn

- Review trên `d9e33fd41708118a9903e4e5244e249ef3803357`, nhánh
  `codex/foundation-02-review-export-filter`; ban đầu sạch, một worktree.
- Đã đọc current state, NEXT, principles, domain contract, ADR 0001–0003,
  review 05/09, evidence Foundation-02; kiểm tra implementation và test của
  identity/store/catalog/KPH/media, migration, gateway, workspace, Excel và CI.
- Không fetch remote; `main`/remote-tracking trong máy không phải bằng chứng
  trạng thái GitHub hiện tại. Không suy diễn owner acceptance thành đã merge/deploy.
- Finding dưới đây là phân tích đường code; các race và tải lớn chưa tái hiện
  bằng browser/fault injection trong lượt này. Không kết luận có bypass backend.
- Không review pixel/UI DNA lại, không kiểm dependency CVE hay production load.

## 2. Những nền tảng nên giữ

| Vùng | Đánh giá từ implementation |
| --- | --- |
| Authorization | Security default-deny; principal refresh mỗi request; StoreAccessService kiểm membership/role. CHAIN_ADMIN không được bypass store |
| Catalog | Một resolver published/current dùng cho lookup và snapshot creation; unique barcode/current version được DB bảo vệ |
| KPH | Create có idempotency; snapshot catalog/store/actor; ngày nghiệp vụ dùng clock; review có row lock, history và audit |
| Export | Backend kiểm SUBMITTED + APPROVED, cùng store/type; `FOR SHARE OF r` bảo vệ snapshot trong transaction chuẩn bị export |
| Ảnh | Private endpoint; giữ original, derive stamped; giới hạn bytes/pixels, xử lý orientation; cleanup khi rollback |
| Contract | OpenAPI/examples/generated client đi cùng; golden fixture ngôn ngữ độc lập |
| Verification | PR workflow có frontend, backend và browser; Testcontainers không tự skip nếu thiếu Docker |

Các vấn đề cũ R01–R07 không nên được giao lại nguyên trạng: resolver, identity UI,
idempotency retry, lookup stale response, original JPEG/PNG, CI và cặp jOOQ/PG
đã có implementation/test hoặc ADR xử lý. HEIC và thiết bị thật vẫn là giới hạn
được hoãn; không gọi đó là lỗi hồi quy của milestone đã accepted.

## 3. Finding và khoảng trống còn lại

### F01 — P1: callback mutation chưa gắn với phiên/cửa hàng đang hiển thị

Nguồn: `apps/store-pwa/src/app.tsx:429`, `:715` và `:553`.
`changeOnlineStore` xóa danh sách hiện tại nhưng không vô hiệu hóa kết quả mutation
đang chờ. `saveCreatedRecord` sau `await` luôn prepend vào `records` và chọn ID;
không kiểm user/store hiện hành. `records` cũng không chứa store ID để selector
loại record sai scope.

Kịch bản cần regression: gửi tạo phiếu ở A → response bị giữ → đóng form/đổi sang
B và tải lịch sử B → response A về. Callback có thể chèn phiếu A vào màn hình B.
Đăng xuất/đăng nhập trong lúc request còn chạy cũng cần kiểm tra. Backend vẫn
lưu ở A và chặn thao tác với ID A dưới URL B; đây là lỗi ngữ cảnh frontend.

Sửa nhỏ: mutation chụp user/store/generation lúc bắt đầu; kết quả chỉ cập nhật
cache đúng scope, callback UI chỉ chạy nếu scope còn hiệu lực. Không coi abort
request là rollback transaction đã commit. Test bằng deferred promise và thêm
một browser case phù hợp. Không cần refactor toàn bộ App trước khi sửa.

### F02 — P2: dữ liệu history có hai nơi giữ trạng thái, làm khó invalidation

Nguồn: `app.tsx:214`, `:327`, `:562`, `:592`, `:721`.
History nằm trong Query cache rồi được effect sao chép sang `records`. Create
prepend vào đúng cache key đã chụp lúc submit kể cả record ngoài khoảng ngày đó;
selector hiện che nó khỏi danh sách nhưng số đếm tab vẫn lấy từ `records`.
Review chỉ sửa cache của khoảng ngày hiện tại. Background refetch/đổi filter
khi mutation chạy tạo thêm đường đua và các cache khác có thể giữ approval cũ.

Hướng sửa: online dùng Query cache làm nguồn duy nhất, Pilot tiếp tục IndexedDB
+ state riêng. Định nghĩa invalidation theo user/store; không chèn record vào
query không thỏa filter. Giữ filter/sort/selection là UI state. Bỏ compatibility
`Partial<OnlineGateway>`/legacy workspace khi đã chuyển mock test sang contract
gateway đầy đủ. Đây là refactor có mục tiêu, không đổi giao diện accepted.

### F03 — P2: xuất Excel bỏ qua store snapshot của response backend

Nguồn: `online-kph.ts:191` và `app.tsx:788`.
API export trả `store`, nhưng adapter chỉ giữ ID/thời gian/records; workbook nhận
`storeProfile` đang có ở frontend. Nếu server đổi tên/mã cửa hàng sau khi session
được tải, header Excel có thể khác store snapshot của lần export.

Giữ `store` trong `OnlineExportBundle` và dùng nó cho header online. Test response
export có store name khác session, workbook phải dùng response. Pilot giữ profile
local. Không cần API/migration mới.

### F04 — P2: batch approval thất bại một phần chưa được trình bày rõ

Nguồn: `app.tsx:586`.
`Promise.all` gửi mọi phiếu cùng lúc, reject ngay khi một request lỗi; các request
còn lại có thể tiếp tục commit. `finally` xóa busy toàn bộ và invalidation có thể
chạy trước khi các request còn lại xong. UI chỉ báo lỗi chung nên người dùng
không biết phiếu nào đã duyệt.

Đợi mọi kết quả settle, giới hạn concurrency phù hợp và refetch sau cùng; báo số
thành công/thất bại, chỉ retry phiếu lỗi. Không tự biến batch thành atomic API nếu
owner chưa yêu cầu. Test một request fail sớm, một request success muộn.

### F05 — Khoảng trống quy mô: history chưa phân trang, export có giới hạn 500

Nguồn: `KphRepository.java:103`, OpenAPI `listKphRecords`,
`KphExportRequest.java:12`, `app.tsx:465`.
List fetch toàn bộ records × photos rồi map trong bộ nhớ; client tiếp tục
filter/sort và chọn tất cả. Export API tối đa 500 record nhưng UI chưa giới hạn
selection tương ứng. Không có benchmark để kết luận chậm ở mức dữ liệu cụ thể.

Đo bằng dữ liệu tổng hợp trước; khóa paging/sort/filter/selection semantics trong
contract. Phân trang record trước khi join ảnh, giữ thứ tự ổn định. Khi phân trang,
lọc approval/sort toàn bộ tập phải thực hiện ở server nếu UI vẫn hứa như hiện tại;
không âm thầm chỉ lọc trang đang có. UI báo giới hạn 500 trước gửi export. Không
đưa queue/server Excel vào chỉ vì giới hạn này.

### F06 — Khoảng trống vận hành: DB và private media cần được khôi phục cùng nhau

Nguồn: `KphService.java:52–122`, `LocalPrivateMediaStorage.java:200`,
`application.properties`, `infra/local/compose.yaml`.
Hash/decode/stamp/file I/O vẫn chạy trong transaction create. Cleanup rollback
đã có nhưng là best effort; crash tiến trình có thể để orphan, và restore DB
riêng không phục hồi được ảnh. Chưa có runbook restore online tương ứng.

Ưu tiên backup/restore trên DB + media tổng hợp, kiểm hash original/stamped và
quyền truy cập sau restore; xây công cụ đối soát chỉ báo cáo trước. Mọi xóa orphan
phải có grace period/policy được chốt để không xóa file của transaction đang chạy.
Chỉ tách processing khỏi transaction sau khi đo lock/latency, với staging và
cleanup semantics rõ; không thêm generic storage platform trước chọn hosting.

### F07 — Khoảng trống sản phẩm: Admin mới là shell

Nguồn: `apps/admin-web/src/app.tsx`, `IdentityRepository`, `CatalogRepository`,
schema `catalog_import_*` trong V1.
Chưa có flow vận hành provisioning hoặc staging/validation/publication dù schema
đã đặt nền. Lookup hoạt động không đồng nghĩa đã có catalog import. Đây là phần
feature tiếp theo, không phải defect của Foundation-02.

Phải chốt ai quản lý user/store/membership và ai publish catalog; không suy diễn
global role hiện có thành quyền mới. Quy tắc primary supplier còn mở, nên có thể
làm staging/validation trước nhưng chưa publish dữ liệu nhiều NCC mơ hồ.

### F08 — Nợ kiến trúc có thể xử lý khi chạm vùng liên quan

- `app.tsx` 1.339 dòng chứa composition, Pilot persistence, online session/query,
  mutation, filter và presentation. Tách theo authority và trách nhiệm, giữ
  HistoryRecords/RecordView dùng chung; không đặt mục tiêu số dòng.
- KphRepository lặp projection ở list/one/export; SQL dùng tham số nên đây không
  phải finding SQL injection. Gom projection/map khi làm paging; jOOQ codegen là
  lựa chọn sau, không phải điều kiện để làm feature.
- ArchUnit hiện chỉ kiểm cycle top-level. Thêm controller không truy cập DB và
  feature không truy cập repository nội bộ feature khác khi mở Admin.
- `backend/README.md` còn mô tả endpoint/CI trước Foundation-02; CURRENT_STATE/NEXT
  tích lũy checkpoint cũ dễ gây hiểu nhầm. Giữ lịch sử ở evidence và làm phần
  hiện hành ngắn gọn khi đóng slice tiếp theo.

## 4. Backlog có thể giao từng phần

Mỗi hàng là một gói việc có thể chia thành PR nhỏ, không phải ước lượng một buổi.
Chỉ mở cycle cho gói owner chọn; bản review này không tạo candidate triển khai.

| ID | Outcome và phạm vi | Phụ thuộc | Điều kiện hoàn tất |
| --- | --- | --- | --- |
| S01 | Sửa mutation đổi scope (F01): Store PWA + regression tests | Không | Response cũ không chèn record, đổi selection hay thông báo sang user/store mới; backend idempotency giữ nguyên |
| S02 | Duyệt lô partial failure (F04): handlers + tests | S01 | Đợi toàn bộ settle; báo đúng số kết quả, retry lỗi; không mất busy của request còn chạy |
| S03 | Header Excel từ export snapshot + giới hạn selection (F03/F05) | Không | Header theo server; 500 được gửi, 501 được báo rõ trước gửi; structure/formula/image tests giữ đúng |
| S04 | Tách online state khỏi Pilot (F02/F08) | S01–S02 | Một nguồn history online; invalidation đúng user/store/filter; mock gateway đầy đủ; login/create/review/export desktop/mobile không đổi behavior |
| P01 | Chốt contract provisioning tối thiểu: quyền, bootstrap, khóa user/store, membership, reset credential | Owner quyết định policy | Role matrix và fixture được chấp nhận; không tự gán quyền admin; chưa triển khai feature |
| P02 | Provisioning vertical slice: Admin + API + backend + audit | P01 | Tạo/gán/thu hồi membership; session cũ bị thu hồi quyền ở request tiếp theo; cross-store/role tests và owner thử flow |
| C01 | Catalog staging/validate: upload tổng hợp, identifier string, lỗi theo dòng, duplicate barcode | Chốt format và quyền; P02 hoặc cơ chế bootstrap đã duyệt | Dữ liệu lỗi không xuất hiện trong lookup; leading zero giữ nguyên; upload lại có semantics rõ |
| C02 | Catalog publish nguyên tử và kiểm chứng snapshot | C01 + chốt primary supplier | Publish concurrent không tạo hai current; miss trả 0/1 đúng; KPH cũ giữ snapshot khi publish phiên bản mới; audit |
| D01 | Benchmark rồi paging history qua contract/BE/FE | S04; có thể trước Admin | Không trùng/mất record giữa trang trên dataset ổn định; filter/sort/selection rõ; query plan và số đo trước/sau ghi lại |
| O01 | Backup/restore và đối soát private media (F06) | Không cần chờ Admin, dùng dữ liệu tổng hợp | Restore DB + ảnh vào môi trường riêng, hash/lookup/access tests đạt; orphan report không tự xóa |
| O02 | Chốt profile triển khai online và kiểm vận hành | Chọn hosting/storage/retention/credential policy | ADR + runbook TLS/cookie/secret/health/backup/rollback; chặn dev defaults ở môi trường triển khai; kiểm failure mode login/upload/export |
| A01 | Nghiệm thu online trên thiết bị mục tiêu | Các gói cần cho phạm vi rollout đã đạt | Camera, JPEG/PNG, session, 3 ảnh, export và reload trên máy thật; HEIC có hành vi rõ; owner acceptance riêng với test kỹ thuật |

### Nhóm thực hiện đề xuất

1. **Đợt nhỏ kế tiếp: S01 + S02 + S03**, outcome “online ổn định khi request chậm/lỗi”.
   Có thể giao mỗi ID riêng. S04 chỉ theo sau nếu owner muốn chuẩn bị mở rộng FE.
2. **Đợt có giá trị sản phẩm: P01 → P02 → C01 → C02** để dữ liệu/tài khoản
   không còn phụ thuộc thao tác DB thủ công. C01 có thể dừng ở staging khi policy
   primary supplier chưa xong.
3. **Chuẩn bị dùng lâu dài: D01, O01, O02 → A01**. O01 có thể làm sớm độc lập;
   thời điểm D01 theo số liệu. Chỉ rollout phạm vi đã nghiệm thu.

### Quy tắc giao việc

- Một owner contract/examples/generated API; một migration active; root config,
  lockfile và packages/ui thuộc integration owner. Không tạo team trong lượt plan.
- Mỗi task ghi outcome, allowed paths, exclusions, regression cần chạy và cách
  owner thử; tối đa hai vòng review trong cycle rồi chốt/sửa blocker có giới hạn.
- API đổi phải cập nhật OpenAPI/examples/client cùng slice. Feature mới chỉ
  dùng synthetic data trong repo/test. Pilot freeze; không migrate data Pilot.
- Không trộn formatting/lint toàn repo hoặc rewrite repository vào feature PR.
- Khi bắt đầu thực thi: kiểm lại HEAD/dirty state, đọc kế hoạch này và chọn đúng
  ID; không khởi động lại Foundation-01/02 đã đóng.

### Quyết định cần owner chốt đúng lúc

Chưa cần trả lời để làm S01–S03: ai quản trị tài khoản/cửa hàng và quy trình cấp
credential (trước P01); format catalog và chọn NCC chính (trước C01/C02); số cửa
hàng/phiếu/ảnh và thiết bị mục tiêu (trước D01/A01); nơi triển khai, retention,
backup recovery target và authentication policy (trước O02).

Tiếp tục hoãn edit/invalidate, cửa sổ duyệt, HEIC conversion, offline sync,
SSO/MFA implementation và dashboard analytics đến khi có outcome cụ thể.
Không tự thêm microservice, Redis, queue hoặc migration Pilot→online.

## 5. Bằng chứng kiểm tra trong lượt review

| Lệnh / bằng chứng | Kết quả |
| --- | --- |
| `node tooling/skills/delivery-cycle/scripts/cycle.mjs inspect --repo .` | HEAD/worktree/dirty inventory đã ghi ở trên; không fetch remote |
| `npm run verify` | PASS: docs, contract, generated API drift, TypeScript, 138 tests (1 Admin + 109 Store + 2 API + 19 rules + 7 UI), build hai app |
| `./mvnw -q -Dtest=ArchitectureTest,IdentityServiceTest,StoreAccessServiceTest,LocalPrivateMediaStorageTest test` trong backend | FAIL do forked JVM exit 134/Abort trap tại LocalPrivateMediaStorageTest; không ghi nhận thành assertion failure nghiệp vụ |
| `./mvnw -q -DargLine=-Djava.awt.headless=true -Dtest=ArchitectureTest,IdentityServiceTest,StoreAccessServiceTest,LocalPrivateMediaStorageTest test` trong backend | PASS 14 tests, 0 failure/error/skip; giữ đầy đủ cùng nhóm test, chạy Java AWT headless |
| `docker info --format '{{.ServerVersion}}'` | Không kết nối được OrbStack socket; full backend verify chưa chạy lại |
| Browser E2E / online build riêng / remote CI | Không chạy lại trong review; không dùng build mặc định Pilot làm bằng chứng runtime online |

Build mặc định còn warning chunk lớn (main khoảng 526 kB, ExcelJS khoảng 930 kB;
precache khoảng 2.82 MiB). Chưa có số đo thiết bị để kết luận phải thay thư viện.
Log local tạm: `/tmp/kph-review-20260916-frontend.log`,
`/tmp/kph-review-20260916-backend-unit.log`,
`/tmp/kph-review-20260916-backend-headless.log`; không coi /tmp là evidence lưu bền.
Evidence backend 39 test và browser của Foundation-02 vẫn nằm trong
`docs/delivery/foundation-02-online-review-export/`; đó là bằng chứng lịch sử,
không phải rerun trên HEAD hôm nay.

Test kỹ thuật mới không thay thế owner acceptance của Foundation-02 hay remote
CI tại candidate mới. Lượt này chỉ sửa tài liệu; chưa sửa findings trong code.

## 6. Bước nhỏ tiếp theo

Chọn **S01**: tạo regression request chậm → chuyển cửa hàng/phiên → response cũ
về; sửa guard/cache đúng scope và chạy frontend verification. Không mở Admin hay
refactor App đồng thời trong task đầu tiên.
