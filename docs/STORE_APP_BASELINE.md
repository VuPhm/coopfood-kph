# Store App baseline

Trạng thái: Round 0 — baseline để vào Round 1 UI/UX/Brand DNA.
Baseline implementation đã kiểm: `main` tại
`35db9b359016b95e10eaa2dcebd335468223a5d8` (2026-09-24).
Tình trạng delivery mới nhất nằm ở [CURRENT_STATE](CURRENT_STATE.md), không ở
SHA lịch sử này.

## Hướng sản phẩm

Tiến hóa repository này thành **Co.op Food Store Operations App** mobile-first:
một tài khoản và app shell chung cho các capability cửa hàng. KPH và tra cứu sản
phẩm/barcode đã có implementation; kiểm kê, nhận hàng, theo dõi tồn kho/DATE và
báo cáo là hướng module tương lai, chưa được coi là feature đã triển khai hoặc
contract API đã chốt. “Sổ tay” là ẩn dụ tổ chức thông tin và công việc, không
yêu cầu các hệ thống kỹ thuật tách biệt.

## Kiến trúc hiện tại

| Vùng | Nguồn cần xem |
| --- | --- |
| Store PWA, gồm online và Pilot path | [`apps/store-pwa`](../apps/store-pwa), đặc biệt [`app.tsx`](../apps/store-pwa/src/app.tsx) và [`online-kph.ts`](../apps/store-pwa/src/online-kph.ts) |
| Admin Web | [`apps/admin-web`](../apps/admin-web) |
| Client OpenAPI, rule frontend, UI primitives | [`packages/api`](../packages/api), [`packages/kph-rules`](../packages/kph-rules), [`packages/ui`](../packages/ui) |
| Spring Boot modular monolith | [`backend/src/main/java`](../backend/src/main/java/vn/coopfood/kph) |
| PostgreSQL + Flyway | [`V1–V9 migrations`](../backend/src/main/resources/db/migration) |
| Contract và bằng chứng | [`OpenAPI`](../contracts/openapi/kph.openapi.yaml), [`fixtures`](../contracts/fixtures), [`backend tests`](../backend/src/test), [`Playwright`](../e2e) |

Backend là authority cho identity, authorization, store scope và dữ liệu online.
Store PWA và Admin Web là hai entry point trên cùng OpenAPI. Đọc
[contract index](product/STORE_APP_CONTRACTS.md) trước khi đổi luồng; xem
[ADR-0001](adr/0001-foundation-stack.md) cho lựa chọn stack.

## Cách tiến hóa code

Làm vertical slice nhỏ trên task branch từ `main`, không viết lại big-bang. Modular monolith là
mặc định cho tới khi có bằng chứng và ADR khác. Giữ data history, contract
nghiệp vụ/API/bảo mật, fixture và test đã xác nhận; migration đã chạy là
forward-only. Không thêm compatibility layer cho cơ chế cũ chỉ vì nó tồn tại.

Phân loại code hiện tại ở mức quyết định: **PRESERVE** migrations, fixture,
pure KPH rules và backend logic/test đã kiểm; **ADAPT** API client, scanner,
media, store/auth context, KPH flow và UI primitive thực sự dùng chung;
**REPLACE** KPH-centric shell/IA, mode-switch composition và cách UI chỉ khám phá
store qua membership; **RETIRE khỏi target online** Pilot IndexedDB/local
authority và demo fallback sau khi có thay thế. Giữ behavior không bắt buộc giữ
class hay screen hiện tại. Pilot vẫn cần để tái tạo Pages.

Round 1 được thiết kế lại shell, global navigation, IA, ranh giới screen/modal,
responsive composition, component hierarchy, token và biểu đạt thương hiệu.
Workflow nhận biết được và capability semantics của scope, scan → lookup, tạo
KPH, history/review/export và evidence ảnh phải tiếp tục đúng theo
[contract index](product/STORE_APP_CONTRACTS.md) và
[UI DNA](product/UI_DNA.md). Tài liệu này không chốt UI mới.

## Pages được bảo tồn riêng

- Nhánh Pages đang hoạt động: `codex/github-pages-pwa`, không dùng làm workspace
  Store App và không rebase/rewrite/rename/delete/merge tùy tiện.
- Commit bảo tồn: `c789714870eff5912e10fe89361bd845d9e3983d`.
- Tag annotated bất biến: `preserve/github-pages-pwa-2026-09-24-c789714` trỏ
  đúng commit trên.
- Mọi thay thế Pages là một quyết định deploy/cutover riêng, explicit, có thể
  quay lại. Store App không tự kế thừa IndexedDB hay release path của Pilot;
  xem [ADR-0002](adr/0002-local-only-pilot-pwa.md) và
  [ADR-0006](adr/0006-store-app-evolution.md).

Task mới dùng `store-app/<task-id>-<slug>` trên worktree riêng; `exp/*` chỉ dành
cho thử nghiệm không tự merge. Tên nhánh giữ task identity khi đổi executor.
Ưu tiên worktree sibling `../coopfood-kph-worktrees/<task-id>`; nếu Codex cấp
path khác, ghi path thực tế. Ghi base SHA, scope và writer trong handoff; xem
[delivery workflow](DELIVERY_WORKFLOW.md) cho milestone nhiều bước.
