# ADMIN03 checkpoint

Nhánh `store-app/admin03-store-membership`; worktree
`/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`;
base `0adad4d1076466406c30559a9d5cbb4dfa8ba52c`, sole writer Codex /root.
Backend candidate `a768bd75f0821fb14e8383a3565c2cbfd1269dc7`. Giữ quyết định owner exact username lookup ngoài vùng
ở checkpoint09/11/2026, không cần hỏi lại. Không mở cycle/branch khác.

## Đã hoàn tất

- Contract-first `664e2f0`: 5 API, 6 fixture và generated client.
- Backend: scoped stores/memberships, exact lookup, upsert/revoke, guard last-manager,
  atomic audit, CSRF và hiệu lực request kế tiếp.
- Protocol khóa thống nhất với user deactivation/lifecycle; không migration.
- Full backend verify PASS **80 tests**, gồm 15 membership và bốn race có forced
  overlap. HTTP hai phiên grant/revoke cùng phiên Store PASS; quyền kế thừa giữ đúng.
- Docs/contracts/API generation/TypeScript/4 client tests PASS.

[Evidence mới](backend-evidence.md), [wire/locking](contract-draft.md),
[plan](plan.json). Plan EXECUTING, gate contract và backend PASS;
UI/browser/owner vẫn pending. Backend PASS không phải nghiệm thu toàn milestone.

## Bước tiếp theo

Nối workspace Quyền cửa hàng vào Admin Fresh: chọn scoped store, list membership,
lookup username chính xác → role/reason → submit; revoke có lý do, giữ dữ liệu
khi guard conflict, refresh backend sau mutation. Không optimistic authority.
Dùng component/token hiện có, mobile/keyboard semantics; kiểm Playwright
390×844 và 1440×1024, hai phiên với backend thật, rồi owner acceptance.
Không có blocker cần owner trả lời trước khi triển khai workspace.

Không thay đổi runtime preview trong lượt backend này. Preview4175 ADMIN02 chỉ
là ghi nhận từ checkpoint trước; chưa kiểm lại process/URL. Khi chuyển sang
ADMIN03, xác minh đúng source/process rồi giữ canonical port4175, không mở port
ngầm. Không sửa ADMIN01/ADMIN02, không merge/push/deploy hoặc chạm protected Pages.
