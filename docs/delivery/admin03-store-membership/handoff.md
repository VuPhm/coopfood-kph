# ADMIN03 checkpoint

Nhánh `store-app/admin03-store-membership`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`;
base `0adad4d1076466406c30559a9d5cbb4dfa8ba52c`, kế thừa ADMIN02. Sole writer
Codex /root. Giữ quyết định owner exact username lookup ngoài vùng theo
checkpoint ngày 09/11/2026; không cần hỏi lại quyết định này.

## Đã hoàn tất

Contract-first source `664e2f0fb0a02d382247be892ba104de46fe1340`: 5 API dự kiến trong OpenAPI, 6 fixture API và
manifest, generated client, negative schema checks và 4 client tests.
[Evidence](contract-evidence.md). Docs/contracts/client generation/TypeScript/
client tests PASS. Backend/UI membership chưa triển khai; không coi API schema
là endpoint đang chạy. [Plan](plan.json) EXECUTING, chỉ gate contract đạt.

## Bước tiếp theo

Triển khai backend theo OpenAPI và kiểm scope/audit/concurrency. Trước khi code
mutation, giải quyết protocol khóa với IdentityAdminService và LifecycleService
như evidence đã ghi. Sau đó nối workspace Quyền cửa hàng vào shell Admin Fresh,
kiểm hai phiên backend thật và Playwright; owner acceptance vẫn pending.
Không có blocker cần owner trả lời ở bước backend. Không mở cycle/branch khác.

ADMIN02 preview4175 được ghi nhận ở checkpoint trước; lượt này không thay đổi
process, không kiểm lại URL và không gắn nhãn nó là ADMIN03. Khi chuyển preview
sang runtime mới, xác minh đúng process/source và giữ canonical port4175.
Không merge/push/deploy; không sửa ADMIN01/ADMIN02 hoặc protected Pages.
