# KPHON01 checkpoint

Candidate `751df44f207a8d6ff76068cbe2bcbdbce00d1cd4`, implementation81744fe, revision1. Branch
`store-app/kphon01-effective-context`, worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/kphon01-effective-context`.
Base b6bd19a từ ADMIN03 đã owner accepted/CLOSED; sole writer root.
Không merge main hoặc nhánh BE cũ, không push/deploy/Pages.

## Outcome đã kiểm

GET /api/v1/kph/stores + OpenAPI/fixture/client, same policy predicates với KPH;
Fresh online session/login/chọn store explicit/CSRF/logout/password. Store/vùng/
chain scope union, downgrade/revoke, expiry/offline không fallback mock. Legacy
session/GET /stores và entry mock/online cũ giữ riêng.

20 unique backend targeted tests,22 unique frontend targeted tests, API/schema/
TypeScript/builds online+mock và Playwright real-backend2viewport PASS.
[Evidence](evidence.md), [contract](../../product/STORE_KPH_CONTEXT_CONTRACT.md),
[ADR0007 proposed](../../adr/0007-kph-effective-store-context.md).
Owner đã ghi nhận KPHON01 **tạm đạt** ngày09/11/2026; plan CLOSED trong phạm vi
context. [Quyết định và hai vòng để sau](acceptance-2026-11-09.md).
Kiểm tổ hợp cuối còn để vòng cuối theo owner, không gọi slice này là full KPH PASS.

## Preview thật

- Fresh online: http://127.0.0.1:4173 — login, chọn store và xem context/quyền.
- Admin đã accepted: http://127.0.0.1:4175 — source ADMIN03, cùng backend8082.
- Fixture: `region.admin03` (001), `chain.admin03` (001/002), `manager.admin03`;
  password tổng hợp `admin-e2e-password`. Employee hiện đã revoke sau test;
  có thể cấp lại bằng Admin để thử refresh context. Catalog-only không scope.
- Các route nghiệp vụ chưa nối hiện rõ chưa kết nối. KPH thực hiện trên UI mới
  còn lookup/history/create/review/export; không tạo kỳ vọng backend DATE/report.

Jobs `vn.coopfood.kph.kphon01.backend`/`.store`, logs ở
`<worktree>/.local/runtime/kphon01/`. Jar dùng JDK21, DB thử ADMIN03 tại55434,
media giữ path của worktree ADMIN03. Admin job `vn.coopfood.kph.admin03.app`
không đổi. Backend8082 và module source4173 đã kiểm cuối healthy. Không seed lại
DB đang dùng hoặc dừng process khác. Store launcher
`node e2e/scripts/start-kphon01-store.mjs` strict4173, chỉ chạy khi port/job trống.

## Bước nhỏ tiếp

Nối lookup barcode và history KPH trên context này; giữ D01 server filter/sort/
paging/count, page-local selection/reset. Sau đó create/private media/idempotency,
review/export và tổ hợp trọn KPH. Khi gắn draft/form phải giữ state phù hợp trong
revalidation và clear đúng khi scope mất/đổi, không mang authority từ mock.
Không hỏi lại quyết định ADMIN03/KPHON01 tạm đạt. Giữ một vòng test kỹ/tổ hợp,
rồi một vòng UI/UX cho sau; chưa chạy và chưa coi là nghiệm thu cuối hoặc rollout.
