# Review kiến trúc và chất lượng code — 2026-09-05

## Checkpoint làm rõ vùng dùng chung — 2026-09-09

Tiếp tục từ baseline xanh, đã sửa phần hiển thị thuộc R02 và một phần nợ code:

- `record-view.ts` chứa model trình bày và nhãn duyệt; gateway, persistence,
  Excel và UI không còn dùng type mang tên Demo. Shape dữ liệu Pilot được giữ.
- `history-records.tsx` giữ table/card/gallery/status cùng các callback optional
  cho thao tác. View không import gateway/storage hoặc tự quyết định mode;
  workspace chỉ cấp callback ghi cho Pilot. Backend vẫn quyết định authorization.
- `store-context.tsx` dùng cùng markup thông tin cho khối read-only online và
  nút cấu hình Pilot. Actor trên form online read-only và lấy từ session.
- `app.tsx` bỏ `approvalByRecord`; duyệt đơn/lô, lọc và hiển thị đều dùng
  `record.approvalStatus`. Sort số lượng dùng giá trị số sẵn có. Selection online
  đếm đúng; lỗi tải không còn được thể hiện như danh sách rỗng, có retry rõ ràng.
- Dialog xóa/export/settings chỉ mount cho Pilot; handler ghi local được guard.
  Gateway được tạo một lần mỗi mount. Chưa tách hết hydration/server state khỏi
  App; việc này sẽ đi cùng TanStack Query và login/store trong slice tiếp theo.
- `app.online.test.tsx`: 4 ca loading, session lỗi/retry/empty và hai role online;
  kiểm table/card, actor read-only và không gọi persistence/export Pilot.
  `npm run verify` pass 121 test và build; build riêng với `VITE_KPH_ONLINE=true`
  cũng pass, output ở `/tmp/kph-online-boundary-build`. Không sửa backend trong đợt này;
  baseline backend gần nhất vẫn là 30 test ở checkpoint bên dưới.

File thay đổi ngoài các file mới trên: `create-record-dialog.tsx`, `demo-records.ts`,
`online-kph.ts`, `record-store.ts`, `excel-export.ts`, hai test persistence/Excel
(đổi import type), `styles.css`, CURRENT_STATE/NEXT và tài liệu này.
Chưa commit/deploy, chưa có browser E2E; R03–R05 và R07 vẫn cần kiểm chứng riêng.

## Checkpoint khắc phục — 2026-09-09

Nội dung review bên dưới giữ bằng chứng của ngày 05/09. Working tree hiện đã
hoàn thành đợt đầu, chưa commit/deploy:

- R01: `CatalogService` dùng chung resolver cho lookup và snapshot. Ba ca
  NOT_FOUND đã xanh; thêm regression KPH giữ barcode miss và dữ liệu nhập tay
  khi tạo/reload, không suy diễn catalog ID.
- R06 phần baseline: giữ sửa seed V4 đã có ở checkpoint, tách fixture V1 khỏi
  schema mới để test upgrade không ghi cột chưa tồn tại; kiểm snapshot backfill
  sau upgrade. Smoke test dùng Flyway validation/pending và kiểm 16 bảng.
- KPH integration dùng fixed business Clock tại biên ngày UTC/Vietnam và
  `@TempDir` cho media. Các suite PostgreSQL fail khi thiếu Docker thay vì skip.
- Thêm `.github/workflows/verify.yml`: hai job frontend/backend trên PR, Docker
  preflight, JDK 21 và Node 24; không deploy. YAML và shell syntax đã kiểm local,
  chưa chạy workflow trên GitHub hoặc cấu hình required status checks.
- `npm run verify`: pass 117 test và build. Tại backend,
  `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q verify`:
  pass 30 test, failures/errors/skipped đều 0. OrbStack ban đầu tắt, đã được
  khởi động để chạy thật. `git diff --check` pass.

Các file implementation/test sửa trong đợt này: `CatalogService.java`,
`CatalogLookupHttpIntegrationTest.java`, `IdentityHttpIntegrationTest.java`,
`DatabaseSmokeTest.java`, `KphHttpIntegrationTest.java`. Tài liệu cập nhật:
`backend/README.md`, `docs/CURRENT_STATE.md`, `docs/NEXT.md` và file review này.
Các thay đổi frontend và phần KPH online có sẵn được giữ nguyên.

Bước tiếp theo là đối chiếu R02 với working tree hiện tại rồi khóa capability
Pilot/online còn lọt. Browser E2E, media/retry và quyết định version pair R07
vẫn còn mở; kết quả xanh trên local không đóng acceptance Foundation-01.

## Kết luận và phạm vi

Giữ kiến trúc modular monolith, PostgreSQL trung tâm, hai React entry point và
OpenAPI. Điểm cần đầu tư là tính nhất quán của implementation, ranh giới Pilot /
online và kiểm thử tích hợp. Stack hiện tại đủ để làm tốt sản phẩm này.

Review trên HEAD `662e6ca` cộng working tree có slice online chưa commit. Những
phát hiện trong slice này là tình trạng code đang phát triển, không phải kết luận
về bản Pilot đang vận hành. Chỉ thêm tài liệu review; chưa sửa implementation,
contract, migration, lockfile hoặc triển khai bản mới.

Đã đọc CURRENT_STATE → NEXT → ENGINEERING_PRINCIPLES → domain/UI contract → hai
ADR accepted, rồi kiểm tra frontend, API transport, backend, migration và test.
Đã chạy verification frontend và backend với PostgreSQL thật. Các ca race,
retry qua browser, HEIC, crash/rollback media dưới đây là phân tích code; chưa
được tái hiện bằng browser hay fault injection trong lượt review này.

## Bằng chứng kiểm tra

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run verify` tại root | Pass docs/fixtures, Contract Lock, API generation drift, TypeScript, 116 test và build hai app |
| `env DOCKER_HOST=unix:///Users/vup/.orbstack/run/docker.sock ./mvnw -q test` tại `backend`, ngoài sandbox | 29 test, 6 failures, 2 errors, 0 skipped; exit 1 |
| Catalog HTTP integration | 3 ca cần `NOT_FOUND` nhận `FOUND` |
| DatabaseSmokeTest | 1 assertion vẫn đếm 2 migration trong khi có 4; 4 ca khác vướng seed thiếu snapshot bắt buộc sau V4 |
| KPH integration mới | 2 test pass; chưa đủ chứng minh toàn bộ slice online hoàn chỉnh |
| Flyway trên database sạch | Áp dụng V1–V4 thành công; các lỗi smoke ở trên không chứng minh migration không chạy được |

Lần thử trong sandbox bị hạn chế Docker và có test integration bị skip dù Maven
exit 0. Đã chạy lại ngoài sandbox để có kết quả thật ở bảng trên. CI cần phát
hiện tình huống skip này.

Build Store PWA có main JS khoảng 497 kB, ExcelJS chunk khoảng 930 kB và precache
khoảng 2.79 MiB. ExcelJS đã được dynamic import. Đây là số đo build mặc định
Pilot; chưa phải benchmark mạng, CPU, bộ nhớ hay build online.

## Những lựa chọn nên giữ

- Java 21 + Spring Boot, Spring Security, Flyway và PostgreSQL: boundary giao
  dịch và authorization phù hợp nghiệp vụ phiếu, snapshot, membership.
- React + TypeScript strict, React Hook Form + Zod, Radix: đã có nền form,
  type checking và focus primitive hợp lý.
- npm workspaces, một OpenAPI, generated TypeScript client: đủ cho quy mô repo;
  ưu tiên dùng hiệu quả công cụ đã có.
- `packages/kph-rules` cho phản hồi tức thì ở frontend; fixture ngôn ngữ độc lập
  kiểm tra Java/TypeScript. Backend vẫn quyết định dữ liệu được chấp nhận.
- SQL có tham số, membership check trước truy cập, private media endpoint,
  snapshot và idempotency phía backend là những hướng đúng cần bảo toàn.
- UI desktop table và mobile card có thể dùng markup riêng vì interaction khác
  nhau; dùng chung model, selector, status và action policy ở nơi cần nhất.

## Phát hiện cần xử lý trước khi mở rộng online

### R01 — P1: logic catalog lặp đã gây lỗi thực tế

`backend/.../catalog/CatalogService.java:24,36,50` có hai nhánh `resolve` và
`resolveCurrent`. Query LEFT JOIN có thể trả một dòng catalog với `productId`
null. `resolveCurrent` xử lý đúng thành empty; `resolve` bọc dòng đó trong
`Optional.of`, khiến `lookup` trả FOUND chứa product null.

Đã xác nhận qua ba test HTTP về barcode miss, inactive và non-current data.
Đây là ví dụ cụ thể của việc cần loại bỏ logic lặp, không chỉ giảm số dòng.

Sửa nhỏ: dùng một resolver có ba kết quả rõ ràng: catalog unavailable → 503;
product không tồn tại/không active → NOT_FOUND; found nhưng thiếu NCC chính →
503. HTTP lookup và snapshot creation cùng dùng kết quả này, vẫn giữ membership
ở từng entry point. Chạy cả Catalog và KPH integration sau sửa.

### R02 — P1: ranh giới Pilot / online bị lọt qua UI

`apps/store-pwa/src/app.tsx:53,309,549,721,779`:

- Online khởi tạo `DEMO_RECORDS` vì `initialRecords` chỉ kiểm tra cờ Pilot. Khi
  session/history lỗi, dữ liệu demo có thể vẫn hiện cùng nhãn “Dữ liệu: máy chủ”.
- Selection vẫn mở `openExport` → `downloadKphWorkbook` ở online. Luồng này
  không kiểm tra STORE_MANAGER và không có server export audit; trái scope
  Foundation-01 và policy export online.
- Nút xóa dòng/lô và control duyệt vẫn được render ở một số vị trí. Handler
  xóa/duyệt có chặn online, nhưng UI không phản ánh đúng capability.
- Store settings vẫn sửa được context hiển thị ở online, trong khi create dùng
  `onlineStoreId` từ session. Người dùng có thể thấy tên cửa hàng khác dữ liệu
  server; đây là lệch context UI, chưa phải bypass membership backend.

Sửa nhỏ: online có loading/error/empty rõ ràng, dữ liệu ban đầu rỗng; khóa các
action chưa thuộc slice và hiển thị context từ session. Đặt quyết định mode ở
composition root; tách Pilot workspace và Online workspace khi refactor tiếp.
Giữ phần trình bày thực sự chung. Backend tiếp tục enforce quyền độc lập.

### R03 — P1: retry chưa giữ được idempotency từ phía người dùng

`apps/store-pwa/src/online-kph.ts:64` tạo khóa mới trong mỗi `createRecord`.
Nếu server đã commit nhưng response mất, người dùng bấm lưu lại sẽ gửi khóa
khác và có thể tạo thêm phiếu. Test backend hiện chỉ gửi lại cùng khóa.

Giữ một khóa cho một lần submit logic, tái sử dụng khi kết quả mạng chưa rõ;
payload và thứ tự ảnh phải ổn định khi retry. Khi người dùng sửa payload, coi
đó là thao tác mới theo policy rõ ràng. Kiểm chứng bằng ca server commit rồi
client nhận lỗi mạng, retry vẫn chỉ có một record và một audit tạo phiếu.

### R04 — P1: barcode lookup có thể mang dữ liệu sản phẩm cũ sang mã mới

`apps/store-pwa/src/create-record-dialog.tsx:191` chỉ thay tên/NCC khi FOUND;
nhánh NOT_FOUND chỉ đổi thông báo. Tra A thành công rồi đổi sang B không có
trong catalog có thể giữ tên/NCC của A và gửi làm dữ liệu nhập tay của B.
Response A về trễ cũng có thể ghi đè sau B vì chưa có request identity guard.

Lưu trạng thái lookup gắn với barcode đã tra; bỏ qua response cũ. Khi barcode
đổi, reset dữ liệu do catalog tự điền và cho người dùng xác nhận nhập tay khi
miss. Phân biệt field nhập tay với field tự điền để không xóa tùy tiện nội dung
người dùng. Test FOUND → NOT_FOUND và hai response trả ngược thứ tự.

### R05 — P1: pipeline ảnh online chưa bảo toàn đầy đủ evidence original

`apps/store-pwa/src/create-record-dialog.tsx:275` thay file không có MIME
JPEG/PNG bằng `processed.blob`. Blob này đã resize và đóng tem. Nếu HEIC/HEIF
decode được trên thiết bị, file được gửi dưới tên `originalFile` thực chất đã
là derivative; server tiếp tục đóng tem lần nữa. Điều này trái policy original
online. Với JPEG/PNG, code hiện giữ file gốc.

`LocalPrivateMediaStorage.java` nhận JPEG/PNG và chưa đọc EXIF timestamp/orientation
phía server; `photoLastModified` thực tế được client điền bằng timestamp đã chọn
theo EXIF. Cần phân biệt client metadata, capture time suy ra và server audit
time. Audit `createdAt` hiện đã lấy server clock, nên giữ nguyên điểm này.

Ngoài ra application.properties chưa cấu hình multipart size. Spring Boot mặc
định 1 MB/file và 10 MB/request; ảnh JPEG gốc lớn hơn giới hạn có thể bị chặn
trước handler. MockMultipartFile trong MockMvc không chứng minh đường upload
qua servlet container thực tế hoạt động. Xem [MultipartProperties](https://docs.spring.io/spring-boot/api/java/org/springframework/boot/servlet/autoconfigure/MultipartProperties.html).

Sửa theo một slice media riêng: bảo toàn bytes original, thống nhất format và
giới hạn với contract/UI, metadata bằng thư viện phù hợp, giới hạn dimensions/
pixel trước decode, lỗi upload có thông báo rõ. Nếu format chưa hỗ trợ, báo rõ
và giữ cho người dùng chọn ảnh khác; chưa được gọi stamped derivative là original.
Kiểm tra upload thật, original hash, EXIF rotation, ảnh nhỏ và tên cửa hàng dài.

### R06 — P1: bộ kiểm tra tích hợp chưa bảo vệ nhánh phát triển

`package.json` có `verify` nhưng không chạy Maven; `.github/workflows/` hiện chỉ
có workflow deploy theo tag `pilot-v*`, không có PR CI. Các test Testcontainers
dùng `disabledWithoutDocker = true`. Test KPH dùng ngày mặc định của JVM trong
payload, còn service dùng Asia/Ho_Chi_Minh, dễ lệch ngày trên runner UTC.

Sửa seed sau V4 với dữ liệu tổng hợp hợp lệ; giữ assertion kiểm đúng constraint,
tránh để lỗi thiếu snapshot che lỗi condition/unit. Thay đếm migration cứng
bằng kiểm schema/migration history có chủ đích. Thêm PR CI frontend + backend,
require Docker và fail nếu integration bị skip. Dùng fixed business Clock ở
test cần ngày ổn định. Thêm browser E2E khi nối login → store → create → reload.

### R07 — P2: tổ hợp jOOQ / PostgreSQL cần quyết định tương thích

Runtime test resolve jOOQ 3.21.5 và PostgreSQL 17.10, có warning dialect version.
POM dùng jOOQ OSS qua Boot BOM; compose và Testcontainers dùng PostgreSQL 17.
Theo [support matrix chính thức](https://www.jooq.org/download/support-matrix),
jOOQ OSS 3.21 đặt minimum PostgreSQL 18, còn 3.20 là PostgreSQL 17.

Test pass ở một số truy vấn chưa đảm bảo mọi SQL sinh ra đều tương thích.
Chốt một cặp được hỗ trợ và kiểm tra lại migrations/query. Nếu giữ Boot-managed
jOOQ 3.21, đánh giá PostgreSQL 18 trong database thử nghiệm; nếu phải giữ PG17,
đánh giá dòng jOOQ phù hợp và tương thích với Boot. Ghi ADR ngắn trước thay đổi
nền; chưa tự nâng database/volume hoặc override BOM trong lượt review này.

## Chuẩn hóa code theo mức bán senior, thực dụng

| Điểm hiện tại | Hướng cải thiện vừa đủ |
| --- | --- |
| `app.tsx` 1.048 dòng, App từ dòng 172 đến 806: hydration, CRUD Pilot, online, selection, export và JSX | Tách workspace theo authority; rút HistoryBoard, row/card và history selectors theo trách nhiệm. Chọn ranh giới theo lý do thay đổi, không áp quota dòng máy móc |
| QueryClientProvider đã có nhưng chưa dùng `useQuery`/`useMutation` | Dùng TanStack Query cho session/history/create online, key có user/store/type, invalidation sau mutation và clear cache khi logout. Giữ state giao diện ở component |
| `approvalByRecord` và `record.approvalStatus` cùng lưu một giá trị | Chọn một nguồn trong mỗi mode; lấy phần hiển thị qua selector. Gom thao tác đơn/lô nếu cùng policy, không tạo generic action engine |
| Online/persistence/export phụ thuộc `DemoRecord`, chứa cả quantity số và chuỗi, condition code bị đổi thành label | Tạo model feature có tên đúng; tách fixture demo ra test/dev. Online giữ ISO date, quantity số, enum và lookup/lifecycle metadata; format ở presentation. Không migrate dữ liệu Pilot để đổi naming |
| Java `@Size` và service `validateLength` cùng kiểm field, normalization lặp ở service/repository | Bean Validation cho shape/length; service/policy cho invariant liên trường. Chuẩn hóa input một lần ở boundary, thống nhất error semantics bằng contract test |
| Frontend quantity chỉ kiểm `Number(value) > 0`, trong khi backend/contract yêu cầu EA nguyên | Schema form kiểm finite/positive và integer theo unit; chia sẻ expected cases qua fixture. TS và Java vẫn có implementation riêng |
| `body: form as never`, enum casts trong draft | Khoanh multipart conversion ở adapter có test request thực; thu hẹp type/satisfies cho option mapping. Cast không thay thế contract verification; FormData hiện được thư viện serialize hỗ trợ |
| KphRepository dùng SQL chuỗi, `row.get("...")`, builder dài; query findAll/findOne lặp projection | Giữ repository cụ thể theo feature. Tách projection/mapping đang lặp; thí điểm jOOQ codegen sau khi chốt version pair để kiểm tên cột và type lúc compile |
| ArchUnit chỉ kiểm cycle top-level | Thêm vài rule đúng ranh giới: controller không truy cập DB trực tiếp; feature không truy cập repository nội bộ feature khác; domain/policy không phụ thuộc web nếu đã tách |
| `check` chỉ là tsc; chưa có lint/formatter gate | Thêm ESLint với Hooks/TypeScript rules, một formatter JS/TS và một formatter Java. Áp dần theo file chạm, giữ format-only PR riêng |

TanStack Query định danh cache bằng query keys chứa các biến mà query phụ thuộc;
store/user phải nằm trong thiết kế cache của ứng dụng này. Xem
[Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys).
jOOQ codegen cho phép Java compile dựa trên schema; cần một pipeline tái lập từ
database sạch đã chạy Flyway. Xem [jOOQ code generation](https://www.jooq.org/doc/latest/manual/code-generation/).

Một số lặp nên giữ: DTO request/response khác persistence model, validation UI
và backend, expectation độc lập trong test, table và card markup. Tiêu chí gom
code là cùng một quyết định nghiệp vụ đang phải sửa nhiều chỗ. Helper ba dòng
hoặc DTO giống hình dạng chưa đủ lý do tạo framework chung.

## Cải thiện tiếp sau khi flow online ổn định

- `KphService.create` giữ transaction/advisory lock trong lúc hash, decode và
  ghi ảnh. Tách image processing khỏi file storage khi sửa slice media. File I/O
  không rollback cùng DB; catch hiện tại không bắt được lỗi commit sau khi method
  đã return. Cần cleanup theo transaction completion và đối soát orphan khi crash,
  có test lỗi giữa chừng. Local staging + cleanup rõ ràng đủ cho Foundation.
- KPH list hiện trả toàn bộ phiếu/ảnh metadata của cửa hàng, chưa phân trang.
  Đo với dữ liệu tổng hợp tăng dần rồi bổ sung paging ở contract + backend + UI
  trước rollout nhiều dữ liệu; nếu cursor, phân trang record trước khi join ảnh.
- Online gateway chọn `stores[0]`, chưa có login/store picker và Vite chưa proxy
  `/api`. Chốt same-origin development path, context membership rõ ràng và test
  full browser flow trước khi gọi Foundation-01 hoàn tất.
- `NEXT.md` vẫn ghi create/list là bước tiếp theo; CURRENT_STATE đã ghi có
  implementation. README mô tả deploy theo branch trong khi workflow chạy tag.
  Đồng bộ tài liệu theo acceptance thực tế; docs checker hiện chỉ kiểm tồn tại
  và JSON syntax nên không phát hiện chênh lệch này.
- Đo thời gian mở app, scan, xử lý ba ảnh và export trên thiết bị mục tiêu.
  Giữ offline precache cần thiết cho Pilot; online build có thể loại capability
  chưa dùng. Warning bundle lớn riêng lẻ chưa đủ lý do thay thư viện Excel.

## Lộ trình đề xuất trong Foundation-01

Đây là các PR nhỏ trong milestone đang active, không mở thêm milestone song song.
Mỗi PR có một kết quả quan sát được, test phù hợp và rollback độc lập khi có thể.

| Thứ tự | PR / allowed scope gợi ý | Điều kiện hoàn tất |
| --- | --- | --- |
| 1 | **Sửa catalog resolver**: catalog service + test liên quan | 3 ca NOT_FOUND xanh; KPH snapshot vẫn đúng; full backend rerun phân biệt lỗi còn lại |
| 2 | **Khôi phục baseline test và PR CI**: test seed, clock, workflow; docs hiện trạng do owner tích hợp | 29 test hiện tại chạy thực và xanh, không skip integration; frontend verify xanh trên PR |
| 3 | **Khóa online workspace**: app composition, session/store context, online test | Session lỗi không hiện demo; không xuất/duyệt/xóa theo Pilot; context từ membership |
| 4 | **Lookup và submit ổn định**: form lookup state, gateway, regression tests | Response trễ không ghi nhầm hàng; NOT_FOUND không mang tên cũ; retry tạo một phiếu |
| 5 | **Ảnh online đúng contract**: media slice, contract/examples/client nếu cần | Original hash giữ nguyên, timestamp/orientation đúng, upload thật đạt giới hạn đã chốt; cleanup có test |
| 6 | **Hoàn chỉnh đường online và browser E2E**: login/store, dev integration, browser tests | Login → lookup → tạo 1–3 ảnh → reload lịch sử; role/store và expired session có coverage |
| 7 | **Refactor từng vùng**: history/model/query, rồi repository; root tooling do integration owner | Giảm nguồn state trùng, code feature đọc độc lập, UI DNA/fixture/E2E giữ đúng |

Chốt ADR version pair R07 trước khi mở rộng jOOQ codegen hoặc đổi runtime DB.
Ở PR 5, contract và schema migration mỗi loại chỉ có một owner active. Root
config, lockfile và packages/ui thuộc integration owner. Pilot đã freeze tiếp
tục chỉ nhận security/critical fix; refactor ở hướng Foundation online và không
tạo release Pilot chỉ để đồng nhất style.

Bước nhỏ tiếp theo: R01 — gom resolver catalog, dùng ba test HTTP đang đỏ làm
regression guard. Sau đó xử lý seed/CI; chưa nên bắt đầu bằng việc chia nhỏ toàn
bộ app hoặc viết lại tầng dữ liệu.
