# ADMIN02 revision11 — green desktop header

Owner12/11/2026 yêu cầu header Store/Admin desktop nền xanh theo cơ chế mobile,
bỏ đường line thừa ở header/sidebar; sau vòng này tích hợp vào luồng BE đang
tiến hành song song. Đây là quyền tích hợp local, không phải deploy/push/Pages
hoặc final acceptance toàn bộ workflow online.

Base `7f878f6`. Sole writer `/root`, nhánh/worktree ADMIN02 giữ nguyên.

## Implementation

Shared Fresh header gradient120°, chữ trắng và màu phụ88% trắng. Store desktop
giữ72px, cùng nền xanh với hero; Admin desktop từ768px dùng cùng token, menu
portal vẫn trắng. Focus trên xanh màu trắng, avatar/hover/source indicator rõ.
Sidebar vẫn trắng với logo light nguyên gốc; bỏ line header, brand, rail và
footer rail, không xóa separator của bảng dữ liệu hoặc viền trạng thái nghiệp vụ.
Store mobile không đổi trong revision11.

## Technical verification

- Admin build/typecheck và19component tests PASS.
- Store mock build/typecheck/PWA PASS; warning ExcelJS lớn giữ nguyên.
- `node e2e/scripts/check-desktop-chrome.cjs`: PASS6Admin viewports và3Store
  viewports×7routes, header green/no lines, nav/menu/password/focus, mobile
  computed baseline. Đã xem ảnh Admin/Store. Lần đầu gặp CSS HMR có padding
  approval khác baseline; cold restart đúng Store preview4176 đã PASS, không
  thay CSS nghiệp vụ hoặc hạ assertion để bỏ qua khác biệt.
- `npm run check:docs`, `git diff --check`: PASS.

Admin browser dùng API fixtures; không suy backend authorization từ UI checks.
Metadata cuối và integration evidence ghi riêng sau checkpoint code.

## Integration boundary

Luồng “Tiếp tục lộ trình” đang sửa KPHON03 tại worktree riêng, có uncommitted
code. Checkpoint ổn định gần nhất là KPHON02 `4bcbb48` (owner cho tiếp với UI
debt), gồm ADMIN03 membership và KPHON01/02 online. Tích hợp vào worktree riêng
từ checkpoint này, giữ nguyên worktree active; bảo toàn membership navigation,
scope/session focus và các contract/backend hiện hành. Nhánh BE01–BE16 cũ chỉ
là provenance, không merge cả lịch sử thử nghiệm đó.
