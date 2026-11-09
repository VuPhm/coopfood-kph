# ADMIN03 — sẵn sàng nghiệm thu

Candidate `0bd2c474e4cc28c9665860f1294c953c05b148c5`, revision1. Nhánh `store-app/admin03-store-membership`,
worktree `/Users/vup/Documents/coopfood-kph/.local/worktrees/admin03-store-membership`;
sole writer Codex /root, base `0adad4d1076466406c30559a9d5cbb4dfa8ba52c`.
Tiếp tục contract `664e2f0` và backend `a768bd7`, không mở cycle khác.

## Bản dùng thử đang chạy

- Admin Fresh: http://127.0.0.1:4175/#memberships — source ADMIN03, no-store,
  proxy8082 qua `ADMIN_API_TARGET`. Menu Quyền cửa hàng trong Quản lý vận hành.
- Store online: http://127.0.0.1:4173 — entry online hiện có để thử hai phiên,
  không phải Fresh mock hoặc scope Fresh online wiring.
- Backend: http://127.0.0.1:8082/actuator/health — DB thử riêng55434,
  container `coopfood-kph-admin03-acceptance`, database `coopfood_kph_admin03_acceptance`.
- Account tổng hợp: `region.admin03` (Nam/store001), `chain.admin03` (cả2store),
  `employee.admin03` (dùng phiên Store), `manager.admin03`, `catalog.admin03`.
  Password thử chung: `admin-e2e-password`. Không dữ liệu/credential vận hành.
- `inactive.admin03` có membership nhưng tài khoản ngừng hoạt động; giữ trạng thái
  account/membership riêng. Sau test, các membership thử đã revoke vẫn được giữ
  cùng audit; region/chain vẫn có quyền kế thừa hợp lệ.

## Thử nghiệm thu

1. Login Admin bằng region; mở Quyền cửa hàng, chọn001. Chỉ có store thuộc vùng Nam.
2. Gán quyền → nhập chính xác `employee.admin03` → tìm → chọn Nhân viên hoặc Quản lý
   cửa hàng → nhập lý do → lưu. Prefix/username không tồn tại không gán được.
3. Mở Store ở browser/profile khác và login employee. Request KPH được phép sau
   grant; thu hồi có lý do từ Admin làm request tiếp theo bị từ chối, không login lại.
   Reload Store chỉ để refresh context UI nếu cần, không phải yêu cầu security.
4. Thử đổi vai trò manager cuối xuống Nhân viên: backend từ chối, dialog giữ lý do/
   vai trò. Thêm quản lý thay thế trước nếu muốn thay đổi thật.
5. Thử desktop/mobile, bàn phím và gán/thu hồi/cấp lại. Chain xem được002; region
   không thấy/không được thao tác002. Chốt giao diện/flow hoặc nêu blocker cụ thể.

## Evidence và gate

[UI/integration evidence](ui-evidence.md), [backend](backend-evidence.md),
[wire/protocol khóa](contract-draft.md), [plan](plan.json).
Frontend verify358 tests + build/PWA PASS; backend80 tests được reuse do source
backend không đổi; Playwright real backend2viewport và hai phiên PASS. Technical
PASS không thay owner acceptance. Plan **AWAITING_ACCEPTANCE**, review2/2.
Chỉ đóng ADMIN03 khi có quyết định thực của owner; chưa bắt đầu KPH roadmap slice.

Files chính: membership-workspace.tsx/.css/.test.tsx, lifecycle-admin.ts,
app.tsx/admin-shell.tsx và fixture app.test.tsx; Vite proxy local và browser/seed
scripts. Không sửa backend hoặc package dependencies trong lượt UI.

## Runtime ownership / resume

Jobs launchctl hiện tại: `vn.coopfood.kph.admin03.app`, `.backend`, `.store`.
Logs ở `<worktree>/.local/runtime/admin03/{app,backend,store}.log`, private media
thử ở cùng thư mục. App arguments đã kiểm trỏ đúng worktree này. Service ADMIN02
`vn.coopfood.kph.admin02.app` đã dừng sau khi xác minh source/PID; code ADMIN02 không
bị sửa. P03 backend8081/database55433 và các runtime khác giữ nguyên.

Nếu resume: kiểm job/source/health trước khi restart, không seed lại DB đang có.
Store launcher: `node e2e/scripts/start-admin03-store.mjs`; strict port4173, backend8082.
Admin launcher: `ADMIN_API_TARGET=http://127.0.0.1:8082 npm --workspace @coopfood-kph/admin-web run preview:ui`
chỉ chạy nếu job/port4175 đã được dừng đúng ownership. Backend jar hiện có dùng
JDK21, DB/private media trên. Không tự mở thêm Admin port hoặc dừng process lạ.

Nếu cần trả preview về ADMIN02: dừng đúng `.admin03.app` rồi dùng launcher
`e2e/scripts/start-admin02-ui.sh` trong worktree ADMIN02 đã lưu; không reset data.
Không merge/push/deploy hoặc thay protected Pages. Owner acceptance còn pending.
