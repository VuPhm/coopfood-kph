# Kế hoạch đóng Foundation-01

Ngày đánh giá: 2026-09-09. Trạng thái: `CLOSED` ngày 2026-09-13 trên
implementation candidate `92fb895b`; owner acceptance và CI remote đã đạt.
Model thực hiện theo yêu cầu owner: `gpt-5.6-luna`, reasoning `max`.

## Đích và điểm dừng

Đóng milestone đang active: từ database sạch, người dùng đăng nhập, chọn cửa
hàng thuộc membership, lookup barcode, tạo phiếu TPCN/TPTS với 1–3 ảnh và xem
lại đúng dữ liệu sau reload. Có bằng chứng browser/API, dữ liệu tổng hợp và
hướng dẫn chạy tái lập. Đây là hoàn tất Foundation-01; chưa phải production rollout
hoặc hoàn tất mọi chức năng của sản phẩm.

Giữ modular monolith, PostgreSQL, React và OpenAPI hiện có. Chỉ refactor phần
cần sửa để đạt luồng trên. Không mở vòng tổng rà soát mới sau khi đạt các gate.

## Kết quả nhìn quanh nhánh và task

Đã kiểm `git branch -avv`, graph, ancestor counts, `git cherry`, worktree và
`git ls-remote --heads origin` ngày đánh giá. Remote heads khớp các remote refs
local; không có nhánh Foundation nào trên origin. Chỉ có một worktree hiện tại.
Các task khác của dự án được liệt kê ở trạng thái `notLoaded`; không đánh thức
lại các vòng reviewer/implement cũ.

| Nhánh | Bằng chứng so với HEAD `662e6ca` | Quyết định |
| --- | --- | --- |
| `codex/foundation-01-migration-coherence` | HEAD; KPH online và nhiều sửa mới còn trong working tree | Dùng làm nguồn integration, cần checkpoint trước khi chia team |
| `codex/foundation-01-contract-lock` | Ancestor, HEAD hơn 2 commit | Đã có; không làm lại |
| `codex/foundation-01-identity` | Ancestor, HEAD hơn 3 commit | Tái sử dụng session/membership/API |
| `codex/pilot-00-closeout` | Ancestor, HEAD hơn 4 commit | Pilot đã đóng; giữ freeze |
| `main`, `codex/github-pages-pwa`, `feat/ui-refinements` | Đều ancestor; HEAD hơn lần lượt 11, 14, 34 commit | Không cần merge ngược các nhánh này |
| `codex/ui-optimization` | Một commit riêng `28ca636`, `git cherry` đánh dấu tương đương patch đã có | Không cherry-pick lại |
| `codex/wip-20260903-planning` | Một commit riêng `30fa3a0`, 40 file; chứa roadmap/ADR khác | Không merge nguyên nhánh; giữ provenance cho milestone sau |

WIP chứa ADR-0003 mang nhãn Accepted nhưng chọn stamped-only, OIDC, JDBC session,
outbox và production storage. Nó chưa có trong lịch sử nhánh active và mâu thuẫn
với yêu cầu hiện hành của owner: giữ original + stamped và không mở outbox trong
Foundation này. Kế hoạch áp dụng AGENTS.md/contract và ADR accepted trên nhánh
active; không tự chuyển các quyết định WIP thành yêu cầu triển khai. Trước milestone
production, owner cần đối chiếu riêng roadmap WIP; không xóa hoặc gán lại trạng thái
các ADR ở nhánh đó trong đợt này.

## Đánh giá phần còn thiếu

- Nền contract, identity, catalog, migration và UI Pilot đã có. KPH create/list,
  snapshots, media và adapter online đã có implementation nhưng chưa acceptance.
- Online mới nhận session có sẵn và lấy store đầu tiên; chưa khép login/chọn
  membership/logout/session hết hạn. Cần làm xong trải nghiệm này.
- Lookup/retry đã có sửa dở. Cần chứng minh response cũ không ghi đè form và retry
  không tạo trùng; key hiện có hai nơi quản lý, dễ giữ key khi payload thay đổi.
- Media phải kiểm chính xác original, EXIF/orientation, timestamp fallback, giới
  hạn decode/upload và cleanup khi transaction thất bại. Form hiện chặn ngoài
  JPEG/PNG trong submit chung, trong khi picker vẫn nhận HEIC/HEIF: cần phân biệt
  policy online/Pilot, tránh regression Pilot và tránh thay original bằng stamped.
- Có PR CI nhưng chưa có kết quả trên GitHub, chưa có browser E2E. Cặp phiên bản
  jOOQ/PostgreSQL cần giải quyết cảnh báo tương thích đã ghi trong review R07.
- `app.tsx` còn lớn nhưng kích thước file không phải blocker. Các view dùng chung
  và state duyệt đã được làm gọn; không tiếp tục tách component chỉ để giảm dòng.

Bằng chứng gần nhất: frontend `npm run verify` 121 test và build pass; backend
30 test, không skip, với Docker/PostgreSQL 17. Đây là checkpoint trước lượt lập
kế hoạch; chưa phải bằng chứng acceptance cho các thay đổi team sắp thực hiện.

## Wave 0 — integration owner khóa đầu vào

Một người/agent điều phối sở hữu bước này trước khi dispatch.

1. Kiểm inventory tracked/untracked, không bỏ sót KPH, migrations V3/V4, online
   gateway/tests và workflow. Tạo checkpoint có review từ working tree hiện tại;
   ghi SHA thực tế vào từng giao việc. Không mở team từ HEAD cũ `662e6ca`.
2. Khóa contract và policy ảnh hiện hành. Nếu online cần thêm định dạng hoặc đổi
   multipart, chốt thiết kế nhỏ trước khi A/B triển khai vùng giao nhau. Không bỏ
   yêu cầu original; không lặng lẽ cắt khả năng ảnh Pilot đã accepted. HEIC online
   chưa chứng minh được thì ghi giới hạn rõ, không tuyên bố hỗ trợ.
3. Xác minh support matrix chính thức rồi chọn một cặp jOOQ/PostgreSQL được hỗ
   trợ, ghi ADR ngắn và đường nâng cấp. Không nâng major database đang có dữ liệu
   bằng cách thay image tag. Chốt trước khi team viết bằng chứng integration.
4. Tạo worktree riêng từ cùng checkpoint cho mỗi team. Mỗi file chỉ một owner;
   không chạy ba team sửa trong thư mục chung. Root config, lockfile, packages/ui,
   contracts/examples/generated client và migration chỉ integration owner sửa.

Wave 0 hoàn tất khi có SHA, phiên bản runtime và bảng ownership được ghi trong
prompt giao việc; thiếu các đầu vào này thì chưa dispatch implementation.

## Wave 1 — ba team Luna max

Các nhãn A/B/C dưới đây là gói việc, chưa phải task/nhánh đã được tạo.

### Team A — hoàn chỉnh Store PWA online

Allowed paths: `apps/store-pwa/src/**`, trừ test E2E bên ngoài src. Sở hữu duy
nhất `app.tsx`, `create-record-dialog.tsx`, `online-kph.ts`, CSS và unit/component
 tests frontend. Không chỉnh packages dùng chung hoặc backend.

- Tận dụng API auth/session/store hiện có để login, chọn membership, logout và
  xử lý hết session; không tự xây SSO/provisioning mới.
- Dùng TanStack Query cho session/history của luồng đang hoàn thiện theo ADR-0001;
  query key có store scope, clear dữ liệu cũ khi đổi user/store, chặn stale response.
- Một owner cho idempotency ở mỗi lần gửi: retry cùng nội dung giữ key; thay nội
  dung/ảnh/store tạo lần gửi mới có chủ đích. Có test timeout sau server commit,
  sửa draft sau lỗi, đổi store và đóng/mở form. Không suy fingerprint chỉ bằng
  tên/kích thước/lastModified khi cần phân biệt bytes ảnh.
- Kiểm barcode đổi/xóa/scan lại, response đến đảo thứ tự, FOUND → NOT_FOUND và lỗi
  mạng; giữ nhập tay hợp lệ, không lưu thông tin auto-fill của mã trước.
- Tích hợp policy ảnh Wave 0; giữ original file, Pilot HEIC không bị guard online
  chặn. Không mở lại approve/export/delete online.

Dừng khi tests vùng trên pass và flow chạy bằng API thật; giao diff, lệnh/test,
API yêu cầu nếu có và tối đa một danh sách blocker cụ thể. Không refactor toàn app.

### Team B — tính toàn vẹn KPH và evidence backend

Allowed paths: `backend/src/main/java/vn/coopfood/kph/kph/**`,
`backend/src/test/java/vn/coopfood/kph/kph/**`. Dependency/config/migration cần
đổi thì đề xuất patch cho integration owner, không tự sửa ngoài phạm vi.

- Giữ bytes original, tạo stamped đúng thứ tự/giới hạn/metadata đã accepted;
  dùng thư viện metadata chuẩn, không viết EXIF parser.
- Kiểm MIME thực, ảnh hỏng, EXIF orientation, timezone và timestamp fallback,
  ảnh nhỏ/ảnh lớn; đặt bound trước decode để tránh cấp phát không giới hạn.
- Chứng minh original và stamped private, chặn cross-store/không session;
  không log nội dung ảnh hoặc PII đầy đủ.
- Cleanup file khi ghi ảnh sau thất bại hoặc DB rollback/commit failure; kiểm
  retry/idempotency ở server không sinh thêm phiếu/ảnh. Không thêm queue/object
  storage framework hoặc chạy tác vụ dọn dữ liệu thật.
- Tái sử dụng catalog resolver và snapshot đã có; chỉ sửa nếu test chỉ ra lỗi.

Dừng khi các case media/transaction/security pass trên runtime Wave 0. Giao
bằng chứng checksum original, thứ tự ảnh, private access và rollback cleanup.

### Team C — acceptance và kiểm chứng độc lập

Allowed paths: `e2e/**` (mới), `docs/evidence/foundation-01/**` (mới).
Harness/config/fixture seed cần ở path khác thì integration owner áp dụng.
Không sửa source của A/B hoặc mở task reviewer đệ quy.

- Chuẩn bị E2E trên backend thật + PostgreSQL sạch + seed tổng hợp; mock chỉ dùng
  cho test thành phần, không thay browser acceptance. Credential chỉ dev/test,
  không thêm tài khoản mặc định cho production.
- Chạy luồng login → chọn store → barcode FOUND và NOT_FOUND/manual → tạo TPCN
  và TPTS → reload history/ảnh. Bao phủ 1 và 3 ảnh, table/card viewport.
- Kiểm EMPLOYEE/STORE_MANAGER membership, session hết hạn, đổi store không lộ
  dữ liệu cũ; backend tests chịu ma trận authorization đầy đủ.
- Kiểm retry không tạo trùng bằng lỗi mạng được điều khiển; ghi cách tái lập,
  browser/runtime, kết quả và giới hạn chưa kiểm trên thiết bị thật.
- Viết một báo cáo review tập trung contract/security/data integrity/regression;
  góp ý style tách backlog, không chặn acceptance.

Team C làm harness trong lúc A/B triển khai; chạy acceptance chính thức sau khi
integration owner đã tích hợp cả A và B.

## Wave 2 — tích hợp, sửa blocker, đóng

Integration owner nhận A/B, giải quyết vùng chung đúng ownership, áp dụng E2E
harness/CI và regenerate API nếu contract đổi. Reviewer C kiểm bản tích hợp.
Tối đa hai vòng review có kế hoạch: vòng đầu tìm blocker, vòng hai xác nhận sửa.
Nếu còn blocker sau vòng hai, ghi trạng thái BLOCKED với lỗi tái lập/owner/bước
cần thiết; không đánh dấu done, không tự mở vòng đánh bóng vô hạn.

Gate đóng (tất cả bắt buộc):

- [x] Luồng browser thật Wave 1 đạt từ database sạch, cho cả hai loại phiếu.
- [x] Snapshot, ngày nghiệp vụ, membership, retry và private original/stamped có
  test; không regression các hành vi Pilot bị chạm.
- [x] `npm run verify` pass; build online pass; backend `./mvnw verify` có Docker,
  migration sạch/nâng cấp pass và không skip integration; E2E pass.
- [x] PR Verify chạy xanh trên đúng SHA tích hợp sau khi có bước push/PR; nếu chưa
  thực hiện được thì ghi pending, không gọi local pass là CI pass.
- [x] Tất cả source mới đã nằm trong commit bàn giao; docs state/NEXT, hướng dẫn
  run/seed/test và evidence đồng bộ. Không để phần implementation chỉ ở untracked.
- [x] Không còn blocker contract/security/data-loss/luồng chính. Ghi giới hạn
  device/format chưa kiểm đúng thực tế; không tuyên bố production-ready.

Khi đạt gate: cập nhật Foundation-01 CLOSED, bàn giao SHA/evidence và dừng.
Không tự deploy, bật milestone mới hoặc tiếp tục chạy reviewer.

## Hoãn có chủ đích

Chưa làm trong đợt này: đổi toàn bộ repository mapping sang jOOQ generated DSL,
chia nhỏ mọi file, thay mọi state bằng hook, tối ưu bundle chỉ vì warning, mở rộng
UI kit, admin/provisioning/import, approve/export online, OIDC production,
outbox/queue, cloud storage, hosting và vận hành production. Roadmap WIP được
đối chiếu lúc owner mở milestone tương ứng. Lỗi bảo mật hoặc sai contract phát
hiện trong các vùng này vẫn phải được triage nếu tác động slice đang bàn giao.

## Mẫu prompt dispatch

“Bạn là team [A/B/C], model Luna max. Đọc AGENTS.md và tài liệu bắt buộc; áp dụng
`docs/FOUNDATION_01_COMPLETION_PLAN.md`, chỉ thực hiện gói [A/B/C]. Base SHA:
[SHA Wave 0 thực tế]; worktree: [đường dẫn thực tế]. Chỉ sửa allowed paths đã giao.
Giữ nguyên contract nghiệp vụ; gửi yêu cầu vùng chung cho integration owner.
Không tự tạo subagent/task hoặc mở rộng scope. Chạy checks liên quan rồi dừng và
bàn giao: file/diff, lệnh và kết quả, blocker còn lại. Không deploy.”

## Dispatch thực tế — 2026-09-09

Base chung: `2c456ea23f690a9c0cb353331e934b54906b4019`.
Runtime: Java 21 / PostgreSQL 17 / jOOQ 3.20.17 theo ADR-0003; cần full verification
sau override. Policy online JPEG/PNG original + stamped private, chưa hỗ trợ HEIC
online; giữ hành vi HEIC Pilot. Không đổi multipart trong đợt dispatch.

| Agent | Worktree | Branch |
| --- | --- | --- |
| `/root/team_a_online` | `/tmp/kph-foundation-team-a` | `codex/foundation-team-a` |
| `/root/team_b_media` | `/tmp/kph-foundation-team-b` | `codex/foundation-team-b` |
| `/root/team_c_acceptance` | `/tmp/kph-foundation-team-c` | `codex/foundation-team-c` |

Root giữ integration và các vùng dùng chung. C chuẩn bị harness trước, chỉ chốt
acceptance trên SHA tích hợp A/B. Không push/deploy khi dispatch.

### Kết quả team đã nhận — chờ tích hợp

- A: `b277082b4804c932b18c332151bcaccef85ee759`; báo typecheck, 102 frontend
  tests và build pass trong worktree A.
- B: `92aecc8`; báo compile, 5 media unit và 4 KPH integration pass; yêu cầu
  integration owner thêm metadata-extractor 2.19.0 và multipart limits.
- C: `a0638893cb4d8d653cc11717977801b3aea73275`; harness parse 8 cases,
  chưa chạy acceptance thật; cần SHA tích hợp/runtime theo config-request.

Đây là báo cáo team, chưa phải xác nhận root đã tích hợp hoặc nghiệm thu.
Bước tiếp theo: review diff/ownership, áp dụng config request, tích hợp A/B/C,
chạy gates rồi đưa owner thử bản online. Quy trình dùng lại cho các vòng tiếp theo
nằm trong `DELIVERY_WORKFLOW.md`; không mở vòng planning Foundation mới.
